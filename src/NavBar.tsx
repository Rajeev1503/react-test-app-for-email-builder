import { exportHtml, useEngineStore, useTheme } from "@react-email-builder/react";
// History persistence ships from its own entry point.
import { useTemplateHistory } from "@react-email-builder/react/history";
import { Eye, EyeOff, Sun, Moon, Monitor, Tablet, Smartphone, Clipboard, Check, Trash2 } from "lucide-react";
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
  const { clearCanvas } = useTemplateHistory();

  const handleClearCanvas = async () => {
    const ok = window.confirm("Are you sure you want to clear the canvas and start fresh? This will permanently delete your current revisions.");
    if (!ok) return;
    try {
      await clearCanvas();
    } catch (e) {
      console.error(e);
      alert("Failed to clear canvas: " + (e instanceof Error ? e.message : String(e)));
    }
  };
  const nodes = useEngineStore((state) => state.document.nodes);
  const document = useEngineStore((state) => state.document);

  const { resolvedTheme, setTheme } = useTheme();

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };



  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    try {
      const html = await exportHtml(document);
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([html], { type: "text/plain" });
      const data = [new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob })];
      await navigator.clipboard.write(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
      alert("Failed to copy email: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  // const { isAIEnabled, setIsAIEnabled } = useAgent();

  return (
    <div className="p-2 border-b border-appborder flex gap-2 items-center bg-headerbg text-apptext shadow-sm select-none w-full">
      {/* Title */}
      <span className="text-sm font-bold text-apptext mr-2 tracking-wide uppercase">EmailBuilder</span>

      <div className="w-px h-5 bg-appborder mx-1" />

      {/* Preview Toggle */}
      <button
        className={`p-2 rounded transition-all cursor-pointer border shadow-sm ${isPreviewMode
          ? "bg-accent border-accent text-white hover:bg-accent/90"
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
          className={`p-1.5 rounded transition-all cursor-pointer ${deviceSize === "desktop"
            ? "bg-accent text-white"
            : "text-apptext hover:bg-panelbg hover:text-accent"
            }`}
          onClick={() => setDeviceSize("desktop")}
          title="Desktop / PC View"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          className={`p-1.5 rounded transition-all cursor-pointer ${deviceSize === "tablet"
            ? "bg-accent text-white"
            : "text-apptext hover:bg-panelbg hover:text-accent"
            }`}
          onClick={() => setDeviceSize("tablet")}
          title="Tablet View"
        >
          <Tablet className="w-4 h-4" />
        </button>
        <button
          className={`p-1.5 rounded transition-all cursor-pointer ${deviceSize === "mobile"
            ? "bg-accent text-white"
            : "text-apptext hover:bg-panelbg hover:text-accent"
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
        title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {resolvedTheme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-apptext" />}
      </button>

      <div className="w-px h-5 bg-appborder mx-1" />

      {/* Clear Canvas */}
      <button
        className="p-2 rounded transition-all cursor-pointer border border-red-500/30 bg-panelbg text-red-400 hover:bg-red-500/10 hover:text-red-500 shadow-sm flex items-center justify-center"
        onClick={handleClearCanvas}
        title="Clear Canvas and Start Fresh"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-appborder mx-1" />

      {/* Export (Copy to Clipboard) */}
      <button
        className={`p-2 rounded transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold text-white border border-accent/25 ${copied ? "bg-emerald-600 hover:bg-emerald-700" : "bg-accent hover:bg-accent/90"
          }`}
        onClick={handleExport}
        title="Copy email as Rich Text formatted HTML to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-white" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Clipboard className="w-4 h-4 text-white" />
            <span>Export</span>
          </>
        )}
      </button>

      {/* Selected Node Status Badge */}
      <div className="ml-auto text-xs font-semibold text-apptext flex items-center gap-1.5">
        {selectedNodeId && nodes.get(selectedNodeId) ? (
          <span className="px-2 py-1 bg-panelbg border border-accent/30 text-accent rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
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
