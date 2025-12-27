import { useEngineStore } from "@react-email-builder/react";
import { ElementRenderer } from "../ElementRenderer";

import { EMPTY_ARRAY } from "../../constants";

export const ColumnRenderer = ({ node }: { node: any }) => {
  const childrenIds = useEngineStore(
    (state) => state.document.children[node.id] || EMPTY_ARRAY
  );

  return (
    <div className="flex-1" style={{ ...node.styles }}>
      {childrenIds.map((childId) => (
        <ElementRenderer key={childId} nodeId={childId} />
      ))}
    </div>
  );
};
