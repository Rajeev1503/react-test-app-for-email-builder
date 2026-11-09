import { useEffect, useState } from "react";
import { AiButton, animateChange, useEngineStore, useExportHtml } from "@react-email-builder/react";
import { ClientPreview, InboxReport, exportErrorPrompt } from "@react-email-builder/react/inbox";
import { AiInboxScore } from "@react-email-builder/react/ai";
import { X } from "lucide-react";

/**
 * The real exported HTML beside the canvas, so any difference is easy to see, or
 * the email as Outlook and Gmail would show it, or its inbox score.
 */
export function ExportPane({ onClose }: { onClose?: () => void }) {
  const document = useEngineStore((s) => s.document);
  const exportHtml = useExportHtml();
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"export" | "clients" | "score">("export");

  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      exportHtml(document).then(
        (result) => {
          if (!current) return;
          setHtml(result);
          setError(null);
        },
        (reason: unknown) => {
          if (current) setError(reason instanceof Error ? reason.message : String(reason));
        },
      );
    }, 150);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [document, exportHtml]);

  return (
    <div className="h-full flex flex-col min-w-0 bg-panelbg" data-testid="export-pane">
      <div className="px-3 py-1.5 text-xs bg-headerbg border-b border-appborder text-apptext flex items-center gap-3">
        <div className="flex gap-3" role="tablist">
        {(["export", "clients", "score"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            data-testid={`export-view-${id}`}
            className={view === id ? "font-bold text-accent" : "text-apptext/70 hover:text-apptext"}
            onClick={() => animateChange(() => setView(id))}
          >
            {{ export: "Exported email", clients: "In email clients", score: "Inbox score" }[id]}
          </button>
        ))}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the preview"
            title="Back to the editor"
            className="ml-auto p-0.5 rounded cursor-pointer text-mutedtext hover:text-apptext hover:bg-panelbg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {view === "clients" ? (
        <div className="flex-1 min-h-0"><ClientPreview /></div>
      ) : view === "score" ? (
        <div className="flex-1 min-h-0"><InboxReport secondOpinion={<AiInboxScore />} /></div>
      ) : error ? (
        <div className="p-3 text-xs text-red-600 flex flex-col items-start gap-2 min-h-0" role="alert" data-testid="export-error">
          <p className="max-h-60 w-full overflow-auto break-words whitespace-pre-wrap">The email couldn't be exported: {error}</p>
          <AiButton request={{ kind: "task", title: "Fix the export error", prompt: exportErrorPrompt(error) }} />
        </div>
      ) : (
        // No allow-scripts: exported email must never need to run script here.
        <iframe title="Exported email" sandbox="allow-same-origin" srcDoc={html} data-testid="export-frame" className="flex-1 w-full bg-white" />
      )}
    </div>
  );
}
