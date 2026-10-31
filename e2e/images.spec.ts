import { expect, test, type Page } from "@playwright/test";
import { canvas, exportFrame, openLab, snap } from "./helpers";

type Doc = { nodes: Record<string, { type: string; data: { blockType?: string; props?: Record<string, unknown> } }> };

const readDocument = (page: Page) => page.evaluate(() => window.__lab!.document()) as Promise<Doc>;
const imageBlocks = (doc: Doc) => Object.values(doc.nodes).filter((n) => n.data.blockType === "image");

/** Makes a real PNG of the given size in the browser, as bytes a test can upload. */
async function makePng(page: Page, width: number, height: number): Promise<Buffer> {
  const base64 = await page.evaluate(
    async ({ width, height }) => {
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#25aeba";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.fillRect(width / 4, height / 4, width / 2, height / 2);
      const blob = await canvas.convertToBlob({ type: "image/png" });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      return btoa(String.fromCharCode(...bytes));
    },
    { width, height },
  );
  return Buffer.from(base64, "base64");
}

async function selectImage(page: Page) {
  await canvas(page).getByAltText("Lab image").click();
  await expect(page.locator('[data-reb-control="image"]')).toBeVisible();
}

const hostedUrl = /^http:\/\/localhost:5199\/uploads\//;

test("uploading through the inspector crops, resizes and uses a hosted URL", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "blocks" });
  await selectImage(page);

  const png = await makePng(page, 2400, 1200);
  await page.locator('[data-reb-part="image-file-input"]').setInputFiles({ name: "big.png", mimeType: "image/png", buffer: png });

  const dialog = page.locator('[data-reb-part="image-crop"]');
  await expect(dialog).toBeVisible();
  const preview = dialog.locator('[data-reb-part="image-crop-preview"]');
  await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(2400);
  await dialog.getByRole("radio", { name: "Square" }).click();
  const shape = await preview.boundingBox();
  expect(Math.abs(shape!.width - shape!.height)).toBeLessThan(2);
  await snap(page, "images-crop");
  await dialog.getByRole("button", { name: "Upload" }).click();
  await expect(dialog).toHaveCount(0);

  await expect.poll(async () => String(imageBlocks(await readDocument(page))[0].data.props?.src)).toMatch(hostedUrl);
  const props = imageBlocks(await readDocument(page))[0].data.props!;
  expect(props.intrinsicWidth).toBe(1200);
  expect(props.intrinsicHeight).toBe(1200);

  await expect(page.locator('[data-reb-part="image-thumbnail"]')).toBeVisible();
  await expect(canvas(page).getByAltText("Lab image")).toHaveJSProperty("complete", true);
  await snap(page, "images-uploaded");
  expect(errors).toEqual([]);
});

test("an SVG upload is refused, with the reason", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await selectImage(page);

  await page.locator('[data-reb-part="image-file-input"]').setInputFiles({
    name: "logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"),
  });

  await expect(page.locator('[data-reb-control="image"]').getByRole("alert")).toContainText("Gmail and Outlook");
  await expect(page.locator('[data-reb-part="image-crop"]')).toHaveCount(0);
});

/** Sends a file the way a desktop drag does. */
async function dropFile(page: Page, png: Buffer, selector: string) {
  await page.frameLocator('[data-reb-part="frame"]').locator(selector).first().evaluate(
    (element, base64) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const data = new DataTransfer();
      data.items.add(new File([bytes], "dropped.png", { type: "image/png" }));
      const init = { bubbles: true, cancelable: true, dataTransfer: data };
      element.dispatchEvent(new DragEvent("dragover", init));
      element.dispatchEvent(new DragEvent("drop", init));
    },
    png.toString("base64"),
  );
}

test("a file dragged from the desktop adds an image, building the layout if needed", async ({ page }) => {
  await openLab(page, { scenario: "empty" });
  await dropFile(page, await makePng(page, 300, 200), '[data-reb-part="canvas-content"]');

  await expect.poll(async () => imageBlocks(await readDocument(page)).length).toBe(1);
  expect(String(imageBlocks(await readDocument(page))[0].data.props?.src)).toMatch(hostedUrl);
  await expect(exportFrame(page).locator("img")).toBeVisible();
  await snap(page, "images-dropped");
});

