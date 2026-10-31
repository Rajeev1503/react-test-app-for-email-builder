import "./App.css";
import { useState } from "react";
import {
  InspectorPanel,
  EmailProvider,
  Canvas,
  templatesTabWith,
  useInspectorContext,
  useEngineStore,
} from "@react-email-builder/react";
// The AI and history surfaces ship from their own entry points, so an editor
// that wants neither carries neither the model provider nor IndexedDB.
import { ChatPanel, AgentPlugin, aiCanvasPlugin } from "@react-email-builder/react/ai";
import { HistoryPlugin, historyTab } from "@react-email-builder/react/history";
// Drag-and-drop: opt-in subpath export so the dnd-kit graph stays out of
// editors that don't need it.
import { DndProvider, DndNodeChrome, dndCanvasPlugin } from "@react-email-builder/react/dnd";
// The starter templates are their own package now — 1793 lines of document data
// that used to be unconditional bundle weight.
import { templateManifest } from "@react-email-builder/templates";
import { NavBar } from "./NavBar";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import "@react-email-builder/react/styles.css";

/**
 * A custom inspector tab.
 *
 * `content` is a component now, not a `render: (ctx) => ReactNode` prop — so it
 * runs its own hooks and re-renders on its own, instead of re-rendering every
 * time the panel does.
 */
function CustomPluginTab() {
  const { nodeId, node } = useInspectorContext();

  return (
    <div className="p-4 space-y-3">
      <div className="p-3 bg-headerbg border border-appborder rounded-lg">
        <span className="block text-[10px] font-extrabold text-[#25aeba] uppercase tracking-wider mb-1">Custom Plugin Tab</span>
        <p className="text-xs text-mutedtext leading-relaxed font-light">
          This tab is injected dynamically as a plugin via the composed API!
        </p>
      </div>
      <div className="p-3 bg-panelbg border border-appborder rounded-lg text-xs space-y-2">
        <span className="font-bold block text-apptext">Selected Element Info:</span>
        <p className="font-mono text-[10px] bg-headerbg p-1.5 rounded truncate text-mutedtext">
          ID: {nodeId || "None Selected"}
        </p>
        <p className="font-mono text-[10px] bg-headerbg p-1.5 rounded truncate text-mutedtext">
          Type: {node?.type || "None Selected"}
        </p>
      </div>
    </div>
  );
}

const customPluginTab = {
  id: "custom-plugin",
  label: "Custom",
  icon: <Sparkles className="w-3.5 h-3.5 text-[#25aeba]" />,
  content: CustomPluginTab,
};

/** The Templates tab, preloaded with the starters from the templates package. */
const templatesTab = templatesTabWith(templateManifest);

const DEVICE_MAX_WIDTH = { mobile: "375px", tablet: "600px", desktop: "600px" } as const;

const allOverlays = [...aiCanvasPlugin.overlays, ...dndCanvasPlugin.overlays];

function DndEmailCanvas({
  isPreviewMode,
  deviceSize = "desktop",
}: {
  isPreviewMode: boolean;
  deviceSize?: "mobile" | "tablet" | "desktop";
}) {
  const bodyBg = useEngineStore((s) => {
    const root = s.document.nodes.get(s.document.rootId);
    const bodyId = root?.children?.[0];
    const body = bodyId ? s.document.nodes.get(bodyId) : null;
    return (body?.data as { styles?: { backgroundColor?: string } })?.styles?.backgroundColor;
  });
  const background = bodyBg || "#ffffff";

  return (
    <Canvas.Root
      preview={isPreviewMode}
      device={deviceSize}
      toolbarActions={aiCanvasPlugin.toolbarActions}
      overlays={allOverlays}
    >
      <div
        style={{ backgroundColor: "var(--reb-bg-canvas)", display: "flex", justifyContent: "center", padding: "24px 16px", minHeight: "100%" }}
      >
        <div style={{ maxWidth: DEVICE_MAX_WIDTH[deviceSize], width: "100%", backgroundColor: background }}>
          {/* Render tree directly (no iframe) so dnd-kit sensors can see pointer
              events on the sortable nodes. The iframe isolates CSS but also
              isolates DOM events, which breaks drag-and-drop. */}
          <Canvas.Tree>
            {(nodeId, depth) => <DndNodeChrome nodeId={nodeId} depth={depth} />}
          </Canvas.Tree>
        </div>
      </div>
      <Canvas.Overlays />
    </Canvas.Root>
  );
}

function App() {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [deviceSize, setDeviceSize] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <EmailProvider
      defaultTheme="light"
    >
      <AgentPlugin inlineNodeAI={true} geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY} geminiModel="gemini-2.5-flash-lite" />
      <HistoryPlugin />
      <DndProvider>
        <div className="flex h-screen w-full relative overflow-hidden bg-appbg text-apptext">

          {/* Left Pane: Chat UI */}
          <div className={`transition-all duration-300 shrink-0 border-r border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${leftOpen ? "w-[320px] md:w-1/4" : "w-0 border-r-0"}`}>
            <ChatPanel style={{ borderRightWidth: "2px" }} />
          </div>

          {/* Middle Pane: Builder Canvas */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">

            {/* Left Panel Toggle Button */}
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-50 bg-panelbg hover:bg-headerbg border border-appborder rounded-full p-2 shadow-md text-apptext transition-all focus:outline-none hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
              title={leftOpen ? "Collapse AI Assistant" : "Expand AI Assistant"}
            >
              {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Right Panel Toggle Button */}
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-50 bg-panelbg hover:bg-headerbg border border-appborder rounded-full p-2 shadow-md text-apptext transition-all focus:outline-none hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
              title={rightOpen ? "Collapse Properties Panel" : "Expand Properties Panel"}
            >
              {rightOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <NavBar
              isPreviewMode={isPreviewMode}
              setIsPreviewMode={setIsPreviewMode}
              deviceSize={deviceSize}
              setDeviceSize={setDeviceSize}
            />
            {/* Canvas area: relative wrapper + absolutely positioned scrollable canvas */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0 overflow-y-auto">
                <DndEmailCanvas isPreviewMode={isPreviewMode} deviceSize={deviceSize} />
              </div>
            </div>
          </div>

          {/* Right Pane: Inspector Panel with Composable Tabs & Plugin API */}
          <div className={`transition-all duration-300 shrink-0 border-l border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${rightOpen ? "w-[320px] md:w-1/4" : "w-0 border-l-0"}`}>
            <InspectorPanel
              tabs={["properties", "blocks", "layouts", "outline"]}
              customTabs={[historyTab, templatesTab, customPluginTab]}
            />
          </div>

        </div>
      </DndProvider>
    </EmailProvider>
  );
}

export default App;
