import { expect, test, type Page } from "@playwright/test";
import { canvas, exportFrame, openLab, snap } from "./helpers";

type Doc = { nodes: Record<string, { type: string; data: { mobile?: { hide?: boolean }; props: { content: string } } }> };
const readDocument = (page: Page) => page.evaluate(() => window.__lab!.document()) as Promise<Doc>;
const COLUMN_TEXT = "section-0-row-col-0-text-1";

async function openSection(page: Page, id: string) {
  const section = page.locator(`[data-section-id="${id}"]`);
  const trigger = section.getByRole("button").first();
  if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
  return section;
}

/** Renders the real export at phone width, in its own page. */
async function viewExport(page: Page, width: number, scheme: "light" | "dark" = "light") {
  const html = await page.evaluate(() => window.__lab!.exportHtml());
  const preview = await page.context().newPage();
  await preview.setViewportSize({ width, height: 800 });
  await preview.emulateMedia({ colorScheme: scheme });
  await preview.setContent(html);
  return preview;
}

test("the subject and preheader are set for the email and reach the export", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const form = page.locator('[data-reb-part="email-settings"]');
  await form.getByLabel("Subject").fill("Spring is here");
  await form.getByLabel("Preheader").fill("Our new range, first look");

  await expect.poll(() => page.evaluate(() => window.__lab!.exportHtml())).toContain("<title>Spring is here</title>");
  expect(await page.evaluate(() => window.__lab!.exportHtml())).toContain("Our new range, first look");
  await snap(page, "mature-settings");

  await page.evaluate(() => window.__lab!.undo());
  await page.evaluate(() => window.__lab!.undo());
});

test("variables can be inserted, previewed with sample data, and exported for a platform", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await canvas(page).getByText("Lab heading").click();

  const content = page.locator('[data-reb-field="content"]');
  await content.locator("input").fill("Hi ");
  await content.locator('[data-reb-part="insert-variable"]').selectOption("first_name");
  await expect(content.locator("input")).toHaveValue("Hi {{first_name}}");

  await page.getByTitle("Switch to Preview Mode").click();
  await expect(canvas(page).getByRole("heading", { name: "Hi Sam" })).toBeVisible();
  await snap(page, "mature-preview");
  await page.getByTitle("Switch to Editor Mode").click();
  await expect(canvas(page).getByRole("heading", { name: "Hi {{first_name}}" })).toBeVisible();

  const forPlatform = (syntax: "liquid" | "mailchimp") => page.evaluate((s) => window.__lab!.exportFor(s), syntax);
  expect(await forPlatform("liquid")).toContain("{{ first_name }}");
  expect(await forPlatform("mailchimp")).toContain("*|FIRST_NAME|*");
});

test("a section can be conditional, and exports for the platform", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await page.evaluate(() => window.__lab!.select("section-1"));
  const section = await openSection(page, "visibility");

  await section.getByLabel("Only show if").fill("is_vip");
  await expect.poll(() => page.evaluate(() => window.__lab!.exportFor("liquid"))).toContain("{% if is_vip %}");
  expect(await page.evaluate(() => window.__lab!.exportFor("liquid"))).toContain("{% endif %}");

  await section.getByLabel("Only show if").fill("bad value }}");
  await expect(section.getByRole("alert")).toContainText("variable name");
  expect(await page.evaluate(() => window.__lab!.exportFor("liquid"))).not.toContain("bad value");

  await section.getByLabel("Only show if").fill("");
  await section.getByLabel("Repeat for each item in").fill("products");
  await expect.poll(() => page.evaluate(() => window.__lab!.exportFor("handlebars"))).toContain("{{#each products as |item|}}");
  await snap(page, "mature-visibility");
});

test("columns stack on a phone, in the real export and on the canvas", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });

  const tops = async (preview: Page) => {
    const left = await preview.getByText("Left column").boundingBox();
    const right = await preview.getByText("Right aligned").boundingBox();
    return { leftY: left!.y, rightY: right!.y };
  };

  const desktop = await viewExport(page, 800);
  const wide = await tops(desktop);
  expect(Math.abs(wide.leftY - wide.rightY)).toBeLessThan(30);
  await desktop.close();

  const phone = await viewExport(page, 375);
  const narrow = await tops(phone);
  expect(narrow.rightY).toBeGreaterThan(narrow.leftY + 15);
  await phone.screenshot({ path: "test-results/screens/mature-phone-export.png" });
  await phone.close();

  await page.getByTitle("Mobile View").click();
  await page.waitForTimeout(400);
  const left = await canvas(page).getByText("Left column").boundingBox();
  const right = await canvas(page).getByText("Right aligned").boundingBox();
  expect(right!.y).toBeGreaterThan(left!.y + 15);
  await snap(page, "mature-phone-canvas");
});

