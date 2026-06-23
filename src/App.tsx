import "./App.css";
import { useState } from "react";
import { EditorProvider, InspectorPanel, EmailCanvas } from "@react-email-builder/react";
import { NavBar } from "./NavBar";
import { AgentProvider, ChatPanel } from "@react-email-builder/react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

function App() {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [deviceSize, setDeviceSize] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <AgentProvider inlineNodeAI={true} geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY} geminiModel="gemini-2.5-flash-lite">
      <EditorProvider>
        <div className="flex h-screen w-full relative overflow-hidden bg-appbg text-apptext">
          
          {/* Left Pane: Chat UI */}
          <div className={`transition-all duration-300 shrink-0 border-r border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${leftOpen ? "w-[320px] md:w-1/4" : "w-0 border-r-0"}`}>
            <ChatPanel
              style={{ borderRightWidth: '2px' }}
              classes={{
                header: "bg-accent/5 border-accent/20",
                messageUserBubble: "bg-accent text-white border-accent/10",
                starterPromptButton: "hover:border-accent hover:text-accent",
              }}
              styles={{
                headerTitleText: { letterSpacing: '0.05em' },
              }}
            />
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
                <EmailCanvas isPreviewMode={isPreviewMode} deviceSize={deviceSize} />
              </div>
            </div>
          </div>

          {/* Right Pane: Inspector Panel with Composable Tabs & Plugin API */}
          <div className={`transition-all duration-300 shrink-0 border-l border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${rightOpen ? "w-[320px] md:w-1/4" : "w-0 border-l-0"}`}>
            <InspectorPanel
              tabs={["properties", "blocks", "layouts", "outline", "templates"]}
              customTabs={[
                {
                  id: "custom-plugin",
                  label: "Custom",
                  icon: <Sparkles className="w-3.5 h-3.5 text-[#25aeba]" />,
                  render: ({ selectedNodeId, node }) => (
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
                          ID: {selectedNodeId || "None Selected"}
                        </p>
                        <p className="font-mono text-[10px] bg-headerbg p-1.5 rounded truncate text-mutedtext">
                          Type: {node?.type || "None Selected"}
                        </p>
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </div>

        </div>
      </EditorProvider>
    </AgentProvider>
  );
}

export default App;
