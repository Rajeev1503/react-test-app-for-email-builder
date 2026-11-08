/* eslint-disable react-refresh/only-export-components -- test fixtures, not a hot-reloaded UI module */
import { importTemplate, serialize, type EmailDocument } from "@react-email-builder/core";
import { createInitialDocument } from "@react-email-builder/engine";
import { builtinBlocks, defineBlock, type BlockDefinition } from "@react-email-builder/react";

/**
 * Fixed documents for testing, chosen with `?scenario=<name>`. Everything here
 * uses the packages' public API only, so this also checks that API is enough.
 */
export const SCENARIOS = ["blocks", "rich", "columns", "custom", "empty", "large", "clipped", "malicious", "corrupt"] as const;
export type ScenarioName = (typeof SCENARIOS)[number];

export interface LabConfig {
  scenario: ScenarioName | null;
  ai: "fake" | "gemini";
  showExport: boolean;
}

export function readLabConfig(search: string): LabConfig {
  const params = new URLSearchParams(search);
  const scenario = params.get("scenario") as ScenarioName | null;
  return {
    scenario: scenario && SCENARIOS.includes(scenario) ? scenario : null,
    ai: params.get("ai") === "fake" ? "fake" : "gemini",
    showExport: params.get("export") === "1",
  };
}

type BlockData = { blockType: string; props?: object; styles?: object };
type RawNode = { type: string; parentId: string | null; children: string[]; data: object };

/** Lays out rows of columns of blocks under the starting document's container. */
function buildDocument(sections: BlockData[][][]): EmailDocument {
  const doc = createInitialDocument();
  const nodes = doc.nodes as unknown as Map<string, RawNode>;
  const container = nodes.get("container")!;

  sections.forEach((columns, s) => {
    const sectionId = `section-${s}`;
    const rowId = `${sectionId}-row`;
    container.children.push(sectionId);
    nodes.set(sectionId, { type: "section", parentId: "container", children: [rowId], data: { styles: {} } });
    nodes.set(rowId, { type: "row", parentId: sectionId, children: [], data: { styles: {} } });

    columns.forEach((blocks, c) => {
      const columnId = `${rowId}-col-${c}`;
      nodes.get(rowId)!.children.push(columnId);
      nodes.set(columnId, { type: "column", parentId: rowId, children: [], data: { styles: {} } });

      blocks.forEach((data, b) => {
        const blockId = `${columnId}-${data.blockType}-${b}`;
        nodes.get(columnId)!.children.push(blockId);
        nodes.set(blockId, { type: "block", parentId: columnId, children: [], data });
      });
    });
  });
  return doc;
}

/** A block with its registered defaults, with `override` merged over them. */
function blockFromDefaults(type: string, override: { props?: object; styles?: object } = {}): BlockData {
  const definition = builtinBlocks.find((b) => b.type === type)!;
  const defaults = definition.defaults() as { props?: object; styles?: object };
  return {
    blockType: type,
    props: { ...defaults.props, ...override.props },
    styles: { ...defaults.styles, ...override.styles },
  };
}

const hostedImage = (origin: string) => `${origin}/vite.svg`;

function allBlocksDocument(): EmailDocument {
  const image = hostedImage(window.location.origin);
  return buildDocument([
    [[
      blockFromDefaults("heading", { props: { content: "Lab heading", level: 1 } }),
      blockFromDefaults("text", { props: { content: "Lab <strong>paragraph</strong> text" } }),
      blockFromDefaults("button", { props: { label: "Lab button", href: "https://example.com" } }),
      blockFromDefaults("link", { props: { text: "Lab link", href: "https://example.com" } }),
      blockFromDefaults("image", { props: { src: image, alt: "Lab image" }, styles: { width: 200, align: "center" } }),
      blockFromDefaults("divider"),
      blockFromDefaults("spacer"),
      blockFromDefaults("markdown", { props: { content: "## Lab markdown\n\n**Bold** and [a link](https://example.com)" } }),
      blockFromDefaults("codeblock", { props: { code: "const lab = true;", language: "javascript" } }),
    ]],
    [
      [blockFromDefaults("text", { props: { content: "Left column" } })],
      [blockFromDefaults("button", { props: { label: "Right aligned", href: "https://example.com" }, styles: { align: "right" } })],
    ],
  ]);
}

