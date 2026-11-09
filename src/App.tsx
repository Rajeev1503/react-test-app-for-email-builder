import "./App.css";
import { useMemo, useState } from "react";
import { useMediaQuery } from "./useMediaQuery";
import {
  InspectorPanel,
  EmailCanvas,
  EmailProvider,
  PanelResizeHandle,
  PanelToggles,
  animateChange,
  templatesTabWith,
  useEditorPanels,
  useInspectorContext,
  useSaveStatus,
} from "@react-email-builder/react";
import { serialize } from "@react-email-builder/core";
// The AI and history surfaces ship from their own entry points, so an editor
// that wants neither carries neither the model provider nor IndexedDB.
import { ChatPanel, AgentPlugin, AiInboxScore, aiCanvasPlugin, createBrowserProvider } from "@react-email-builder/react/ai";
import { HistoryPlugin, historyTab } from "@react-email-builder/react/history";
// Drag and drop ships from its own entry point too.
import { DndProvider, dndCanvasPlugin } from "@react-email-builder/react/dnd";
// The starter templates are their own package now — 1793 lines of document data
// that used to be unconditional bundle weight.
import { templateManifest } from "@react-email-builder/templates";
import { RichTextProvider } from "@react-email-builder/react/rich-text";
import type { DeviceSize } from "@react-email-builder/react/toolbar";
import { NavBar } from "./NavBar";
import { readLabConfig, loadScenario } from "./lab/scenarios";
import { createLabProvider } from "./lab/fakeAi";
import { labAssets } from "./lab/assets";
import { labReadPage } from "./lab/readPage";
import { ExportPane } from "./lab/LabTools";
import { Gauge, Sparkles } from "lucide-react";
import { InboxReport } from "@react-email-builder/react/inbox";
import "@react-email-builder/react/styles.css";

/**
 * A custom inspector tab.
 *
 * `content` is a component now, not a `render: (ctx) => ReactNode` prop — so it
 * runs its own hooks and re-renders on its own, instead of re-rendering every
 * time the panel does.
 */

/**
 * The model from `.env`, if one is set up: any service the settings panel lists.
 * Development only, as the key ends up in the page.
 */
function envProvider() {
  const env = import.meta.env;
  if (!env.VITE_AI_SERVICE || !env.VITE_AI_MODEL) return undefined;
  return createBrowserProvider({
    service: env.VITE_AI_SERVICE,
    model: env.VITE_AI_MODEL,
    apiKey: env.VITE_AI_API_KEY,
    baseUrl: env.VITE_AI_BASE_URL || undefined,
  });
}

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

/** The inbox score, as an inspector tab: a list fits the panel's width. */
const inboxScoreTab = {
  id: "inbox-score",
  label: "Inbox score",
  icon: <Gauge />,
  order: 39,
  content: () => <InboxReport secondOpinion={<AiInboxScore />} />,
};

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
  deviceToolbar,
  zoom,
}: {
  isPreviewMode: boolean;
  deviceSize: "mobile" | "tablet" | "desktop";
  showEditorBar: boolean;
  deviceToolbar: boolean;
  zoom: number;
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
      deviceToolbar={deviceToolbar}
      zoom={zoom}
    />
  );
}

const lab = readLabConfig(window.location.search);
const scenario = loadScenario(lab.scenario);

