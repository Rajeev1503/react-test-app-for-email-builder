import { useEngineStore } from "@react-email-builder/react";
import { ElementRenderer } from "../ElementRenderer";

import { EMPTY_ARRAY } from "../../constants";

export const ContainerRenderer = ({ node }: { node: any }) => {
  const childrenIds = useEngineStore(
    (state) => state.document.children[node.id] || EMPTY_ARRAY
  );

  return (
    <div className="mx-auto bg-white p-2" style={{ ...node.styles }}>
      {childrenIds.map((childId) => (
        <ElementRenderer key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
