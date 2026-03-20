import type { Command } from "@react-email-builder/engine";
import { exportHtml, useEngineStore } from "@react-email-builder/react";
import type { RenderNodeTypeData } from "./types";
import type { InsertableNodeType, NodeType } from "../../react-email-builder/packages/core/dist";

const generateId = () => Math.random().toString(36).substr(2, 9);

export const NavBar = () => {
  const dispatch = useEngineStore((state) => state.dispatch);
  const selectedNodeId = useEngineStore((state) => state.selectedNodeId);
  const nodes = useEngineStore((state) => state.document.nodes);
  const document = useEngineStore((state) => state.document);

  const safeDispatch = ({type, payload}: {type: "INSERT_NODE", payload:  Omit<Extract<Command, {type: "INSERT_NODE"}>["payload"], "parentId">}) => {
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
      data:{

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

  return (
    <div className="p-2 border-b border-gray-300 mb-5 flex gap-2 flex-wrap items-center bg-white shadow-sm">
      <button
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
        onClick={handleAddSection}
      >
        Add Section
      </button>
      <button
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer"
        onClick={handleAddRow}
      >
        Add Row
      </button>
      <button
        className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors cursor-pointer"
        onClick={handleAddColumn}
      >
        Add Column
      </button>
      <button
        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors cursor-pointer"
        onClick={handleAddText}
      >
        Add Text
      </button>
      <button
        className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors cursor-pointer"
        onClick={handleAddButton}
      >
        Add Button
      </button>
      <button
        className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors cursor-pointer"
        onClick={handleAddImage}
      >
        Add Image
      </button>
      <button
        className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors cursor-pointer"
        onClick={handleExportHtml}
      >
        Export html
      </button>
      <div className="ml-auto text-sm font-medium text-gray-700">
        {selectedNodeId && nodes.get(selectedNodeId) ? (
          <span className="text-blue-600">
            Selected: {nodes.get(selectedNodeId)?.type} ({selectedNodeId})
          </span>
        ) : (
          <span className="text-gray-400">No Selection</span>
        )}
      </div>
    </div>
  );
};
