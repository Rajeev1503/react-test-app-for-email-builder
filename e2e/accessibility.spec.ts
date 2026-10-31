import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { canvas, openLab } from "./helpers";

async function audit(page: import("@playwright/test").Page) {
  // The email's own content is the author's, and the lint rules check that. This is
  // about the editor around it.
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude('[data-testid="export-pane"]')
    .exclude(['[data-reb-part="frame"]', '[data-reb-part="block-content"]'])
    .analyze();
  return results.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0].target} :: ${v.nodes[0].failureSummary?.split("\n")[1]?.trim()}`);
}

test("the editor has no serious accessibility problems", async ({ page }) => {
  await openLab(page, { scenario: "blocks", exportPane: false });
  expect(await audit(page)).toEqual([]);
});

test("the selected state and each inspector tab have none either", async ({ page }) => {
  await openLab(page, { scenario: "blocks", exportPane: false });
  await canvas(page).getByText("Lab heading").click();
  expect(await audit(page)).toEqual([]);

  for (const name of [/blocks/i, /layouts/i, /saved/i, /outline/i, /templates/i]) {
    await page.getByRole("tab", { name }).or(page.getByRole("button", { name })).or(page.getByTitle(name)).first().click();
    expect(await audit(page), String(name)).toEqual([]);
  }
});
