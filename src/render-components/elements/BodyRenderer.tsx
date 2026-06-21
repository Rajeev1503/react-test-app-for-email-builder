import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";
import { mapStylesToCss } from "../../utils/styleMapper";

export const BodyRenderer = ({ node, isPreviewMode }: { node: RenderNodeTypeData<"body">; isPreviewMode?: boolean })=>{
  return (
    <div
      className="min-h-full w-full"
      style={{
        backgroundColor: "#f3f4f6",
        padding: isPreviewMode ? "0px" : "16px",
        ...mapStylesToCss(node.data.styles, "body"),
      }}
    >
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} isPreviewMode={isPreviewMode} />
      ))}
    </div>
  );
};
