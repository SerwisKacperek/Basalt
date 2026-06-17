import { useLayoutEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@basalt/ui";
import { useAuth } from "~/hooks/useAuth";
import { EditorToolbar } from "./EditorToolbar";
import { EditorStatusBar } from "./EditorStatusBar";
import { useNoteDocument } from "./useNoteDocument";
import {BotMessageSquare} from "lucide-react";

// Theme-compatible saturated colors — readable as chip backgrounds with white text
// in both light and dark modes.
const CURSOR_COLORS = [
  '#e11d48', // rose
  '#ea580c', // orange
  '#16a34a', // green
  '#0891b2', // cyan
  '#2563eb', // blue
  '#7c3aed', // violet
  '#c026d3', // fuchsia
  '#0d9488', // teal
  '#b45309', // amber
  '#dc2626', // red
];

function emailToName(email: string): string {
  return email.split("@")[0] ?? email;
}

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length]!;
}

export function EditorView({ id }: { id: string }) {
  const { user } = useAuth();
  const {
    doc, awareness, ready, loadError,
    localSaveStatus, remoteSyncStatus,
    lastLocalSavedAt, lastSyncedAt,
    upstreamSynced, hasPendingLocal,
    saveError, retry, reload,
  } = useNoteDocument(id);

  const displayName = user?.email ? emailToName(user.email) : 'Guest';
  const displayColor = hashColor(user?.email ?? `${awareness.clientID}`);

  // Override TipTap's null user (set during plugin init) with real identity.
  // useLayoutEffect runs after render but before paint, so it always wins over
  // TipTap's setLocalStateField call in addProseMirrorPlugins.
  useLayoutEffect(() => {
    awareness.setLocalStateField('user', { name: displayName, color: displayColor });
  }, [awareness, displayName, displayColor]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false,
          heading: { levels: [1, 2, 3] },
          codeBlock: { HTMLAttributes: { spellcheck: "false" } },
        }),
        Collaboration.configure({ document: doc }),
        CollaborationCursor.configure({
          provider: { awareness },
          user: { name: displayName, color: displayColor },
          render(user: { name?: string; color?: string }) {
            const caret = document.createElement("span");
            caret.classList.add("collab-cursor-caret");
            caret.style.borderColor = user.color ?? CURSOR_COLORS[0]!;

            const label = document.createElement("span");
            label.classList.add("collab-cursor-label");
            label.style.backgroundColor = user.color ?? CURSOR_COLORS[0]!;
            label.textContent = user.name || "…";

            caret.appendChild(label);
            return caret;
          },
        }),
        Placeholder.configure({
          placeholder:
            "Start writing… use Markdown: # heading, - bullet, 1. list, ``` code, **bold**, *italic*",
        }),
      ],
      editorProps: {
        attributes: {
          class:
            "prose prose-sm dark:prose-invert focus:outline-none min-h-[60vh] max-w-none px-4 py-3",
        },
      },
    },
    [doc, awareness],
  );

  if (loadError) {
    return (
      <div className="border border-border rounded-lg p-6 space-y-3">
        <p className="text-red-600 dark:text-red-400">
          Couldn't load this note: {loadError.message}
        </p>
        <p className="text-sm text-muted-foreground">
          The local database may be busy or out of date. Retry, or rebuild the
          database from the documents list.
        </p>
        <Button onClick={reload}>Retry</Button>
      </div>
    );
  }

  if (!ready || !editor) {
    return <div className="p-4 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <EditorStatusBar
        localSaveStatus={localSaveStatus}
        remoteSyncStatus={remoteSyncStatus}
        lastLocalSavedAt={lastLocalSavedAt}
        lastSyncedAt={lastSyncedAt}
        upstreamSynced={upstreamSynced}
        hasPendingLocal={hasPendingLocal}
        saveError={saveError}
        onRetry={retry}
      />
      <div className="flex-1 min-h-0 overflow-auto pb-24 scrollbar-none">
        <EditorContent editor={editor} className="h-full" />
      </div>
      <div className="relative shrink-0 border-t border-border px-4 h-16 flex items-center">
        {status === "error" && (
          <div className="absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-background px-3 py-2 text-sm text-destructive shadow-lg">
              <span className="max-w-80 truncate">
                {saveError?.message ?? "Failed to save"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={retry}
                className="h-6 px-2"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
        <div className="mx-auto w-full max-w-200">
          {editor && <EditorToolbar editor={editor} />}
        </div>
      </div>
    </div>
  );
}
