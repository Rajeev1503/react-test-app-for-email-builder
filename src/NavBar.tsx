import { exportHtml, useEngineStore } from "@react-email-builder/react";
import { Eye, EyeOff, Download, Sun, Moon, Monitor, Tablet, Smartphone } from "lucide-react";
import { useState } from "react";


export const NavBar = ({
  isPreviewMode,
  setIsPreviewMode,
  deviceSize,
  setDeviceSize,
}: {
  isPreviewMode: boolean;
  setIsPreviewMode: (val: boolean) => void;
  deviceSize: "mobile" | "tablet" | "desktop";
  setDeviceSize: (size: "mobile" | "tablet" | "desktop") => void;
}) => {
  const selectedNodeId = useEngineStore((state) => state.selectedNodeId);
  const nodes = useEngineStore((state) => state.document.nodes);
  const document = useEngineStore((state) => state.document);

  const [isDarkMode, setIsDarkMode] = useState(
    () => typeof window !== "undefined" && window.document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof window !== "undefined") {
      if (nextDark) {
        window.document.documentElement.classList.add("dark");
      } else {
        window.document.documentElement.classList.remove("dark");
      }
    }
  };



  const handleExportHtml = async () => {
    const html = await exportHtml(document);
    console.log(html);
  };

  // const { isAIEnabled, setIsAIEnabled } = useAgent();

  return (
    <div className="p-2 border-b border-appborder flex gap-2 items-center bg-headerbg text-apptext shadow-sm select-none w-full">
      {/* Title */}
      {/* <span className="text-sm font-bold text-apptext mr-2 tracking-wide uppercase">EmailBuilder</span> */}

      {/* <div className="w-px h-5 bg-appborder mx-1" /> */}

      {/* AI Mode Toggle */}
      {/* <button
        className={`p-2 rounded transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm ${
          isAIEnabled
            ? "bg-purple-600 text-white hover:bg-purple-700"
            : "bg-panelbg text-apptext hover:bg-appbg border border-appborder"
        }`}
        onClick={() => setIsAIEnabled(!isAIEnabled)}
        title={isAIEnabled ? "Disable AI Assistant" : "Enable AI Assistant"}
      >
        <Sparkles className="w-4 h-4" />
        <span>{isAIEnabled ? "AI Active" : "AI Mode"}</span>
      </button> */}

      {/* <div className="w-px h-5 bg-appborder mx-1" /> */}

      {/* Preview Toggle */}
      <button
        className={`p-2 rounded transition-all cursor-pointer border shadow-sm ${isPreviewMode
          ? "bg-[#25aeba] border-[#25aeba] text-white hover:bg-[#1e8f9b]"
          : "bg-panelbg border-appborder text-apptext hover:bg-appbg"
          }`}
        onClick={() => setIsPreviewMode(!isPreviewMode)}
        title={isPreviewMode ? "Switch to Editor Mode" : "Switch to Preview Mode"}
      >
        {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      <div className="w-px h-5 bg-appborder mx-1" />

      {/* Device Sizing Switcher */}
      <div className="flex items-center gap-1 bg-appbg p-1 border border-appborder rounded">
        <button
          className={`p-1.5 rounded transition-all cursor-pointer ${
            deviceSize === "desktop"
              ? "bg-[#25aeba] text-white"
              : "text-apptext hover:bg-panelbg hover:text-[#25aeba]"
          }`}
          onClick={() => setDeviceSize("desktop")}
          title="Desktop / PC View"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          className={`p-1.5 rounded transition-all cursor-pointer ${
            deviceSize === "tablet"
              ? "bg-[#25aeba] text-white"
              : "text-apptext hover:bg-panelbg hover:text-[#25aeba]"
          }`}
          onClick={() => setDeviceSize("tablet")}
          title="Tablet View"
        >
          <Tablet className="w-4 h-4" />
        </button>
        <button
          className={`p-1.5 rounded transition-all cursor-pointer ${
            deviceSize === "mobile"
              ? "bg-[#25aeba] text-white"
              : "text-apptext hover:bg-panelbg hover:text-[#25aeba]"
          }`}
          onClick={() => setDeviceSize("mobile")}
          title="Mobile View"
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-appborder mx-1" />

      {/* Theme Toggle */}
      <button
        className="p-2 rounded transition-all cursor-pointer border border-appborder bg-panelbg text-apptext hover:bg-appbg shadow-sm flex items-center justify-center"
        onClick={toggleDarkMode}
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-apptext" />}
      </button>


      <div className="w-px h-5 bg-appborder mx-1" />

      {/* Export HTML */}
      <button
        className="p-2 bg-white hover:bg-gray-100 text-[#1c1c1c] border border-appborder rounded transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold btn-primary"
        onClick={handleExportHtml}
        title="Export HTML"
      >
        <Download className="w-4 h-4 text-[#1c1c1c]" />
        <span>Export</span>
      </button>

      {/* Selected Node Status Badge */}
      <div className="ml-auto text-xs font-semibold text-apptext flex items-center gap-1.5">
        {selectedNodeId && nodes.get(selectedNodeId) ? (
          <span className="px-2 py-1 bg-panelbg border border-[#25aeba]/30 text-[#25aeba] rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25aeba] animate-pulse" />
            Selected: <span className="font-mono text-[10px] bg-headerbg px-1 py-0.5 rounded">{nodes.get(selectedNodeId)?.type}</span>
          </span>
        ) : (
          <span className="px-2 py-1 bg-headerbg border border-appborder text-mutedtext rounded">
            No Selection
          </span>
        )}
      </div>
    </div>
  );
};
