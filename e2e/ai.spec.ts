import { expect, test, type Page } from "@playwright/test";
import { canvas, exportFrame, openLab, snap } from "./helpers";

type Doc = { nodes: Record<string, { type: string; children: string[]; data: { blockType?: string; props?: Record<string, unknown>; styles?: Record<string, unknown> } }> };

const readDocument = (page: Page) => page.evaluate(() => window.__lab!.document()) as Promise<Doc>;
const input = (page: Page) => page.getByPlaceholder("Tell AI what to build or style...");
const review = (page: Page) => page.locator('[data-reb-part="ai-review"]');

async function ask(page: Page, prompt: string) {
  await input(page).fill(prompt);
  await input(page).press("Enter");
}

test("a turn can be reviewed, showing what changed, and undone in one action", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "blocks" });
  const before = await readDocument(page);

  await ask(page, "Add a hero");
  await expect(canvas(page).getByText("Hero from the AI")).toBeVisible();
  await expect(review(page)).toContainText(/added/i);
  await expect(page.locator('[data-reb-part="turn-summary"]')).toContainText(/tokens/);
  await expect(canvas(page).locator("[data-reb-ai-changed]").first()).toBeAttached();
  await snap(page, "ai-review");

  await review(page).getByRole("button", { name: "Undo" }).click();
  await expect(review(page)).toHaveCount(0);
  await expect(canvas(page).getByText("Hero from the AI")).toHaveCount(0);
  expect(await readDocument(page)).toEqual(before);
  await expect(canvas(page).locator("[data-reb-ai-changed]")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("undoing a turn keeps the undo history from before it", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });

  await canvas(page).getByRole("heading", { name: "Lab heading" }).click();
  await page.keyboard.press("Delete");
  await ask(page, "Add a hero");
  await expect(review(page)).toBeVisible();
  await review(page).getByRole("button", { name: "Undo" }).click();
  await expect(canvas(page).getByText("Hero from the AI")).toHaveCount(0);

  await page.evaluate(() => {
    window.__lab!.undo();
    window.__lab!.undo();
    window.__lab!.undo();
  });
  await expect(canvas(page).getByRole("heading", { name: "Lab heading" })).toBeVisible();
});

test("keeping a turn clears the review and the highlights", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await ask(page, "Add a hero");
  await review(page).getByRole("button", { name: "Keep" }).click();

  await expect(review(page)).toHaveCount(0);
  await expect(canvas(page).locator("[data-reb-ai-changed]")).toHaveCount(0);
  await expect(canvas(page).getByText("Hero from the AI")).toBeVisible();
});

test("a running turn can be stopped, leaving a valid document", async ({ page }) => {
  await page.goto("/?scenario=blocks&ai=fake&export=1&aiDelay=150");
  await ask(page, "keep going forever");

  await expect(canvas(page).getByText("Hero from the AI").first()).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  await expect(page.getByText("Stopped.")).toBeVisible();

  const count = await canvas(page).getByText("Hero from the AI").count();
  await page.waitForTimeout(500);
  await expect(canvas(page).getByText("Hero from the AI")).toHaveCount(count);

  await expect(exportFrame(page).getByText("Hero from the AI").first()).toBeVisible();
  await expect(page.getByTestId("export-error")).toHaveCount(0);
  await snap(page, "ai-stopped");

  await review(page).getByRole("button", { name: "Undo" }).click();
  await expect(canvas(page).getByText("Hero from the AI")).toHaveCount(0);
});

test("a failed request explains itself in plain words, and can be retried", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await ask(page, "this will fail");

  await expect(page.getByText(/busy or out of quota/)).toBeVisible();
  await expect(page.getByText("HTTP 429")).toHaveCount(0);
  await snap(page, "ai-error");

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("It worked this time.")).toBeVisible();
});

test("the AI can be asked about one element, inline, without its instructions showing in chat", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await canvas(page).getByText("Lab paragraph", { exact: false }).first().click();
  await canvas(page).locator('[data-reb-action="ai.ask"]').click();

  const inline = canvas(page).locator('[data-reb-part="ai-inline"]');
  await expect(inline).toBeVisible();
  await snap(page, "ai-inline");
  await inline.getByRole("button", { name: "Make it shorter" }).click();

  await expect(canvas(page).getByText("Shorter", { exact: true })).toBeVisible();
  await expect(page.getByText("Shortened it.")).toBeVisible();
  await expect(inline).toHaveCount(0);
  await expect(page.getByText("Make it shorter").first()).toBeVisible();
  await expect(page.getByText("NODE CONTEXT")).toHaveCount(0);

  const doc = await readDocument(page);
  expect(doc.nodes["section-0-row-col-0-heading-0"].data.props?.content).toBe("Lab heading");
});

test("suggestions follow the selection", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const suggestions = page.locator('[data-reb-part="ai-suggestions"]');
  await expect(suggestions).toHaveCount(0);

  await canvas(page).getByText("Lab paragraph", { exact: false }).first().click();
  await expect(suggestions.getByRole("button", { name: "Make it shorter" })).toBeVisible();

  await canvas(page).getByText("Lab button").click();
  await expect(suggestions.getByRole("button", { name: "Write a stronger call to action" })).toBeVisible();
  await snap(page, "ai-suggestions");
});

test("the AI can restyle every heading consistently", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await ask(page, "Make all the headings purple");

  await expect(page.getByText("Restyled the headings.")).toBeVisible();
  await expect(canvas(page).getByRole("heading", { name: "Lab heading" })).toHaveCSS("color", "rgb(124, 58, 237)");
});

test("what the verifier still objects to is shown after the turn, with one reply", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await ask(page, "Make that text pale");
  await expect(page.getByText("Made it pale.", { exact: true })).toBeVisible();

  await expect(page.locator('[data-reb-part="turn-issues"]').last()).toContainText(/contrast/i);
  await snap(page, "ai-issues");
});
