import { expect, test, type Page } from "@playwright/test";
import { canvas, openLab, snap } from "./helpers";

type Doc = { nodes: Record<string, { type: string; children: string[]; data: { blockType?: string } }> };

const readDocument = (page: Page) => page.evaluate(() => window.__lab!.document()) as Promise<Doc>;
const blocks = (doc: Doc) => Object.values(doc.nodes).filter((n) => n.type === "block");
const COLUMN = "section-0-row-col-0";
const mod = process.platform === "darwin" ? "Meta" : "Control";

async function selectHeading(page: Page) {
  await canvas(page).getByRole("heading", { name: "Lab heading" }).click();
}

test("undo and redo work from the bar and the keyboard, including with focus in the canvas", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const undo = page.getByRole("button", { name: "Undo" });
  const redo = page.getByRole("button", { name: "Redo" });
  await expect(undo).toBeDisabled();

  const before = blocks(await readDocument(page)).length;
  await selectHeading(page);
  await page.keyboard.press("Delete");
  expect(blocks(await readDocument(page))).toHaveLength(before - 1);
  await expect(undo).toBeEnabled();

  await page.keyboard.press(`${mod}+z`);
  expect(blocks(await readDocument(page))).toHaveLength(before);

  await page.keyboard.press(`${mod}+Shift+z`);
  expect(blocks(await readDocument(page))).toHaveLength(before - 1);

  await undo.click();
  expect(blocks(await readDocument(page))).toHaveLength(before);
  await redo.click();
  expect(blocks(await readDocument(page))).toHaveLength(before - 1);
});

test("typing in the inspector keeps its own undo and delete", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const before = blocks(await readDocument(page)).length;
  await selectHeading(page);

  const input = page.locator('[data-reb-field="content"] input, [data-reb-field="content"] textarea').first();
  await input.click();
  await page.keyboard.press("Backspace");

  expect(blocks(await readDocument(page))).toHaveLength(before);
});

test("copy and paste duplicates a block, and cut moves it", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openLab(page, { scenario: "blocks" });
  const before = blocks(await readDocument(page)).length;

  await selectHeading(page);
  await page.keyboard.press(`${mod}+c`);
  await page.keyboard.press(`${mod}+v`);
  expect(blocks(await readDocument(page))).toHaveLength(before + 1);
  await expect(canvas(page).getByRole("heading", { name: "Lab heading" })).toHaveCount(2);

  await page.keyboard.press(`${mod}+x`);
  expect(blocks(await readDocument(page))).toHaveLength(before);
  await page.keyboard.press(`${mod}+v`);
  expect(blocks(await readDocument(page))).toHaveLength(before + 1);
});

test("duplicate, keyboard reorder and deselect work", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const before = blocks(await readDocument(page)).length;

  await selectHeading(page);
  await page.keyboard.press(`${mod}+d`);
  expect(blocks(await readDocument(page))).toHaveLength(before + 1);
  await page.keyboard.press(`${mod}+z`);

  await selectHeading(page);
  const firstBefore = (await readDocument(page)).nodes[COLUMN].children[0];
  await page.keyboard.press("Alt+ArrowDown");
  const doc = await readDocument(page);
  expect(doc.nodes[COLUMN].children[1]).toBe(firstBefore);

  await page.keyboard.press("Escape");
  await expect(page.getByText("Select an element to edit it")).toBeVisible();
});

test("breadcrumbs show the selection and select parents", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await selectHeading(page);

  const crumbs = page.locator('[data-reb-part="breadcrumbs"]').getByRole("button");
  await expect(crumbs).toHaveText(["container", "section", "row", "column", "heading"]);

  await crumbs.nth(1).click();
  await expect(page.getByText("section layout")).toBeVisible();
  await expect(crumbs).toHaveCount(2);

  await snap(page, "editing-breadcrumbs");
});

test("devices show different widths, and the email stays centered", async ({ page }) => {
  await openLab(page, { scenario: "blocks", exportPane: false });
  const frame = page.locator('[data-reb-part="frame"]');

  const widthFor = async (title: string) => {
    await page.getByTitle(title).click();
    await page.waitForTimeout(400);
    return (await frame.boundingBox())!.width;
  };

  const desktop = await widthFor("Desktop / PC View");
  const mobile = await widthFor("Mobile View");
  expect(mobile).toBeLessThan(380);
  expect(desktop).toBeGreaterThan(700);
  await snap(page, "editing-mobile");

  await page.getByTitle("Desktop / PC View").click();
  await page.waitForTimeout(400);
  const email = (await canvas(page).locator('[data-node-type="container"]').boundingBox())!;
  const box = (await frame.boundingBox())!;
  expect(Math.abs(email.x - box.x - (box.x + box.width - (email.x + email.width)))).toBeLessThan(4);
  await snap(page, "editing-desktop");
});

test("the save status follows edits", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const status = page.locator('[data-reb-part="editor-status"]');

  await selectHeading(page);
  await page.keyboard.press("Delete");
  await expect(status).toHaveText("Unsaved changes");
  await expect(status).toHaveText("Saved");
  expect(await page.evaluate(() => localStorage.getItem("email-builder-draft"))).toContain("section-0");
});

test("clicking a block card on an empty email builds its layout", async ({ page }) => {
  await openLab(page, { scenario: "empty" });
  await page.getByRole("tab", { name: /blocks/i }).or(page.getByRole("button", { name: /^blocks$/i })).first().click();

  const card = page.locator('[data-insert-id="block:heading"]');
  await expect(card).toBeEnabled();
  await snap(page, "editing-palette");
  await card.click();

  await expect(canvas(page).getByRole("heading")).toBeVisible();
});