/** A custom block, to prove one works from the canvas through to export. */
export const badgeBlock = defineBlock<{ label: string }>({
  type: "badge",
  label: "Badge",
  description: "A small status badge",
  category: "content",
  defaults: () => ({ props: { label: "New" }, styles: {} }),
  fields: [{ id: "label", group: "props", label: "Label", control: "text", section: "content" }],
  email: ({ props }) => (
    <span style={{ backgroundColor: "#fde68a", padding: "2px 8px", borderRadius: 4 }}>{props.label}</span>
  ),
});

/** Every payload sets a flag if it ever runs, so a test can check for real execution. */
const XSS = "window.__xssFired=true";

function maliciousDocument(): EmailDocument {
  return buildDocument([[[
    { blockType: "text", props: { content: `Safe text<img src=x onerror="${XSS}"><script>${XSS}</script>` }, styles: {} },
    { blockType: "markdown", props: { content: `Safe markdown\n\n<img src=x onerror="${XSS}">\n\n[bad](javascript:${XSS})` }, styles: {} },
    { blockType: "button", props: { label: "Safe button", href: `javascript:${XSS}` }, styles: {} },
    { blockType: "link", props: { text: "Safe link", href: `javascript:${XSS}` }, styles: {} },
    { blockType: "image", props: { src: `javascript:${XSS}`, alt: "Bad image" }, styles: {} },
  ]]]);
}

function largeDocument(): EmailDocument {
  const sections = Array.from({ length: 28 }, (_, i) => [
    [blockFromDefaults("heading", { props: { content: `Section ${i}`, level: 2 } })],
    [blockFromDefaults("text", { props: { content: `Body of section ${i}` } })],
  ]);
  return buildDocument(sections);
}

export interface LoadedScenario {
/** Past the 102KB Gmail clips at, so the size meter in the editor bar turns red. */
function clippedDocument(): EmailDocument {
  const paragraph = "This paragraph is here to make the email long enough for Gmail to clip it. ".repeat(4);
  const sections = Array.from({ length: 160 }, (_, i) => [
    [blockFromDefaults("heading", { props: { content: `Section ${i}`, level: 2 } })],
    [blockFromDefaults("text", { props: { content: paragraph } })],
  ]);
  return buildDocument(sections);
}

  document?: EmailDocument;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks?: BlockDefinition<any, any>[];
  error?: string;
}

export function loadScenario(name: ScenarioName | null): LoadedScenario {
  switch (name) {
    case "blocks":
      return { document: allBlocksDocument() };
    case "rich":
      return {
        document: buildDocument([[[
          ...["menu", "social", "list", "quote", "table", "video", "footer", "html"].map((type) => blockFromDefaults(type)),
        ]]]),
      };
    case "columns": {
      const image = (alt: string) => blockFromDefaults("image", { props: { src: hostedImage(window.location.origin), alt } });
      return {
        document: buildDocument([
          [[image("One column")]],
          [[image("Two columns A")], [image("Two columns B")]],
          [[image("Three columns A")], [image("Three columns B")], [image("Three columns C")]],
        ]),
      };
    }
    case "custom":
      return {
        document: buildDocument([[[
          { blockType: "badge", props: { label: "Lab badge" }, styles: {} },
          blockFromDefaults("text", { props: { content: "Beside a custom block" } }),
        ]]]),
        blocks: [...builtinBlocks, badgeBlock],
      };
    case "empty":
      return { document: createInitialDocument() };
    case "large":
      return { document: largeDocument() };
    case "malicious":
    case "clipped":
      return { document: clippedDocument() };
      // Deliberately not through importTemplate: this has to prove the renderers
      // are safe on their own, for content that arrives by any other route.
      return { document: maliciousDocument() };
    case "corrupt":
      try {
        const payload = serialize(createInitialDocument());
        payload.nodes.container.children = ["does-not-exist"];
        return { document: importTemplate(payload) };
      } catch (error) {
        return { document: createInitialDocument(), error: error instanceof Error ? error.message : String(error) };
      }
    default:
      return {};
  }
}

