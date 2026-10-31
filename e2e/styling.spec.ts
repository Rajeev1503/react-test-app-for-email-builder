import { expect, test, type Page } from "@playwright/test";
import { canvas, exportFrame, openLab, snap } from "./helpers";

/** Selects a block on the canvas by its text. */
async function select(page: Page, text: string) {
  await canvas(page).getByText(text, { exact: false }).first().click();
  await expect(page.locator('[data-reb-part="inspector-header"]')).toBeVisible();
}

/** Opens an inspector section if it is closed. */
async function openSection(page: Page, id: string) {
  const section = page.locator(`[data-section-id="${id}"]`);
  const trigger = section.getByRole("button").first();
  if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
  return section;
}

const field = (page: Page, id: string) => page.locator(`[data-reb-field="${id}"]`);

async function computed(locator: ReturnType<Page["locator"]>, property: string) {
  return locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);
}

test("a style set in the inspector renders the same on the canvas and in the export", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "blocks" });
  await select(page, "Lab heading");
  await openSection(page, "typography");

  await field(page, "fontSize").locator("input").fill("40");
  await field(page, "color").locator('input[type="text"]').fill("#b91c1c");
  await field(page, "letterSpacing").locator("input").fill("2");
  await field(page, "fontFamily").locator("select").selectOption({ label: "Georgia" });
  await field(page, "textTransform").locator("select").selectOption("uppercase");
  await field(page, "textAlign").getByRole("radio", { name: "center" }).click();

  const onCanvas = canvas(page).getByRole("heading", { name: "Lab heading" });
  const inExport = exportFrame(page).getByRole("heading", { name: "Lab heading" });

  // The export pane reloads after each change, so wait for the last one to land.
  await expect(inExport).toHaveCSS("text-align", "center");
  for (const property of ["font-size", "color", "letter-spacing", "font-family", "text-transform", "text-align"]) {
    expect(await computed(onCanvas, property), property).toBe(await computed(inExport, property));
  }
  await expect(onCanvas).toHaveCSS("color", "rgb(185, 28, 28)");

  await snap(page, "styling-heading");
  expect(errors).toEqual([]);
});

test("layout nodes can be styled, and padding works in the export", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });

  await page.evaluate(() => window.__lab!.select("section-0"));
  await openSection(page, "background");
  await field(page, "backgroundColor").locator('input[type="text"]').fill("#fef3c7");
  await expect(field(page, "backgroundColor").locator('input[type="text"]')).toHaveValue("#fef3c7");

  const spacing = await openSection(page, "spacing");
  await spacing.locator('[data-reb-control="spacing"] input').first().fill("48");

  const headingTop = async (frame: "canvas" | "export") => {
    const heading =
      frame === "canvas"
        ? canvas(page).getByRole("heading", { name: "Lab heading" })
        : exportFrame(page).getByRole("heading", { name: "Lab heading" });
    await expect(heading).toBeVisible();
    return heading.evaluate((el) => {
      let section: Element | null = el;
      while (section && getComputedStyle(section).backgroundColor !== "rgb(254, 243, 199)") {
        section = section.parentElement;
      }
      return section ? el.getBoundingClientRect().top - section.getBoundingClientRect().top : -1;
    });
  };

  await expect(exportFrame(page).getByRole("heading", { name: "Lab heading" })).toBeVisible();
  await expect.poll(() => headingTop("export")).toBeGreaterThan(40);
  expect(Math.abs((await headingTop("canvas")) - (await headingTop("export")))).toBeLessThan(6);

  await snap(page, "styling-section");
});

test("a partly supported style explains itself, and reset removes it", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await select(page, "Lab heading");
  const effects = await openSection(page, "effects");

  const shadow = field(page, "textShadow");
  await shadow.locator("input").fill("1px 1px 2px #000000");
  await expect(shadow.locator('[data-reb-part="field-note"]')).toContainText("Outlook");

  await shadow.getByRole("button", { name: /reset/i }).click();
  await expect(shadow.locator("input")).toHaveValue("");
  await expect(shadow.locator('[data-reb-part="field-note"]')).toHaveCount(0);
  await expect(effects).toBeVisible();
});

test("an invalid value is explained where it was typed", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await select(page, "Lab heading");
  await openSection(page, "typography");

  await field(page, "fontSize").locator("input").fill("huge");
  await expect(field(page, "fontSize").locator('[data-reb-part="field-error"]')).toContainText("fontSize cannot be");
});

test("advanced styles are validated by the same rules", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await select(page, "Lab heading");
  const advanced = await openSection(page, "advanced");

  await advanced.getByLabel("Style name").fill("display");
  await advanced.getByLabel("Style value").fill("flex");
  await advanced.getByRole("button", { name: "Apply" }).click();
  await expect(advanced.locator('[data-reb-part="field-error"]')).toContainText("row and column");

  await advanced.getByLabel("Style name").fill("opacity");
  await advanced.getByLabel("Style value").fill("0.5");
  await advanced.getByRole("button", { name: "Apply" }).click();
  await expect(advanced.locator('[data-reb-part="advanced-style"]', { hasText: "opacity" })).toBeVisible();
  await expect(canvas(page).getByRole("heading", { name: "Lab heading" })).toHaveCSS("opacity", "0.5");

  await snap(page, "styling-advanced");
});

test("an image aligns from the inspector, and text styles are not offered for it", async ({ page }) => {
  await openLab(page, { scenario: "blocks" });
  await canvas(page).getByAltText("Lab image").click();
  await openSection(page, "layout");

  await field(page, "align").getByRole("radio", { name: "right" }).click();
  await expect(field(page, "align").getByRole("radio", { name: "right" })).toHaveAttribute("aria-checked", "true");
  await expect(exportFrame(page).getByAltText("Lab image")).toHaveCSS("margin-left", /[1-9]/);

  await expect(page.locator('[data-section-id="typography"]')).toHaveCount(0);
  await snap(page, "styling-image");
});

test("the AI is refused a style email can't use, then corrects itself", async ({ page }) => {
  const { errors } = await openLab(page, { scenario: "blocks", ai: "fake" });

  const input = page.getByPlaceholder("Tell AI what to build or style...");
  await input.fill("Add more space");
  await input.press("Enter");
  await expect(page.getByText("Added space using padding.")).toBeVisible();

  const document = (await page.evaluate(() => window.__lab!.document())) as {
    nodes: Record<string, { data: { styles?: Record<string, unknown> } }>;
  };
  expect(document.nodes["section-0"].data.styles).toEqual({ paddingTop: 40 });

  await snap(page, "styling-ai-corrects");
  expect(errors).toEqual([]);
});
