import { expect, test, type Locator, type Page } from "@playwright/test";
import { exportFrame, openLab, snap } from "./helpers";

type Doc = { rootId: string; nodes: Record<string, { type: string; parentId: string | null; children: string[]; data: { blockType?: string; props?: Record<string, unknown> } }> };

const readDocument = (page: Page) => page.evaluate(() => window.__lab!.document()) as Promise<Doc>;

/** Canvas nodes live in an iframe when the canvas has one, so look in both. */
const canvasRoot = (page: Page) => page.frameLocator('[data-reb-part="frame"]');

function nodeText(doc: Doc, id: string): string {
  const props = doc.nodes[id].data.props ?? {};
  return String(props.content ?? props.label ?? props.text ?? doc.nodes[id].data.blockType ?? "");
}

/** The text of each block in a column, in order. */
function columnContents(doc: Doc, columnId: string): string[] {
  return doc.nodes[columnId].children.map((id) => nodeText(doc, id));
}

async function centerOf(locator: Locator) {
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

/** A real, slow pointer drag, ending at a fraction of the target's height. */
async function drag(page: Page, from: Locator, to: Locator, edge: "top" | "bottom" | "middle" = "middle") {
  await from.scrollIntoViewIfNeeded();
  const start = await centerOf(from);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 8, start.y + 8, { steps: 3 });

  const end = await centerOf(to);
  const y = edge === "top" ? end.box.y + 2 : edge === "bottom" ? end.box.y + end.box.height - 2 : end.y;
  await page.mouse.move(end.x, y, { steps: 12 });
  return { x: end.x, y };
}

const blockIn = (page: Page, text: string) => canvasRoot(page).getByText(text, { exact: false }).first();
const paletteCard = (page: Page, id: string) => page.locator(`[data-insert-id="${id}"]`);

async function openBlocksTab(page: Page) {
  await page.getByRole("tab", { name: /blocks/i }).or(page.getByRole("button", { name: /^blocks$/i })).first().click();
}

const COLUMN = "section-0-row-col-0";

test("reorders a block upward within its column, and one undo restores it", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const before = columnContents(await readDocument(page), COLUMN);

  await drag(page, blockIn(page, "Lab button"), blockIn(page, "Lab heading"), "top");
  await expect(page.locator('[data-reb-part="drop-indicator"]')).toBeVisible();
  await snap(page, "dnd-indicator");
  await page.mouse.up();

  const after = columnContents(await readDocument(page), COLUMN);
  expect(after[0]).toBe("Lab button");
  expect(after[1]).toBe("Lab heading");

  await page.evaluate(() => window.__lab!.undo());
  expect(columnContents(await readDocument(page), COLUMN)).toEqual(before);
});

test("reorders a block downward, landing where the indicator showed", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });

  await drag(page, blockIn(page, "Lab heading"), blockIn(page, "Lab button"), "bottom");
  await page.mouse.up();

  const after = columnContents(await readDocument(page), COLUMN);
  expect(after.indexOf("Lab heading")).toBe(after.indexOf("Lab button") + 1);
});

test("moves a block to the very end of another column", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });

  await drag(page, blockIn(page, "Lab heading"), blockIn(page, "Left column"), "bottom");
  await page.mouse.up();

  const doc = await readDocument(page);
  expect(columnContents(doc, "section-1-row-col-0")).toEqual(["Left column", "Lab heading"]);
  expect(columnContents(doc, COLUMN)).not.toContain("Lab heading");
});

test("drags a block from the palette to an exact position", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await openBlocksTab(page);

  await drag(page, paletteCard(page, "block:divider"), blockIn(page, "Lab paragraph"), "top");
  await expect(page.locator('[data-reb-part="drag-preview"]')).toBeVisible();
  await snap(page, "dnd-palette");
  await page.mouse.up();

  const doc = await readDocument(page);
  const blocks = doc.nodes[COLUMN].children.map((id) => doc.nodes[id].data.blockType);
  expect(blocks.indexOf("divider")).toBe(1);
});

test("dropping a block on an empty email builds the layout around it", async ({ page }) => {
  await openLab(page, { scenario: "empty" });
  await openBlocksTab(page);

  await drag(page, paletteCard(page, "block:heading"), canvasRoot(page).locator('[data-reb-part="canvas-content"]'));
  await snap(page, "dnd-empty-canvas");
  await page.mouse.up();

  const doc = await readDocument(page);
  const blockIds = Object.keys(doc.nodes).filter((id) => doc.nodes[id].type === "block");
  expect(blockIds).toHaveLength(1);
  await expect(exportFrame(page).getByRole("heading")).toBeVisible();
});

