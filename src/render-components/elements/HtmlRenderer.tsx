import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";

export const HtmlRenderer = ({ node }: { node: RenderNodeTypeData<"html">}) => {
  return (
    <div className="w-full h-full" style={{ ...node.data.styles }}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
