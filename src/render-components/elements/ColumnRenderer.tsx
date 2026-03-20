import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";

export const ColumnRenderer = ({ node }: { node: RenderNodeTypeData<"column">})=>{
  return (
    <div className="flex-1" style={{ ...node.data?.styles }}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
