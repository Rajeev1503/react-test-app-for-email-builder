import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";
import { mapStylesToCss } from "../../utils/styleMapper";

export const ContainerRenderer = ({ node, isPreviewMode }: { node: RenderNodeTypeData<"container">; isPreviewMode?: boolean })=>{
  return (
    <div
      className="mx-auto"
      style={{
        backgroundColor: "#ffffff",
        padding: "8px",
        width: "100%",
        maxWidth: "600px",
        ...mapStylesToCss(node.data.styles, "container"),
      }}
    >
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} isPreviewMode={isPreviewMode} />
      ))}
    </div>
  );
};