function App() {
  const labProvider = useMemo(() => (lab.ai === "fake" ? createLabProvider() : envProvider()), []);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const { panels, toggle, widths, resize } = useEditorPanels();
  // The preview takes the canvas's place: the exported email, email clients and the inbox score.
  const [showPreview, setShowPreview] = useState(lab.showExport);
  const [deviceToolbar, setDeviceToolbar] = useState(false);
  const [zoom, setZoom] = useState(1);
  // Too narrow for side panels beside the canvas: they become drawers over it, one at a time.
  const compact = useMediaQuery("(max-width: 1023px)");
  const [drawer, setDrawer] = useState<"ai" | "inspector" | null>(null);
  const closeDrawer = () => animateChange(() => setDrawer(null));

  // The drawers keep their own open state, so the saved desktop layout is left as it was.
  const shown = compact ? { ...panels, header: true, ai: drawer === "ai", inspector: drawer === "inspector" } : panels;
  const onToggle = (id: keyof typeof panels) => {
    if (compact && (id === "ai" || id === "inspector")) setDrawer((open) => (open === id ? null : id));
    else toggle(id);
  };
  const panelToggles = (
    <PanelToggles panels={shown} onToggle={onToggle} labels={{ ai: "Envoy" }} disabled={compact ? ["header"] : undefined} />
  );
  const sidePanel = (side: "left" | "right", open: boolean) =>
    compact
      ? `absolute inset-y-0 ${side === "left" ? "left-0 border-r" : "right-0 border-l"} z-40 w-[min(340px,88vw)] border-appborder flex flex-col bg-panelbg overflow-hidden shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : `${side === "left" ? "-translate-x-full" : "translate-x-full"} invisible`
        }`
      : `transition-all duration-300 ${side === "left" ? "border-r" : "border-l"} border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${
          open ? "min-w-[200px] w-[320px] md:w-1/4" : `w-0 ${side === "left" ? "border-r-0" : "border-l-0"} invisible`
        }`;
  // A saved width applies beside the canvas, not to a drawer.
  const sideWidth = (open: boolean, width: number | null) => (!compact && open && width !== null ? { width } : undefined);

  return (
    <EmailProvider
      defaultTheme="light"
      initialDocument={scenario.document}
      blocks={scenario.blocks}
      assets={labAssets}
      mergeTags={LAB_MERGE_TAGS}
      readPage={labReadPage}
    >
      <AgentPlugin
        inlineNodeAI={true}
        allowCustomProviders
        provider={labProvider}
      />
      {/* History restores the last saved email on load, which would replace a scenario. */}
      {!lab.scenario && <HistoryPlugin />}
      <RichTextProvider>
      <DndProvider>
        <div className="flex flex-col h-screen w-full overflow-hidden bg-appbg text-apptext">
          {/* Page header: the library's toolbar, across the whole page, above every panel. */}
          {shown.header && (
            <NavBar
              compact={compact}
              deviceSize={deviceSize}
              setDeviceSize={setDeviceSize}
              panelToggles={panelToggles}
              previewOpen={showPreview}
              onTogglePreview={() => animateChange(() => setShowPreview((open) => !open))}
              deviceToolbar={deviceToolbar}
              onDeviceToolbarChange={(on) => animateChange(() => setDeviceToolbar(on))}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          )}
        <div className="flex flex-1 min-h-0 w-full relative overflow-hidden">

          {/* Left Pane: Chat UI */}
          {/* Hidden rather than unmounted, so a running AI turn and the chat survive. */}
          <div className={sidePanel("left", shown.ai)} style={sideWidth(shown.ai, widths.ai)} data-testid="left-panel" inert={!shown.ai}>
            <ChatPanel
              onFocusRequest={() => { if (!shown.ai) onToggle("ai"); }}
              onClose={compact ? closeDrawer : undefined}
            />
          </div>
          {!compact && panels.ai && (
            <PanelResizeHandle side="left" label="Resize AI assistant" width={widths.ai} onResize={(width) => resize("ai", width)} onCollapse={() => animateChange(() => toggle("ai"))} />
          )}

          {/* Middle Pane: Builder Canvas */}
          <div className={`flex-1 ${compact ? "min-w-0" : "min-w-[360px]"} flex flex-col h-full overflow-hidden relative`}>
            {/* With the header hidden, the toggles stay on screen so it can come back. */}
            {!shown.header && <div className="absolute right-3 top-3 z-50 shadow-md">{panelToggles}</div>}
            {/* Canvas area: relative wrapper + absolutely positioned scrollable canvas */}
            {scenario.error && (
              <p role="alert" data-testid="scenario-error" className="px-3 py-2 text-xs bg-red-50 text-red-700 border-b border-red-200">
                Could not load this email: {scenario.error}
              </p>
            )}
            {/* The preview takes the canvas's place. The canvas stays mounted, hidden,
                so switching back loses nothing and saving carries on. */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0" data-testid="canvas-scroll" hidden={showPreview}>
                <SavingCanvas isPreviewMode={false} deviceSize={deviceSize} showEditorBar={panels.bar} deviceToolbar={deviceToolbar} zoom={zoom} />
              </div>
              {showPreview && <div className="absolute inset-0"><ExportPane onClose={() => animateChange(() => setShowPreview(false))} /></div>}
            </div>
          </div>

          {/* Right Pane: Inspector Panel with Composable Tabs & Plugin API */}
          {/* A drawer covers the canvas; tapping beside it closes it. */}
          {compact && drawer && (
            <div className="absolute inset-0 z-30 bg-black/30" onClick={closeDrawer} aria-hidden data-testid="drawer-backdrop" />
          )}
          {!compact && panels.inspector && (
            <PanelResizeHandle side="right" label="Resize inspector" width={widths.inspector} onResize={(width) => resize("inspector", width)} onCollapse={() => animateChange(() => toggle("inspector"))} />
          )}
          <div className={sidePanel("right", shown.inspector)} style={sideWidth(shown.inspector, widths.inspector)} data-testid="right-panel" inert={!shown.inspector}>
            <InspectorPanel
              onClose={compact ? closeDrawer : undefined}
              tabs={["properties", "blocks", "layouts", "saved", "icons", "images", "brand", "outline"]}
              customTabs={[historyTab, templatesTab, inboxScoreTab, customPluginTab]}
            />
          </div>

        </div>
        </div>
      </DndProvider>
      </RichTextProvider>
    </EmailProvider>
  );
}

export default App;
