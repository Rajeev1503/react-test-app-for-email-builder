import { useEngineStore } from "@react-email-builder/react";
import { HtmlRenderer } from "./elements/HtmlRenderer";
import { BodyRenderer } from "./elements/BodyRenderer";
import { ContainerRenderer } from "./elements/ContainerRenderer";
import { SectionRenderer } from "./elements/SectionRenderer";
import { RowRenderer } from "./elements/RowRenderer";
import { ColumnRenderer } from "./elements/ColumnRenderer";
import { BlockRenderer } from "./elements/BlockRenderer";

export const ElementRenderer = ({ nodeId }: { nodeId: string }) => {
  const node = useEngineStore((state) => state.document.nodes[nodeId]);

  if (!node) return null;

  const selectedNodeId = useEngineStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useEngineStore((state) => state.setSelectedNodeId);

  const getRenderer = () => {
    switch (node.type) {
      case "html":
        return <HtmlRenderer node={node} />;
      case "body":
        return <BodyRenderer node={node} />;
      case "container":
        return <ContainerRenderer node={node} />;
      case "section":
        return <SectionRenderer node={node} />;
      case "row":
        return <RowRenderer node={node} />;
      case "column":
        return <ColumnRenderer node={node} />;
      case "block":
        return <BlockRenderer node={node} />;
      default:
        return <div>Unknown type: {node.type}</div>;
    }
  };

  const label =
    node.type === "block" ? `${node.type} (${node.blockType})` : node.type;
  const isSelected = selectedNodeId === nodeId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative min-h-5 cursor-pointer
        ${
          isSelected
            ? "border-2 border-blue-500 outline-1 outline-blue-500"
            : "border border-dashed border-gray-300"
        }
        ${["html", "body"].includes(node.type) ? "p-0" : "p-4"}
      `}
    >
      <div
        className={`
          absolute -top-6 px-1.5 py-0.5 text-[10px] rounded-br z-10
          ${isSelected ? "bg-blue-500 text-white" : "bg-gray-200 text-blue-800"}
          ${
            node.type === "html"
              ? "left-0"
              : node.type === "body"
              ? "left-10"
              : node.type === "container"
              ? "left-20"
              : "left-0"
          }
        `}
      >
        {label}
      </div>
      {getRenderer()}
    </div>
  );
};
