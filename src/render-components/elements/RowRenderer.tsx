import type { RenderNodeTypeData } from "../../types";
import { ElementRenderer } from "../ElementRenderer";
import { mapStylesToCss } from "../../utils/styleMapper";

export const RowRenderer = ({ node, isPreviewMode }: { node: RenderNodeTypeData<"row">; isPreviewMode?: boolean })=>{
  return (
    <div className="flex w-full" style={mapStylesToCss(node.data?.styles, "row")}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} isPreviewMode={isPreviewMode} />
      ))}
    </div>
  );
};
