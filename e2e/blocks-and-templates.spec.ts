import { expect, test, type Page } from "@playwright/test";
import { canvas, exportFrame, openLab, snap } from "./helpers";

type Doc = { nodes: Record<string, { type: string; children: string[]; data: { blockType?: string; props?: Record<string, unknown> } }> };

const readDocument = (page: Page) => page.evaluate(() => window.__lab!.document()) as Promise<Doc>;

test("every ready-made block renders on the canvas and in the export", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "rich" });

  for (const text of ["Shop", "LinkedIn", "First point", "This changed how", "Monthly plan", "Your Company", "Unsubscribe", "Your HTML here"]) {
    await expect(canvas(page).getByText(text, { exact: false }).first()).toBeVisible();
    await expect(exportFrame(page).getByText(text, { exact: false }).first()).toBeVisible();
  }

  // Tables fill their column in both, which a CSS reset once broke on the canvas.
  const widthRatio = async (root: ReturnType<typeof canvas>) => {
    const table = await root.locator("td", { hasText: "Monthly plan" }).last().locator("xpath=ancestor::table[1]").boundingBox();
    return table!.width;
  };
  expect(await widthRatio(canvas(page))).toBeGreaterThan(300);
  expect(await widthRatio(exportFrame(page))).toBeGreaterThan(300);

  await snap(page, "blocks-rich");
  expect(errors).toEqual([]);
});

test("menu links are edited with add, change, reorder and remove", async ({ page }) => {
  await openLab(page, { scenario: "rich" });
  await canvas(page).getByText("Shop").click();
  const items = page.locator('[data-reb-control="items"]');
  await expect(items).toBeVisible();

  await items.getByLabel("Label 1").fill("Store");
  await expect(exportFrame(page).getByText("Store")).toBeVisible();

  await items.getByRole("button", { name: "Add" }).click();
  await items.getByLabel("Label 4").fill("Blog");
  await items.getByLabel("URL 4").fill("https://example.com/blog");
  await expect(exportFrame(page).getByRole("link", { name: "Blog" })).toHaveAttribute("href", "https://example.com/blog");
  await snap(page, "blocks-items");

  await items.getByRole("button", { name: "Move item 4 up" }).click();
  await expect(items.getByLabel("Label 3")).toHaveValue("Blog");

  await items.getByRole("button", { name: "Remove item 3" }).click();
  await expect(exportFrame(page).getByRole("link", { name: "Blog" })).toHaveCount(0);
});

test("a ready-made section can be added, and is complete and editable", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "empty" });
  await page.getByTitle(/layouts/i).or(page.getByRole("tab", { name: /layouts/i })).first().click();

  await page.locator('[data-insert-id="layout:hero"]').click();
  await expect(canvas(page).getByRole("heading", { name: "Say the one thing that matters" })).toBeVisible();
  await expect(exportFrame(page).getByRole("link", { name: "Get started" })).toBeVisible();

  await page.locator('[data-insert-id="layout:pricing"]').click();
  await page.locator('[data-insert-id="layout:footer"]').click();
  await expect(canvas(page).getByText("Starter")).toBeVisible();
  await expect(exportFrame(page).getByText("Unsubscribe")).toBeVisible();

  await page.waitForTimeout(300);
  await snap(page, "blocks-sections");
  expect(errors).toEqual([]);
});

test("HTML can be imported from the templates tab, and undone", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await page.getByTitle(/templates/i).or(page.getByRole("tab", { name: /templates/i })).first().click();

  const area = page.locator('[data-reb-part="import-html"]');
  await area.getByLabel("HTML to import").fill(`
    <table><tr><td><h1 style="color:#112233">Imported email</h1><p>Hello there</p></td></tr>
    <tr><td><p>Left cell</p></td><td><p>Right cell</p></td></tr></table>
    <img src=x onerror="window.__xssFired=true">`);
  await area.getByRole("button", { name: "Import" }).click();

  await expect(canvas(page).getByRole("heading", { name: "Imported email" })).toBeVisible();
  await expect(canvas(page).getByText("Lab heading")).toHaveCount(0);
  await expect(exportFrame(page).getByText("Right cell")).toBeVisible();
  expect(await page.evaluate(() => window.__xssFired)).toBeUndefined();
  await snap(page, "blocks-imported");

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(canvas(page).getByText("Lab heading")).toBeVisible();
});

const TEMPLATES = ["Order Confirmation", "Webinar Invite", "Sale Promotion", "Abandoned Cart", "Win-Back", "Invoice"];

for (const title of TEMPLATES) {
  test(`the ${title} template loads, exports and looks right`, async ({ page }) => {
    const { errors } = await openLab(page, { scenario: "empty" });
    await page.getByTitle(/templates/i).or(page.getByRole("tab", { name: /templates/i })).first().click();
    await page.locator('[data-reb-part="templates"]').getByRole("button", { name: new RegExp(title) }).first().click();
    await page.getByRole("button", { name: "Load Template" }).click();

    await expect.poll(async () => Object.values((await readDocument(page)).nodes).filter((n) => n.type === "block").length).toBeGreaterThan(2);
    await expect(exportFrame(page).locator("h1").first()).toBeVisible();

    await page.waitForTimeout(300);
    await snap(page, `template-${title.toLowerCase().replace(/\W+/g, "-")}`);
    expect(errors).toEqual([]);
  });
}
