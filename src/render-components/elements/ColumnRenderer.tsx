import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";
import { mapStylesToCss } from "../../utils/styleMapper";

export const ColumnRenderer = ({ node, isPreviewMode }: { node: RenderNodeTypeData<"column">; isPreviewMode?: boolean })=>{
  return (
    <div className="flex-1" style={mapStylesToCss(node.data?.styles, "column")}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} isPreviewMode={isPreviewMode} />
      ))}
    </div>
  );
};
