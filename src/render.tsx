import { useEngineStore } from "@react-email-builder/react";
import { ElementRenderer } from "./render-components/ElementRenderer";

export default function TestEmailBuilder({ isPreviewMode }: { isPreviewMode: boolean }) {
  const rootId = useEngineStore(s=>s.document.rootId);

  if (!rootId) return <div>Loading...</div>;
  return (
    <div className="w-full flex justify-center">
      <div className={isPreviewMode ? "w-full max-w-[600px] bg-white shadow-md my-4" : "py-4 w-full"}>
        <ElementRenderer nodeId={rootId} isPreviewMode={isPreviewMode} />
      </div>
    </div>
  );
}
