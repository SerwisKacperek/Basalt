import { AlertCircle, Check, Cloud, CloudOff, HardDrive, Loader2, WifiOff } from "lucide-react";
import { Button } from "@basalt/ui";
import type { LocalSaveStatus, RemoteSyncStatus } from "./useNoteDocument";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function EditorStatusBar({
  localSaveStatus,
  remoteSyncStatus,
  lastLocalSavedAt,
  lastSyncedAt,
  upstreamSynced,
  hasPendingLocal,
  saveError,
  onRetry,
}: {
  localSaveStatus: LocalSaveStatus;
  remoteSyncStatus: RemoteSyncStatus;
  lastLocalSavedAt: number | null;
  lastSyncedAt: number | null;
  upstreamSynced: boolean;
  hasPendingLocal: boolean;
  saveError: Error | null;
  onRetry: () => void;
}) {
  const isSaving = localSaveStatus === "saving";
  const isError = localSaveStatus === "error";
  const hasSaved =
    localSaveStatus === "locally_saved" ||
    (localSaveStatus === "idle" && lastLocalSavedAt !== null);

  if (!isSaving && !isError && !hasSaved) return null;

  let chipLabel: string;
  let chipClass: string;

  if (isSaving) {
    chipLabel = "Saving…";
    chipClass =
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
  } else if (isError) {
    chipLabel = "Save failed";
    chipClass =
      "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/60 dark:text-red-300";
  } else {
    chipLabel = "Saved";
    chipClass =
      "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/60 dark:text-green-300";
  }

  return (
    <div className="flex items-center justify-end px-4 py-1.5">
      <div className="group relative">
        {/* Chip */}
        <div
          className={`flex min-w-[6.5rem] cursor-default items-center justify-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors delay-75 duration-500 ease-in-out ${chipClass}`}
        >
          {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
          {isError && <AlertCircle className="h-3 w-3" />}
          {hasSaved && <Check className="h-3 w-3" />}
          {chipLabel}
        </div>

        {/* Hover tooltip */}
        <div className="absolute right-0 top-full z-50 mt-1.5 hidden w-56 rounded-md border border-border bg-white p-2.5 shadow-lg group-hover:block dark:bg-slate-900">
          {/* Local */}
          <div className="flex items-start gap-2">
            <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">Local</p>
              <div
                className={`mt-0.5 flex items-center gap-1 text-xs ${
                  isError ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                }`}
              >
                {isSaving && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                {isError && <AlertCircle className="h-3 w-3 shrink-0" />}
                {hasSaved && (
                  <Check className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                )}
                <span className="break-words">
                  {isSaving && "Saving…"}
                  {isError && (saveError?.message ?? "Failed to save")}
                  {hasSaved &&
                    (lastLocalSavedAt
                      ? `Saved at ${formatTime(lastLocalSavedAt)}`
                      : "Saved")}
                </span>
              </div>
              {isError && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="mt-1.5 h-5 px-1.5 text-xs"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>

          <div className="my-2 border-t border-border" />

          {/* Remote */}
          <div className="flex items-start gap-2">
            <Cloud className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Remote</p>
              {remoteSyncStatus === "no-backend" ? (
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <WifiOff className="h-3 w-3 shrink-0" />
                  <span>Offline</span>
                </div>
              ) : remoteSyncStatus === "connecting" ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  <span>Connecting…</span>
                </div>
              ) : remoteSyncStatus === "error" ? (
                <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <CloudOff className="h-3 w-3 shrink-0" />
                  <span>Connection error</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Upstream: server → us */}
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      upstreamSynced
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {upstreamSynced ? (
                      <Check className="h-3 w-3 shrink-0" />
                    ) : (
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    )}
                    <span>↓ {upstreamSynced ? "Upstream synced" : "Fetching upstream…"}</span>
                  </div>
                  {/* Outgoing: us → server */}
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      hasPendingLocal
                        ? "text-amber-600 dark:text-amber-400"
                        : lastSyncedAt !== null
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {hasPendingLocal ? (
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    ) : (
                      <Check className="h-3 w-3 shrink-0" />
                    )}
                    <span>
                      ↑{" "}
                      {hasPendingLocal
                        ? "Syncing changes…"
                        : lastSyncedAt !== null
                          ? `Synced at ${formatTime(lastSyncedAt)}`
                          : "No local changes"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
