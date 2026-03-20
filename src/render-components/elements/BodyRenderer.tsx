import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";

export const BodyRenderer = ({ node }: { node: RenderNodeTypeData<"body">})=>{
  return (
    <div className="min-h-full" style={{ ...node.data.styles }}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
