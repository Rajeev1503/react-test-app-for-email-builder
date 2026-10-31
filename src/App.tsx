import "./App.css";
import { useMemo, useState } from "react";
import {
  InspectorPanel,
  EmailCanvas,
  EmailProvider,
  templatesTabWith,
  useInspectorContext,
  useSaveStatus,
} from "@react-email-builder/react";
import { serialize } from "@react-email-builder/core";
// The AI and history surfaces ship from their own entry points, so an editor
// that wants neither carries neither the model provider nor IndexedDB.
import { ChatPanel, AgentPlugin, aiCanvasPlugin } from "@react-email-builder/react/ai";
import { HistoryPlugin, historyTab } from "@react-email-builder/react/history";
// Drag and drop ships from its own entry point too.
import { DndProvider, dndCanvasPlugin } from "@react-email-builder/react/dnd";
// The starter templates are their own package now — 1793 lines of document data
// that used to be unconditional bundle weight.
import { templateManifest } from "@react-email-builder/templates";
import { RichTextProvider } from "@react-email-builder/react/rich-text";
import { NavBar } from "./NavBar";
import { readLabConfig, loadScenario } from "./lab/scenarios";
import { createLabProvider } from "./lab/fakeAi";
import { labAssets } from "./lab/assets";
import { ExportPane, LabBridge } from "./lab/LabTools";
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

const allOverlays = [...aiCanvasPlugin.overlays, ...dndCanvasPlugin.overlays];

const LAB_MERGE_TAGS = [
  { key: "first_name", label: "First name", sample: "Sam" },
  { key: "company", label: "Company", sample: "Acme" },
  { key: "unsubscribe_url", label: "Unsubscribe link", sample: "https://example.com/unsubscribe" },
];

const SAVE_LABELS = {
  idle: "",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Could not save",
};

/** Saves a draft on every change, to show the save status working for real. */
function SavingCanvas({
  isPreviewMode,
  deviceSize,
}: {
  isPreviewMode: boolean;
  deviceSize: "mobile" | "tablet" | "desktop";
}) {
  const saveStatus = useSaveStatus((document) => {
    localStorage.setItem("email-builder-draft", JSON.stringify(serialize(document)));
  });

  return (
    <EmailCanvas
      isPreviewMode={isPreviewMode}
      deviceSize={deviceSize}
      toolbarActions={aiCanvasPlugin.toolbarActions}
      overlays={allOverlays}
      status={SAVE_LABELS[saveStatus]}
    />
  );
}

const lab = readLabConfig(window.location.search);
const scenario = loadScenario(lab.scenario);

function App() {
  const labProvider = useMemo(() => (lab.ai === "fake" ? createLabProvider() : undefined), []);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [deviceSize, setDeviceSize] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <EmailProvider
      defaultTheme="light"
      initialDocument={scenario.document}
      blocks={scenario.blocks}
      assets={labAssets}
      mergeTags={LAB_MERGE_TAGS}
    >
      <AgentPlugin
        inlineNodeAI={true}
        provider={labProvider}
        geminiApiKey={lab.ai === "gemini" ? import.meta.env.VITE_GEMINI_API_KEY : undefined}
        geminiModel="gemini-2.5-flash-lite"
      />
      {/* History restores the last saved email on load, which would replace a scenario. */}
      {!lab.scenario && <HistoryPlugin />}
      <LabBridge />
      <RichTextProvider>
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
            {scenario.error && (
              <p role="alert" data-testid="scenario-error" className="px-3 py-2 text-xs bg-red-50 text-red-700 border-b border-red-200">
                Could not load this email: {scenario.error}
              </p>
            )}
            <div className="flex-1 min-h-0 flex">
              <div className="flex-1 min-w-0 relative">
                <div className="absolute inset-0" data-testid="canvas-scroll">
                  <SavingCanvas isPreviewMode={isPreviewMode} deviceSize={deviceSize} />
                </div>
              </div>
              {lab.showExport && <div className="flex-1 min-w-0"><ExportPane /></div>}
            </div>
          </div>

          {/* Right Pane: Inspector Panel with Composable Tabs & Plugin API */}
          <div className={`transition-all duration-300 shrink-0 border-l border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${rightOpen ? "w-[320px] md:w-1/4" : "w-0 border-l-0"}`}>
            <InspectorPanel
              tabs={["properties", "blocks", "layouts", "saved", "outline"]}
              customTabs={[historyTab, templatesTab, customPluginTab]}
            />
          </div>

        </div>
      </DndProvider>
      </RichTextProvider>
    </EmailProvider>
  );
}

export default App;
