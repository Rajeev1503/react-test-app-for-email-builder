import type { RenderNodeTypeData } from "../../types";

export const BlockRenderer = ({ node }: { node: RenderNodeTypeData<"block">})=>{
  
  if (node.data?.blockType === "text") {
    return (
      <div
        className="w-full"
        style={{ ...node.data?.styles }}
        dangerouslySetInnerHTML={{ __html: node.data?.props.content }}
      />
    );
  }

  if (node.data.blockType === "button") {
    return (
      <div className="w-full" style={{ textAlign: node.data.styles?.align || "center" }}>
        <a
          href={node.data.props.href || "#"}
          className="inline-block no-underline px-5 py-2.5 rounded text-center"
          style={{ ...node.data.styles }}
        >
          {node.data.props.label || "Button"}
        </a>
      </div>
    );
  }

  if (node.data.blockType === "image") {
    return (
      <div className="w-full" style={{ textAlign: node.data?.styles?.align || "center" }}>
        <img
          {...node.data?.props}
          className="max-w-full h-auto inline-block"
          style={{ ...node.data?.styles }}
        />
      </div>
    );
  }
  // If no matching blockType is found, return null or a default message
  return null;
};
