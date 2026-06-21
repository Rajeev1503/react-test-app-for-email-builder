import { ElementRenderer } from "../ElementRenderer";
import type { RenderNodeTypeData } from "../../types";
import type { NodeId } from "../../../../react-email-builder/packages/core/dist";
import { useEngineStore } from "@react-email-builder/react";
import { mapStylesToCss } from "../../utils/styleMapper";

export const SectionRenderer  = ({nodeId, isPreviewMode}: {nodeId: NodeId; isPreviewMode?: boolean})=>{
    const node = useEngineStore((state) => state.document.nodes.get(nodeId)) as RenderNodeTypeData<"section">;
  return (
    <div style={{ width: "100%", ...mapStylesToCss(node.data.styles, "section") }}>
      {node?.children.map((childId:string) => (
        <ElementRenderer key={childId} nodeId={childId} isPreviewMode={isPreviewMode} />
      ))}
    </div>
  );
};
