import { useEffect, useLayoutEffect, useRef } from "react";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapImage from "@tiptap/extension-image";
import { Button } from "@basalt/ui";
import { useAuth } from "~/hooks/useAuth";
import { EditorToolbar } from "./EditorToolbar";
import { EditorStatusBar } from "./EditorStatusBar";
import { useNoteDocument } from "./useNoteDocument";
import { useFileService } from "./useFileService";
import { ImageNodeView } from "./ImageNodeView";
import type { IFileService } from "@basalt/core/interfaces/IFileService";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "image/svg+xml", "image/bmp", "image/avif",
]);

const CURSOR_COLORS = [
  '#e11d48', '#ea580c', '#16a34a', '#0891b2',
  '#2563eb', '#7c3aed', '#c026d3', '#0d9488',
  '#b45309', '#dc2626',
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

async function uploadImageFiles(
  files: File[],
  fileService: IFileService,
  insertFn: (url: string) => void,
): Promise<void> {
  for (const file of files) {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) continue;
    if (file.size > MAX_IMAGE_SIZE) {
      alert(`Image "${file.name}" exceeds 10 MB limit.`);
      continue;
    }
    try {
      const buffer = await file.arrayBuffer();
      const url = await fileService.storeFile(buffer, file.type, file.name);
      insertFn(url);
    } catch (err) {
      console.error("Image upload failed", err);
    }
  }
}

const ImageExtension = TiptapImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
}).configure({ allowBase64: false, inline: true });

export function EditorView({ id }: { id: string }) {
  const { user } = useAuth();
  const {
    doc, awareness, ready, loadError,
    localSaveStatus, remoteSyncStatus,
    lastLocalSavedAt, lastSyncedAt,
    upstreamSynced, hasPendingLocal,
    saveError, retry, reload,
  } = useNoteDocument(id);

  const fileService = useFileService(id);
  const fileServiceRef = useRef<IFileService>(fileService);
  useEffect(() => { fileServiceRef.current = fileService; }, [fileService]);

  const displayName = user?.email ? emailToName(user.email) : 'Guest';
  const displayColor = hashColor(user?.email ?? `${awareness.clientID}`);

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
        ImageExtension,
      ],
      editorProps: {
        attributes: {
          class:
            "prose prose-sm dark:prose-invert focus:outline-none min-h-[60vh] max-w-none px-4 py-3",
        },
        handlePaste(view, event) {
          const items = Array.from(event.clipboardData?.items ?? []);
          const imageFiles = items
            .filter((i) => i.kind === "file" && i.type.startsWith("image/"))
            .map((i) => i.getAsFile())
            .filter((f): f is File => f !== null);
          if (imageFiles.length === 0) return false;
          event.preventDefault();
          void uploadImageFiles(imageFiles, fileServiceRef.current, (url) => {
            const imageNode = view.state.schema.nodes.image?.create({ src: url });
            if (imageNode) {
              view.dispatch(view.state.tr.replaceSelectionWith(imageNode));
            }
          });
          return true;
        },
        handleDrop(view, event) {
          const files = Array.from(event.dataTransfer?.files ?? []);
          const imageFiles = files.filter((f) => f.type.startsWith("image/"));
          if (imageFiles.length === 0) return false;
          event.preventDefault();
          const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          void uploadImageFiles(imageFiles, fileServiceRef.current, (url) => {
            const imageNode = view.state.schema.nodes.image?.create({ src: url });
            if (imageNode) {
              const insertAt = dropPos?.pos ?? view.state.selection.from;
              view.dispatch(view.state.tr.insert(insertAt, imageNode));
            }
          });
          return true;
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
        {saveError && (
          <div className="absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-background px-3 py-2 text-sm text-destructive shadow-lg">
              <span className="max-w-80 truncate">
                {saveError.message ?? "Failed to save"}
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