test("something can be hidden on phones only", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await canvas(page).getByText("Lab heading").click();
  const section = await openSection(page, "mobile");
  await section.getByLabel("Hide on phones").check();

  await expect.poll(async () => (await readDocument(page)).nodes["section-0-row-col-0-heading-0"].data.mobile?.hide).toBe(true);

  const phone = await viewExport(page, 375);
  await expect(phone.getByRole("heading", { name: "Lab heading" })).toBeHidden();
  await phone.close();
  const desktop = await viewExport(page, 800);
  await expect(desktop.getByRole("heading", { name: "Lab heading" })).toBeVisible();
  await desktop.close();
});

test("dark mode colors apply when the reader uses dark mode", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const form = page.locator('[data-reb-part="dark-mode"]');
  await form.getByRole("textbox", { name: "Background", exact: true }).fill("#000000");
  await form.getByRole("textbox", { name: "Text", exact: true }).fill("#eeeeee");
  await expect.poll(() => page.evaluate(() => window.__lab!.exportHtml())).toContain("#eeeeee!important");

  const dark = await viewExport(page, 800, "dark");
  await expect(dark.locator("body")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(dark.getByText("Left column")).toHaveCSS("color", "rgb(238, 238, 238)");
  await dark.screenshot({ path: "test-results/screens/mature-dark-export.png" });
  await dark.close();

  const light = await viewExport(page, 800, "light");
  await expect(light.getByText("Left column")).not.toHaveCSS("color", "rgb(238, 238, 238)");
  await light.close();
});

test("the brand kit applies across the email, as one undo step", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const form = page.locator('[data-reb-part="brand-kit"]');
  await form.getByRole("textbox", { name: "Primary color", exact: true }).fill("#7c3aed");
  await form.getByLabel("Button corner radius").fill("20");
  await form.getByRole("button", { name: "Apply to this email" }).click();

  await expect(canvas(page).getByRole("link", { name: "Lab button" })).toHaveCSS("background-color", "rgb(124, 58, 237)");
  await expect(exportFrame(page).getByRole("link", { name: "Lab button" })).toHaveCSS("border-radius", "20px");
  await snap(page, "mature-brand");

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(canvas(page).getByRole("link", { name: "Lab button" })).not.toHaveCSS("background-color", "rgb(124, 58, 237)");
});

test("a block can be saved, then added again from the library", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await page.evaluate(() => localStorage.removeItem("react-email-builder:library"));
  await page.reload();

  await canvas(page).getByText("Lab button").click();
  await page.locator('[data-reb-part="save-to-library"]').click();
  await expect(page.locator('[data-reb-part="save-to-library"]')).toHaveText("Saved");

  await page.getByTitle(/saved/i).or(page.getByRole("tab", { name: /saved/i })).first().click();
  const item = page.locator('[data-reb-part="saved-item"]');
  await expect(item).toHaveCount(1);
  await item.getByRole("button", { name: "Saved button", exact: true }).click();

  await expect(canvas(page).getByRole("link", { name: "Lab button" })).toHaveCount(2);
  await snap(page, "mature-saved");

  await item.getByRole("button", { name: /^Delete/ }).click();
  await expect(item).toHaveCount(0);
});

test("text can be edited in place, with formatting, and saves safely", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "blocks" });
  const text = canvas(page).locator('[data-reb-part="rich-text"]').first();
  await text.dblclick();

  const editor = canvas(page).locator('[data-reb-part="rich-text-editor"]');
  await expect(editor).toBeVisible();
  const editable = editor.locator('[contenteditable="true"]');
  await editable.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Fresh words");
  await page.keyboard.press("ControlOrMeta+a");
  await editor.getByRole("button", { name: "Bold" }).click();
  await expect(editor.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
  await snap(page, "mature-rich-text");

  await editor.getByLabel("Insert a variable").selectOption("first_name");
  await expect(editable).toContainText("{{first_name}}");
  await page.keyboard.press("Escape");

  await expect(editor).toHaveCount(0);
  await expect.poll(async () => String((await readDocument(page)).nodes[COLUMN_TEXT].data.props.content)).toContain("{{first_name}}");
  await expect(exportFrame(page).getByText("{{first_name}}")).toBeVisible();
  expect(String((await readDocument(page)).nodes[COLUMN_TEXT].data.props.content)).not.toContain("<p");

  await page.evaluate(() => window.__lab!.undo());
  await expect(canvas(page).getByText("Lab paragraph", { exact: false }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("the issues list shows what to fix, and goes to it", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const button = page.locator('[data-reb-part="lint-button"]');
  await expect(button).toContainText("to check");
  await button.click();

  const panel = page.locator('[data-reb-part="lint-panel"]');
  await expect(panel).toContainText("SVG");
  await snap(page, "mature-issues");

  await panel.getByRole("button", { name: /SVG/ }).first().click();
  await expect(page.locator('[data-reb-part="breadcrumbs"] [aria-current="true"]')).toHaveText("image");
  await expect(panel).toHaveCount(0);
});

test("the plain text version reads properly", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const text = await page.evaluate(() => window.__lab!.plainText());
  expect(text).toContain("LAB HEADING");
  expect(text).toContain("Lab button (https://example.com)");
  expect(text).not.toMatch(/<[a-z]/i);
});
