import { createFakeProvider, type ProviderToolCall } from "@react-email-builder/engine";

const heroSection = {
  type: "section",
  data: { styles: { backgroundColor: "#ecfeff" } },
  children: [{
    type: "row",
    data: { styles: {} },
    children: [{
      type: "column",
      data: { styles: {} },
      children: [{
        type: "block",
        data: { blockType: "heading", props: { content: "Hero from the AI", level: 1 }, styles: {} },
      }],
    }],
  }],
};

const call = (name: string, args: Record<string, unknown>): ProviderToolCall => ({ name, args });

/**
 * A scripted model for repeatable, free tests of the real agent loop and chat UI.
 * The prompt picks the behavior.
 */
export function createLabProvider(search = window.location.search) {
  let prompt = "";
  let failuresLeft = 1;

  return createFakeProvider({
    delayMs: Number(new URLSearchParams(search).get("aiDelay") ?? 0),

    respond({ input, turnIndex, session }) {
      if (turnIndex === 0 && typeof input === "string") prompt = input;
      const target = /node with ID "([^"]+)"/.exec(session.systemPrompt)?.[1];

      if (prompt.includes("fail")) {
        if (failuresLeft > 0) {
          failuresLeft--;
          throw new Error("The AI service returned an error (HTTP 429).");
        }
        return { text: "It worked this time." };
      }

      // Scoped to the attached node.
      if (prompt.includes("shorter") && target) {
        return turnIndex === 0
          ? { toolCalls: [call("updateTextContent", { nodeId: target, content: "Shorter" })] }
          : { text: "Shortened it." };
      }

      // Tries a style email can't use, then corrects itself from the rejection.
      if (prompt.includes("space")) {
        if (turnIndex === 0) return { toolCalls: [call("updateNodeStyles", { nodeId: "section-0", styles: { gap: 24 } })] };
        if (turnIndex === 1) return { toolCalls: [call("updateNodeStyles", { nodeId: "section-0", styles: { paddingTop: 40 } })] };
        return { text: "Added space using padding." };
      }

      if (prompt.includes("headings")) {
        return turnIndex === 0
          ? { toolCalls: [call("styleNodes", { match: { blockType: "heading" }, styles: { color: "#7c3aed" } })] }
          : { text: "Restyled the headings." };
      }

      // Leaves something for the verifier to report.
      if (prompt.includes("pale")) {
        return turnIndex === 0
          ? { toolCalls: [call("updateNodeStyles", { nodeId: "section-0-row-col-0-text-1", styles: { color: "#eeeeee" } })] }
          : { text: "Made it pale." };
      }

      // Keeps working, so a test can stop it.
      if (prompt.includes("forever")) return { toolCalls: [call("insertSubtree", { parentId: "container", subtree: heroSection })] };

      if (turnIndex === 0 && typeof input === "string") {
        return { toolCalls: [call("insertSubtree", { parentId: "container", subtree: heroSection })] };
      }
      return { text: "Added a hero section." };
    },
  });
}
