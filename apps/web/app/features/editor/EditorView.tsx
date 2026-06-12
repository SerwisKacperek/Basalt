import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@basalt/ui";
import { EditorToolbar } from "./EditorToolbar";
import { EditorStatusBar } from "./EditorStatusBar";
import { useNoteDocument } from "./useNoteDocument";
import {BotMessageSquare} from "lucide-react";

export function EditorView({ id }: { id: string }) {
  const { doc, ready, loadError, status, error, retry, reload } =
    useNoteDocument(id);

  const editor = useEditor(
    {
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
            "prose prose-sm dark:prose-invert focus:outline-none min-h-[60vh] max-w-none px-4 py-3",
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

  if (!ready || !editor) {
    return <div className="p-4 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <EditorStatusBar status={status} error={error} onRetry={retry} />
      <div className="flex-1 min-h-0 overflow-auto pb-24 scrollbar-none">
        <EditorContent editor={editor} className="h-full" />
      </div>
      <div className="flex flex-row gap-4 items-center p-4">
        <EditorToolbar editor={editor}/>
        <BotMessageSquare size={50} className=" mr-8 border border-border rounded-full p-2"/>
      </div>
    </div>
  );
}
