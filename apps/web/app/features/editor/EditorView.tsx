import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@basalt/ui";
import { EditorToolbar } from "./EditorToolbar";
import { useNoteDocument } from "./useNoteDocument";
import { AlertCircle } from "lucide-react";

export function EditorView({ id }: { id: string }) {
  const { doc, loadError, status, error, retry, reload } = useNoteDocument(id);

  const editor = useEditor(
    {
      immediatelyRender: true,
      extensions: [
        StarterKit.configure({
          history: false,
          heading: { levels: [1, 2, 3] },
          codeBlock: { HTMLAttributes: { spellcheck: "false" } },
        }),
        Collaboration.configure({ document: doc }),
        Placeholder.configure({
          placeholder:
            "Start writing… use Markdown: # heading, - bullet, 1. list, ``` code, **bold**, *italic*",
        }),
      ],
      editorProps: {
        attributes: {
          class:
            "prose prose-sm dark:prose-invert focus:outline-none flex-1 min-h-[60vh] max-w-none px-4 py-3",
        },
      },
    },
    [doc],
  );

  if (loadError) {
    return (
      <div className="border border-border rounded-lg p-6 space-y-3">
        <p className="text-red-600 dark:text-red-400">
          Couldn’t load this note: {loadError.message}
        </p>
        <p className="text-sm text-muted-foreground">
          The local database may be busy or out of date. Retry, or rebuild the
          database from the documents list.
        </p>
        <Button onClick={reload}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin">
        <div className="mx-auto flex w-full max-w-200 flex-1 flex-col">
          <EditorContent editor={editor} className="flex flex-1 flex-col" />
        </div>
      </div>
      <div className="relative shrink-0 border-t border-border px-4 h-16 flex items-center">
        {status === "error" && (
          <div className="absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-background px-3 py-2 text-sm text-destructive shadow-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="max-w-80 truncate">
                {error?.message ?? "Failed to save"}
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
