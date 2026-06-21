import type { Command } from "@react-email-builder/engine";
import { exportHtml, useEngineStore, useDispatch } from "@react-email-builder/react";
import type { InsertableNodeType } from "../../react-email-builder/packages/core/dist";
import { Eye, EyeOff, Layers, Rows, Columns, Type, MousePointerClick, Image, Download, Sun, Moon } from "lucide-react";
import { useState } from "react";

const generateId = () => Math.random().toString(36).substr(2, 9);

export const NavBar = ({
  isPreviewMode,
  setIsPreviewMode,
}: {
  isPreviewMode: boolean;
  setIsPreviewMode: (val: boolean) => void;
}) => {
  const dispatch = useDispatch();
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

  const safeDispatch = ({ type, payload }: { type: "INSERT_NODE", payload: Omit<Extract<Command, { type: "INSERT_NODE" }>["payload"], "parentId"> }) => {
    try {
      if (!selectedNodeId) {
        alert("Please select a node to add an element.");
        return;
      }

      const parentNode = nodes.get(selectedNodeId);
      if (!parentNode) {
        alert("Parent node not found");
        return;
      }
      dispatch({
        type,
        payload: {
          ...payload,
          parentId: selectedNodeId
        }
      });
    } catch (error: any) {
      alert(`Failed to add element: ${error.message}`);
      console.error(error);
    }
  };

  const handleAddSection = () => {

    const sectionNode = {
      type: "section" as InsertableNodeType,
      data: {
        styles: {
          paddingTop: 1,
          paddingBottom: 1,
          paddingLeft: 1,

          backgroundColor: "#999",
        },
      }
    };
    safeDispatch({
      type: "INSERT_NODE",
      payload: {
        node: sectionNode,
      },
    });
  };

  const handleAddText = () => {
    if (!selectedNodeId) {
      alert("Please select a column to add text.");
      return;
    }

    const textNode: any = {
      type: "block",
      data: {
        props: {
          content: "Hello World",
        },
        styles: {
          color: "red",
        },
        blockType: "text",
      }
    };

    safeDispatch({
      type: "INSERT_NODE",
      payload: {
        node: textNode,
      },
    });
  };

  const handleAddButton = () => {
    if (!selectedNodeId) {
      alert("Please select a column to add a button.");
      return;
    }

    const buttonNode: any = {
      type: "block",
      data: {

        props: {
          label: "Click Me",
          href: "#",
        },
        styles: {
          backgroundColor: "#007bff",
          color: "#ffffff",
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 10,
          paddingRight: 10,
          borderRadius: 100,
        },
        blockType: "button",
      }
    };

    safeDispatch({
      type: "INSERT_NODE",
      payload: {
        node: buttonNode,
      },
    });
  };

  const handleAddImage = () => {
    if (!selectedNodeId) {
      alert("Please select a column to add an image.");
      return;
    }

    const imageNode: any = {
      type: "block",
      data: {

        props: {
          src: "https://via.placeholder.com/150",
          alt: "Placeholder",
        },
        styles: {
          width: "150px",
          height: "150px",
        },
        blockType: "image",
      }
    };

    safeDispatch({
      type: "INSERT_NODE",
      payload: {
        node: imageNode,
      },
    });
  };

  const handleAddRow = () => {
    if (!selectedNodeId) {
      alert("Please select a section to add a row.");
      return;
    }

    const rowNode: any = {
      id: generateId(),
      type: "row",
      styles: {
        paddingTop: 1,
        paddingBottom: 1,
        paddingLeft: 1,
        paddingRight: 1,
        backgroundColor: "#999",
      },
    };
    safeDispatch({
      type: "INSERT_NODE",
      payload: {
        node: rowNode,
      },
    });
  };

  const handleAddColumn = () => {
    if (!selectedNodeId) {
      alert("Please select a row to add a column.");
      return;
    }

    const colNode: any = {
      id: generateId(),
      type: "column",
      styles: {
        paddingTop: 1,
        paddingBottom: 1,
        paddingLeft: 1,
        paddingRight: 1,
        backgroundColor: "#999",
      },
    };
    safeDispatch({
      type: "INSERT_NODE",
      payload: {
        node: colNode,
      },
    });
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
          ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
          : "bg-panelbg border-appborder text-apptext hover:bg-appbg"
          }`}
        onClick={() => setIsPreviewMode(!isPreviewMode)}
        title={isPreviewMode ? "Switch to Editor Mode" : "Switch to Preview Mode"}
      >
        {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

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

      {/* Mutation Buttons Group */}
      <div className="flex items-center gap-1 bg-appbg p-1 border border-appborder rounded">
        <button
          className="p-1.5 text-apptext hover:bg-panelbg hover:text-blue-600 rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleAddSection}
          disabled={isPreviewMode}
          title="Add Section (Select Container)"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 text-apptext hover:bg-panelbg hover:text-green-600 rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleAddRow}
          disabled={isPreviewMode}
          title="Add Row (Select Section)"
        >
          <Rows className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 text-apptext hover:bg-panelbg hover:text-purple-600 rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleAddColumn}
          disabled={isPreviewMode}
          title="Add Column (Select Row)"
        >
          <Columns className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-appborder mx-1" />

        <button
          className="p-1.5 text-apptext hover:bg-panelbg hover:text-indigo-600 rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleAddText}
          disabled={isPreviewMode}
          title="Add Text Block (Select Column)"
        >
          <Type className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 text-apptext hover:bg-panelbg hover:text-indigo-650 rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleAddButton}
          disabled={isPreviewMode}
          title="Add Button Block (Select Column)"
        >
          <MousePointerClick className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 text-apptext hover:bg-panelbg hover:text-pink-600 rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleAddImage}
          disabled={isPreviewMode}
          title="Add Image Block (Select Column)"
        >
          <Image className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-appborder mx-1" />

      {/* Export HTML */}
      <button
        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        onClick={handleExportHtml}
        title="Export HTML"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      {/* Selected Node Status Badge */}
      <div className="ml-auto text-xs font-semibold text-apptext flex items-center gap-1.5">
        {selectedNodeId && nodes.get(selectedNodeId) ? (
          <span className="px-2 py-1 bg-panelbg border border-appborder text-apptext rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
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
