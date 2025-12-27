import { useEditorState } from "@react-email-builder/react";
import { ElementRenderer } from "./render-components/ElementRenderer";

export default function TestEmailBuilder() {
  const { rootId, children } = useEditorState();

  if (!rootId) return <div>Loading...</div>;
  console.log(children);
  return (
    <div className="py-4">
      <ElementRenderer nodeId={rootId} />
    </div>
  );
}
