import { expect, type FrameLocator, type Page } from "@playwright/test";

type LabOptions = { scenario?: string; ai?: "fake" | "gemini"; exportPane?: boolean };

/** Opens the test app and fails the test on any uncaught page error. */
export async function openLab(page: Page, options: LabOptions = {}) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const params = new URLSearchParams();
  if (options.scenario) params.set("scenario", options.scenario);
  params.set("ai", options.ai ?? "fake");
  if (options.exportPane ?? true) params.set("export", "1");

  await page.goto(`/?${params}`);
  await expect(page.getByTestId("canvas-scroll")).toBeVisible();
  return { errors };
}

export const exportFrame = (page: Page): FrameLocator => page.frameLocator('[data-testid="export-frame"]');

export const canvas = (page: Page) => page.getByTestId("canvas-scroll");

/** Screenshots are kept with the test results for visual review. */
export async function snap(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screens/${name}.png` });
}
