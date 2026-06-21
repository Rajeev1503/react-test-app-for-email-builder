import "./App.css";
import { useState } from "react";
import { EditorProvider } from "@react-email-builder/react";
import { NavBar } from "./NavBar";
import Render from "./render";
import { PropertiesPanel } from "./PropertiesPanel";
import { AgentProvider, AIChatComponent, ChatPanel } from "@react-email-builder/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function App() {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <AgentProvider geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY} geminiModel="gemini-2.5-flash-lite">
      <EditorProvider>
        <div className="flex h-screen w-full relative overflow-hidden bg-appbg text-apptext">
          
          {/* Left Pane: Chat UI */}
          <div className={`transition-all duration-300 shrink-0 border-r border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${leftOpen ? "w-[320px] md:w-1/4" : "w-0 border-r-0"}`}>
            <ChatPanel
              style={{ borderRightWidth: '2px' }}
              classes={{
                header: "bg-emerald-550/10 border-emerald-500/20",
                messageUserBubble: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-teal-500/10",
                starterPromptButton: "hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400",
              }}
              styles={{
                headerTitleText: { letterSpacing: '0.05em' },
              }}
            />
          </div>

          {/* Middle Pane: Builder Canvas */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
            
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

            <NavBar isPreviewMode={isPreviewMode} setIsPreviewMode={setIsPreviewMode} />
            <div className="flex-1 overflow-auto bg-gray-100 p-5 flex justify-center relative">
              <Render isPreviewMode={isPreviewMode} />
            </div>
          </div>

          {/* Right Pane: Properties Panel */}
          <div className={`transition-all duration-300 shrink-0 border-l border-appborder flex flex-col bg-panelbg overflow-hidden h-full ${rightOpen ? "w-[320px] md:w-1/4" : "w-0 border-l-0"}`}>
            <PropertiesPanel />
          </div>

          <AIChatComponent
            classes={{
              root: "border-2 border-purple-550/25 shadow-[0_20px_50px_rgba(147,51,234,0.15)]",
              header: "border-purple-100/50 dark:border-purple-950/50",
            }}
          />
        </div>
      </EditorProvider>
    </AgentProvider>
  );
}

export default App;
