import { expect, test } from "@playwright/test";
import { canvas, exportFrame, openLab, snap } from "./helpers";

test("every block appears on the canvas and in the export", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "blocks" });
  const pane = exportFrame(page);

  for (const text of ["Lab heading", "Lab button", "Lab link", "Left column", "Right aligned"]) {
    await expect(canvas(page).getByText(text, { exact: false }).first()).toBeVisible();
    await expect(pane.getByText(text, { exact: false }).first()).toBeVisible();
  }

  // Markdown renders as formatted text in both places, never as its raw source.
  await expect(canvas(page).locator("h2", { hasText: "Lab markdown" })).toBeVisible();
  await expect(pane.locator("h2", { hasText: "Lab markdown" })).toBeVisible();
  await expect(canvas(page).getByText("**Bold**")).toHaveCount(0);

  await snap(page, "foundations-blocks");
  expect(errors).toEqual([]);
});

test("a centered image sits in the same place in both", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });

  const offsets = async (imageBox: { x: number; width: number }, areaBox: { x: number; width: number }) =>
    (imageBox.x + imageBox.width / 2 - areaBox.x) / areaBox.width;

  const canvasImage = canvas(page).getByAltText("Lab image");
  const canvasArea = canvas(page).locator('[data-reb-part="node"]').first();
  const exportImage = exportFrame(page).getByAltText("Lab image");
  const exportArea = exportFrame(page).locator("table").first();
  await expect(canvasImage).toBeVisible();
  await expect(exportImage).toBeVisible();

  const canvasOffset = await offsets((await canvasImage.boundingBox())!, (await canvasArea.boundingBox())!);
  const exportOffset = await offsets((await exportImage.boundingBox())!, (await exportArea.boundingBox())!);
  expect(canvasOffset).toBeCloseTo(0.5, 1);
  expect(exportOffset).toBeCloseTo(0.5, 1);
});

test("a right-aligned button sits on the right in both", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });

  const rightEdgeGap = async (button: { x: number; width: number }, cell: { x: number; width: number }) =>
    cell.x + cell.width - (button.x + button.width);

  const canvasButton = canvas(page).getByText("Right aligned");
  const exportButton = exportFrame(page).getByText("Right aligned");
  await expect(canvasButton).toBeVisible();
  await expect(exportButton).toBeVisible();

  const canvasColumn = canvas(page).locator('[data-node-type="column"]', { hasText: "Right aligned" }).last();
  const exportColumn = exportFrame(page).locator("td", { hasText: "Right aligned" }).last();

  expect(await rightEdgeGap((await canvasButton.boundingBox())!, (await canvasColumn.boundingBox())!)).toBeLessThan(40);
  expect(await rightEdgeGap((await exportButton.boundingBox())!, (await exportColumn.boundingBox())!)).toBeLessThan(40);
});

test("malicious content never runs, on the canvas or in the export", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "malicious" });

  await expect(canvas(page).getByText("Safe text")).toBeVisible();
  await expect(exportFrame(page).getByText("Safe text")).toBeVisible();

  // Give any broken-image handler time to fire.
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__xssFired)).toBeUndefined();

  // Clicking the links would run a javascript: URL if it had survived.
  await canvas(page).getByRole("link", { name: "Safe link" }).click({ modifiers: ["ControlOrMeta"] });
  expect(await page.evaluate(() => window.__xssFired)).toBeUndefined();

  const html = await page.evaluate(() => window.__lab!.exportHtml());
  expect(html).not.toMatch(/onerror|<script|javascript:|__xssFired/i);

  await snap(page, "foundations-malicious");
  expect(errors).toEqual([]);
});

test("a custom block works from the canvas through to export", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "custom" });

  await expect(canvas(page).getByText("Lab badge")).toBeVisible();
  await expect(exportFrame(page).getByText("Lab badge")).toBeVisible();
  await expect(page.getByTestId("export-error")).toHaveCount(0);

  await snap(page, "foundations-custom-block");
  expect(errors).toEqual([]);
});

test("a corrupt document is refused with a clear message, and the editor still works", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "corrupt" });

  await expect(page.getByTestId("scenario-error")).toContainText("does-not-exist");
  await expect(page.getByRole("button", { name: /properties/i }).or(page.getByRole("tab", { name: /properties/i })).first()).toBeVisible();

  await snap(page, "foundations-corrupt");
  expect(errors).toEqual([]);
});

test("an empty document opens without errors", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "empty" });
  await snap(page, "foundations-empty");
  expect(errors).toEqual([]);
});

test("a large document renders and exports", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "large" });

  await expect(canvas(page).getByText("Section 27", { exact: true })).toBeAttached();
  await expect(exportFrame(page).getByText("Section 27", { exact: true })).toBeAttached();

  const nodeCount = await page.evaluate(
    () => Object.keys((window.__lab!.document() as { nodes: object }).nodes).length,
  );
  expect(nodeCount).toBeGreaterThanOrEqual(150);

  await snap(page, "foundations-large");
  expect(errors).toEqual([]);
});

test("the fake AI edits the real document through the real agent loop", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "empty", ai: "fake" });

  const input = page.getByPlaceholder("Tell AI what to build or style...");
  await input.fill("Add a hero");
  await input.press("Enter");

  await expect(canvas(page).getByText("Hero from the AI")).toBeVisible();
  await expect(exportFrame(page).getByText("Hero from the AI")).toBeVisible();
  await expect(page.getByText("Added a hero section.")).toBeVisible();

  await snap(page, "foundations-ai");
  expect(errors).toEqual([]);
});
