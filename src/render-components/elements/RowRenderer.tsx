import type { RenderNodeTypeData } from "../../types";
import { ElementRenderer } from "../ElementRenderer";

export const RowRenderer = ({ node }: { node: RenderNodeTypeData<"row">})=>{
  return (
    <div className="flex w-full" style={{ ...node.data?.styles }}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
