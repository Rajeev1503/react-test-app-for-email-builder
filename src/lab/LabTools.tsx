import { useEffect, useState } from "react";
import { useEngineStore, useExportHtml } from "@react-email-builder/react";
import { ClientPreview, InboxReport } from "@react-email-builder/react/inbox";

/**
 * The real exported HTML beside the canvas, so any difference is easy to see, or
 * the email as Outlook and Gmail would show it, or its inbox score.
 */
export function ExportPane() {
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
    <div className="h-full flex flex-col border-l border-appborder min-w-0" data-testid="export-pane">
      <div className="px-3 py-1.5 text-xs bg-headerbg border-b border-appborder text-apptext flex gap-3" role="tablist">
        {(["export", "clients", "score"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            data-testid={`export-view-${id}`}
            className={view === id ? "font-bold text-accent" : "text-apptext/70 hover:text-apptext"}
            onClick={() => setView(id)}
          >
            {{ export: "Exported email", clients: "In email clients", score: "Inbox score" }[id]}
          </button>
        ))}
      </div>
      {view === "clients" ? (
        <div className="flex-1 min-h-0"><ClientPreview /></div>
      ) : view === "score" ? (
        <div className="flex-1 min-h-0"><InboxReport /></div>
      ) : error ? (
        <p className="p-3 text-xs text-red-600" role="alert" data-testid="export-error">{error}</p>
      ) : (
        // No allow-scripts: exported email must never need to run script here.
        <iframe title="Exported email" sandbox="allow-same-origin" srcDoc={html} data-testid="export-frame" className="flex-1 w-full bg-white" />
      )}
    </div>
  );
}