test("drops into an empty column", async ({ page }) => {
  await openLab(page, { scenario: "empty" });
  await page.getByTitle(/layouts/i).or(page.getByRole("tab", { name: /layouts/i })).first().click();
  await paletteCard(page, "layout:2cols").click();

  await openBlocksTab(page);
  const emptyColumns = canvasRoot(page).locator('[data-node-type="column"]');
  await expect(emptyColumns).toHaveCount(2);

  await drag(page, paletteCard(page, "block:text"), emptyColumns.nth(1));
  await page.mouse.up();

  const doc = await readDocument(page);
  const columns = Object.keys(doc.nodes).filter((id) => doc.nodes[id].type === "column");
  expect(doc.nodes[columns[0]].children).toHaveLength(0);
  expect(doc.nodes[columns[1]].children).toHaveLength(1);
});

test("Escape cancels a drag and changes nothing", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const before = await readDocument(page);

  await drag(page, blockIn(page, "Lab button"), blockIn(page, "Lab heading"), "top");
  await page.keyboard.press("Escape");
  await page.mouse.up();

  expect(await readDocument(page)).toEqual(before);
  await expect(page.locator('[data-reb-part="drag-preview"]')).toHaveCount(0);
});

test("dropping a block where it already is changes nothing", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const before = await readDocument(page);

  await drag(page, blockIn(page, "Lab paragraph"), blockIn(page, "Lab paragraph"));
  await page.mouse.up();

  expect(await readDocument(page)).toEqual(before);
});

test("a section reorders against other sections, whatever it is dropped on", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });

  await page.evaluate(() => window.__lab!.select("section-1"));
  const handle = canvasRoot(page).locator('[data-reb-part="drag-handle"]');
  await expect(handle).toBeVisible();

  await drag(page, handle, blockIn(page, "Lab heading"), "top");
  await page.mouse.up();

  const doc = await readDocument(page);
  expect(doc.nodes.container.children).toEqual(["section-1", "section-0"]);
});

test("moves a block with only the keyboard", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const firstId = `${COLUMN}-heading-0`;

  await page.evaluate((id) => window.__lab!.select(id), firstId);
  const handle = canvasRoot(page).locator('[data-reb-part="drag-handle"]');
  await handle.focus();

  await page.keyboard.press("Enter");
  await expect(page.locator('[data-reb-part="dnd-live"]')).toContainText(/picked up/i);
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-reb-part="drop-indicator"]')).toBeVisible();
  await page.keyboard.press("Enter");

  const after = columnContents(await readDocument(page), COLUMN);
  expect(after[0]).toBe("Lab paragraph <strong>paragraph</strong> text".replace("Lab paragraph ", "Lab "));
  expect(after[1]).toBe("Lab heading");
  await expect(page.locator('[data-reb-part="dnd-live"]')).toContainText(/dropped/i);
});

test("auto-scrolls near the edge of a long email", async ({ page }) => {
  await openLab(page, { scenario: "large" });
  await openBlocksTab(page);

  const scrollTop = () =>
    page.locator('[data-reb-part="frame"]').evaluate((frame: HTMLIFrameElement) => frame.contentWindow!.scrollY);
  expect(await scrollTop()).toBe(0);

  const card = await centerOf(paletteCard(page, "block:text"));
  await page.mouse.move(card.x, card.y);
  await page.mouse.down();
  await page.mouse.move(card.x - 20, card.y, { steps: 3 });

  const frame = (await page.locator('[data-reb-part="frame"]').boundingBox())!;
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height - 8, { steps: 10 });
  await expect.poll(scrollTop, { timeout: 4000 }).toBeGreaterThan(100);
  await page.keyboard.press("Escape");
  await page.mouse.up();
});

test("dragging stays smooth in a 150-node email", async ({ page }) => {
  await openLab(page, { scenario: "large" });
  const from = await centerOf(blockIn(page, "Section 0"));
  const to = await centerOf(blockIn(page, "Section 6"));

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 8, from.y + 8, { steps: 3 });

  const started = Date.now();
  await page.mouse.move(to.x, to.y, { steps: 60 });
  const elapsed = Date.now() - started;
  await page.keyboard.press("Escape");
  await page.mouse.up();

  // 60 moves at 60fps take about a second, so this allows for a slow test machine.
  expect(elapsed).toBeLessThan(2500);
});

test("the outline tree can start a drag", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await page.getByTitle(/outline/i).or(page.getByRole("tab", { name: /outline/i })).first().click();

  const row = page.locator('[data-reb-drag-node="section-1"]');
  await expect(row).toBeVisible();
  await drag(page, row, blockIn(page, "Lab heading"), "top");
  await page.mouse.up();

  const doc = await readDocument(page);
  expect(doc.nodes.container.children).toEqual(["section-1", "section-0"]);
});
