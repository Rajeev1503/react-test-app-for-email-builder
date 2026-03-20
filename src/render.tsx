import { useEditorState, useEngineStore } from "@react-email-builder/react";
import { ElementRenderer } from "./render-components/ElementRenderer";

export default function TestEmailBuilder() {
  const rootId = useEngineStore(s=>s.document.rootId);

  if (!rootId) return <div>Loading...</div>;
  return (
    <div className="py-4">
      <ElementRenderer nodeId={rootId} />
    </div>
  );
}
