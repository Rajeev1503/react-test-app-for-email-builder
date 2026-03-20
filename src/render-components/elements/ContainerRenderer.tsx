import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";

export const ContainerRenderer = ({ node }: { node: RenderNodeTypeData<"container">})=>{
  return (
    <div className="mx-auto bg-white p-2" style={{ ...node.data.styles }}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
