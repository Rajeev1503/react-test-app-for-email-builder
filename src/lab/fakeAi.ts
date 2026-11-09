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

  const provider = createFakeProvider({
    delayMs: Number(new URLSearchParams(search).get("aiDelay") ?? 0),

    respond({ input, turnIndex, session }) {
      if (turnIndex === 0 && typeof input === "string") prompt = input;
      const target = /node with ID "([^"]+)"/.exec(session.systemPrompt)?.[1];

      // Picks up a turn that didn't finish: the last turn's record is in its history.
      if (prompt.startsWith("Continue where you left off")) {
        const last = [...session.history].reverse().find((message) => message.role === "assistant")?.content ?? "";
        const knew = /already in the email/.test(last) && /Steps:/.test(last);
        return { text: knew ? "Picking up where I stopped: the hero is already in, so I'll finish the rest." : "Starting over." };
      }

      // Changes the email, then fails in a way waiting can't fix, so the turn ends partway.
      if (prompt.includes("halfway")) {
        if (turnIndex === 0) return { toolCalls: [call("insertSubtree", { parentId: "container", subtree: heroSection })] };
        throw new Error("The model returned something unreadable.");
      }

      if (prompt.includes("fail")) {
        if (failuresLeft > 0) {
          failuresLeft--;
          throw new Error("The AI service returned an error (HTTP 429).");
        }
        return { text: "It worked this time." };
      }

      // Saves what it can read from the attachments, to check they reach the model.
      if (prompt.includes("Build the brand profile")) {
        const attached = [...prompt.matchAll(/<attachment name="([^"]+)"/g)].map((match) => match[1]);
        if (turnIndex === 0) {
          const fields: Record<string, unknown> = {};
          const name = /name: ([^;\n]+)/.exec(prompt)?.[1];
          const color = /(?:Main colors|Colors it uses most): (#[0-9a-f]{6})/.exec(prompt)?.[1];
          const logo = /Uploaded to (\S+)/.exec(prompt)?.[1];
          if (name) fields.name = name;
          if (color) fields.primaryColor = color;
          if (logo) fields.logoUrl = logo;
          return { toolCalls: [call("updateBrandProfile", fields)] };
        }
        return { text: `Read ${attached.length} attachments: ${attached.join(", ")}.` };
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

  // One-off answers, such as the AI inbox score. Scripted, so the lab shows a result without a model.
  return {
    ...provider,
    async complete(systemPrompt: string) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (systemPrompt.includes("Score how ready the email")) {
        return JSON.stringify({
          score: 76,
          summary: "Clear and readable, but it has no subject or preheader and the main button sits close to a link.",
          strengths: ["Short, scannable paragraphs", "Real text rather than text in images", "Strong button color contrast"],
          problems: [
            { issue: "There is no subject line.", fix: "Add a subject that says what the email is about, under 40 characters." },
            { issue: "The button and the link below it are crowded together.", fix: "Add space between them so each is easy to tap." },
          ],
        });
      }
      return "Summary of the earlier chat.";
    },
  };
}
