import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";
import type { NodeId } from "../../../../react-email-builder/packages/core/dist";
import { useEngineStore } from "@react-email-builder/react";

export const SectionRenderer  = ({nodeId}: {nodeId: NodeId})=>{
    const node = useEngineStore((state) => state.document.nodes.get(nodeId)) as RenderNodeTypeData<"section">;
  return (
    <div style={{ ...node.data.styles }}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
