import "./App.css";
import { useMemo, useState } from "react";
import {
  InspectorPanel,
  EmailCanvas,
  EmailProvider,
  PanelResizeHandle,
  PanelToggles,
  templatesTabWith,
  useEditorPanels,
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
import { ExportPane } from "./lab/LabTools";
import { Sparkles } from "lucide-react";
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
        <span className="block text-[10px] font-extrabold text-[#0e7c86] uppercase tracking-wider mb-1">Custom Plugin Tab</span>
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
  icon: <Sparkles className="w-3.5 h-3.5 text-[#0e7c86]" />,
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
  showEditorBar,
}: {
  isPreviewMode: boolean;
  deviceSize: "mobile" | "tablet" | "desktop";
  showEditorBar: boolean;
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
      showEditorBar={showEditorBar}
    />
  );
}

const lab = readLabConfig(window.location.search);
const scenario = loadScenario(lab.scenario);

function App() {
  const labProvider = useMemo(() => (lab.ai === "fake" ? createLabProvider() : undefined), []);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [deviceSize, setDeviceSize] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const { panels, toggle, widths, resize } = useEditorPanels();

  const panelToggles = (
    <PanelToggles panels={panels} onToggle={toggle} disabled={isPreviewMode ? ["bar"] : undefined} labels={{ ai: "Inkling" }} />
  );

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
        allowCustomProviders
        provider={labProvider}
        geminiApiKey={lab.ai === "gemini" ? import.meta.env.VITE_GEMINI_API_KEY : undefined}
        geminiModel="gemini-2.5-flash-lite"
      />
      {/* History restores the last saved email on load, which would replace a scenario. */}
      {!lab.scenario && <HistoryPlugin />}
      <RichTextProvider>
      <DndProvider>
        <div className="flex h-screen w-full relative overflow-hidden bg-appbg text-apptext">

          {/* Left Pane: Chat UI */}
          {/* Hidden rather than unmounted, so a running AI turn and the chat survive. */}
          <div
            className={`transition-all duration-300 border-r border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${panels.ai ? "min-w-[240px] w-[320px] md:w-1/4" : "w-0 border-r-0 invisible"}`}
            style={panels.ai && widths.ai !== null ? { width: widths.ai } : undefined}
          >
            <ChatPanel onFocusRequest={() => { if (!panels.ai) toggle("ai"); }} />
          </div>
          {panels.ai && (
            <PanelResizeHandle side="left" label="Resize AI assistant" width={widths.ai} onResize={(width) => resize("ai", width)} />
          )}

          {/* Middle Pane: Builder Canvas */}
          <div className="flex-1 min-w-[360px] flex flex-col h-full overflow-hidden relative">
            {panels.header ? (
              <NavBar
                isPreviewMode={isPreviewMode}
                setIsPreviewMode={setIsPreviewMode}
                deviceSize={deviceSize}
                setDeviceSize={setDeviceSize}
                panelToggles={panelToggles}
              />
            ) : (
              <div className="absolute right-3 top-3 z-50 shadow-md">{panelToggles}</div>
            )}
            {/* Canvas area: relative wrapper + absolutely positioned scrollable canvas */}
            {scenario.error && (
              <p role="alert" data-testid="scenario-error" className="px-3 py-2 text-xs bg-red-50 text-red-700 border-b border-red-200">
                Could not load this email: {scenario.error}
              </p>
            )}
            <div className="flex-1 min-h-0 flex">
              <div className="flex-1 min-w-0 relative">
                <div className="absolute inset-0" data-testid="canvas-scroll">
                  <SavingCanvas isPreviewMode={isPreviewMode} deviceSize={deviceSize} showEditorBar={panels.bar} />
                </div>
              </div>
              {lab.showExport && <div className="flex-1 min-w-0"><ExportPane /></div>}
            </div>
          </div>

          {/* Right Pane: Inspector Panel with Composable Tabs & Plugin API */}
          {panels.inspector && (
            <PanelResizeHandle side="right" label="Resize inspector" width={widths.inspector} onResize={(width) => resize("inspector", width)} />
          )}
          <div
            className={`transition-all duration-300 border-l border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${panels.inspector ? "min-w-[240px] w-[320px] md:w-1/4" : "w-0 border-l-0 invisible"}`}
            style={panels.inspector && widths.inspector !== null ? { width: widths.inspector } : undefined}
          >
            <InspectorPanel
              tabs={["properties", "blocks", "layouts", "saved", "icons", "images", "outline"]}
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
