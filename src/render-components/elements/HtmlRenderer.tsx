import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";
import { mapStylesToCss } from "../../utils/styleMapper";

export const HtmlRenderer = ({ node, isPreviewMode }: { node: RenderNodeTypeData<"html">; isPreviewMode?: boolean }) => {
  return (
    <div className="w-full h-full" style={mapStylesToCss(node.data.styles, "html")}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} isPreviewMode={isPreviewMode} />
      ))}
    </div>
  );
};
