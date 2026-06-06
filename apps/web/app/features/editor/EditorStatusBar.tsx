import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@basalt/ui";
import type { SaveStatus } from "./useNoteDocument";

export function EditorStatusBar({
  status,
  error,
  onRetry,
}: {
  status: SaveStatus;
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-1.5 text-xs text-muted-foreground">
      {status === "saving" && (
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </span>
      )}
      {status === "saved" && (
        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <Check className="h-3.5 w-3.5" />
          Saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          {error?.message ?? "Failed to save"}
          <Button size="sm" variant="outline" onClick={onRetry} className="h-6 px-2">
            Retry
          </Button>
        </span>
      )}
    </div>
  );
}
