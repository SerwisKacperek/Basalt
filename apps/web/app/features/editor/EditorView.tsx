import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import * as Y from "yjs";
import { useServices } from "~/services/ServiceContext";
import { EditorToolbar } from "./EditorToolbar";

const COMPACT_AFTER_UPDATES = 100;
const COMPACT_IDLE_MS = 30_000;

export function EditorView({ id }: { id: string }) {
  const { editorPersistence } = useServices();
  const [doc] = useState(() => new Y.Doc());
  const [ready, setReady] = useState(false);
  const updateCountRef = useRef(0);
  const compactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextLocalUpdate = useRef(false);

  useEffect(() => {
    let cancelled = false;
    editorPersistence.loadUpdates(id).then((updates) => {
      if (cancelled) return;
      skipNextLocalUpdate.current = true;
      Y.transact(
        doc,
        () => {
          for (const u of updates) Y.applyUpdate(doc, u);
        },
        "load",
      );
      skipNextLocalUpdate.current = false;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id, doc, editorPersistence]);

  useEffect(() => {
    const scheduleCompact = () => {
      if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
      compactTimerRef.current = setTimeout(() => {
        const merged = Y.encodeStateAsUpdate(doc);
        editorPersistence.compact(id, merged).catch(console.error);
        updateCountRef.current = 0;
      }, COMPACT_IDLE_MS);
    };

    const onUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === "load") return;
      editorPersistence.appendUpdate(id, update).catch(console.error);
      updateCountRef.current++;
      if (updateCountRef.current >= COMPACT_AFTER_UPDATES) {
        if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
        const merged = Y.encodeStateAsUpdate(doc);
        editorPersistence.compact(id, merged).catch(console.error);
        updateCountRef.current = 0;
      } else {
        scheduleCompact();
      }
    };

    doc.on("update", onUpdate);
    return () => {
      doc.off("update", onUpdate);
      if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
    };
  }, [id, doc, editorPersistence]);

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

  if (!ready || !editor) {
    return <div className="p-4 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
