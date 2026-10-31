import { createFakeProvider } from "@react-email-builder/engine";

/**
 * A scripted model for repeatable, free tests of the real agent loop and chat UI.
 * It adds a hero section on request, then reports what it did.
 */
export function createLabProvider() {
  return createFakeProvider({
    respond({ input, turnIndex }) {
      if (turnIndex === 0 && typeof input === "string") {
        return {
          toolCalls: [
            {
              name: "insertSubtree",
              args: {
                parentId: "container",
                subtree: {
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
                        data: {
                          blockType: "heading",
                          props: { content: "Hero from the AI", level: 1 },
                          styles: {},
                        },
                      }],
                    }],
                  }],
                },
              },
            },
          ],
        };
      }
      return { text: "Added a hero section." };
    },
  });
}