test("a file dropped on an image replaces that image", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  const before = imageBlocks(await readDocument(page)).length;

  await dropFile(page, await makePng(page, 300, 200), 'img[alt="Lab image"]');

  await expect.poll(async () => String(imageBlocks(await readDocument(page))[0].data.props?.src)).toMatch(hostedUrl);
  expect(imageBlocks(await readDocument(page))).toHaveLength(before);
});

test("pasting an image adds it", async ({ page }) => {
  await openLab(page, { scenario: "empty" });
  const png = await makePng(page, 300, 200);

  await page.evaluate((base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const data = new DataTransfer();
    data.items.add(new File([bytes], "pasted.png", { type: "image/png" }));
    window.document.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  }, png.toString("base64"));

  await expect.poll(async () => imageBlocks(await readDocument(page)).length).toBe(1);
  expect(String(imageBlocks(await readDocument(page))[0].data.props?.src)).toMatch(hostedUrl);
});

test("the library offers uploaded images", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await selectImage(page);
  await page.locator('[data-reb-part="image-file-input"]').setInputFiles({
    name: "library.png",
    mimeType: "image/png",
    buffer: await makePng(page, 200, 200),
  });
  await page.locator('[data-reb-part="image-crop"]').getByRole("button", { name: "Upload" }).click();
  await expect.poll(async () => String(imageBlocks(await readDocument(page))[0].data.props?.src)).toMatch(hostedUrl);

  await page.locator('[data-reb-control="image"]').getByRole("button", { name: "Library" }).click();
  const library = page.locator('[data-reb-part="image-library"]');
  await expect(library.getByRole("button", { name: /^Use / }).first()).toBeVisible();
  await snap(page, "images-library");
  await library.getByRole("button", { name: /^Use / }).first().click();
  await expect(library).toHaveCount(0);
});

test("the library can search, when the host supports it", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await selectImage(page);
  await page.locator('[data-reb-control="image"]').getByRole("button", { name: "Library" }).click();

  const library = page.locator('[data-reb-part="image-library"]');
  await library.getByLabel("Search images").fill("no-image-has-this-name");
  await library.getByRole("button", { name: "Search" }).click();
  await expect(library.getByText("No images found.")).toBeVisible();
});

test("a new image block prompts for an image, and is left out of the export until it has one", async ({ page }) => {
  await openLab(page, { scenario: "empty" });
  await page.getByRole("tab", { name: /blocks/i }).or(page.getByRole("button", { name: /^blocks$/i })).first().click();
  await page.locator('[data-insert-id="block:image"]').click();

  await expect(canvas(page).locator('[data-reb-part="image-placeholder"]')).toBeVisible();
  await snap(page, "images-placeholder");
  await expect(exportFrame(page).locator("img")).toHaveCount(0);
});

test("exported image widths match their column in 1, 2 and 3 column layouts", async ({ page }) => {
  await openLab(page, { scenario: "columns" });
  const html = await page.evaluate(() => window.__lab!.exportHtml());
  const widthOf = (alt: string) => {
    const tag = new RegExp(`<img[^>]*alt="${alt}"[^>]*>`).exec(html)?.[0] ?? "";
    return Number(/\swidth="(\d+)"/.exec(tag)?.[1]);
  };

  // Scenario columns have no explicit width, so they share the row equally.
  expect(widthOf("One column")).toBe(600);
  expect(widthOf("Two columns A")).toBe(300);
  expect(widthOf("Three columns A")).toBe(200);
  await snap(page, "images-columns");
});

test("an image can link somewhere", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await selectImage(page);
  await page.locator('[data-reb-field="href"] input').fill("https://example.com/sale");

  await expect(exportFrame(page).locator('a[href="https://example.com/sale"] img')).toBeVisible();
});
