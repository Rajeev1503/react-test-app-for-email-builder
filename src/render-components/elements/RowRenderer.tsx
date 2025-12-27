import { useEngineStore } from "@react-email-builder/react";
import { ElementRenderer } from "../ElementRenderer";

import { EMPTY_ARRAY } from "../../constants";

export const RowRenderer = ({ node }: { node: any }) => {
  const childrenIds = useEngineStore(
    (state) => state.document.children[node.id] || EMPTY_ARRAY
  );

  return (
    <div className="flex w-full" style={{ ...node.styles }}>
      {childrenIds.map((childId) => (
        <ElementRenderer key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
