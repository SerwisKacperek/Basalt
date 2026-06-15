import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Loader2,
  Sparkles,
  ScanText,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { useServices } from "~/services/ServiceContext";

type ToolbarButton = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  isActive: (e: Editor) => boolean;
  run: (e: Editor) => void;
};

const GROUPS: ToolbarButton[][] = [
  [
    {
      icon: Heading1,
      label: "Heading 1",
      isActive: (e) => e.isActive("heading", { level: 1 }),
      run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      isActive: (e) => e.isActive("heading", { level: 2 }),
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      isActive: (e) => e.isActive("heading", { level: 3 }),
      run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    },
  ],
  [
    {
      icon: Bold,
      label: "Bold",
      isActive: (e) => e.isActive("bold"),
      run: (e) => e.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Italic",
      isActive: (e) => e.isActive("italic"),
      run: (e) => e.chain().focus().toggleItalic().run(),
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      isActive: (e) => e.isActive("strike"),
      run: (e) => e.chain().focus().toggleStrike().run(),
    },
    {
      icon: Code,
      label: "Inline code",
      isActive: (e) => e.isActive("code"),
      run: (e) => e.chain().focus().toggleCode().run(),
    },
  ],
  [
    {
      icon: List,
      label: "Bullet list",
      isActive: (e) => e.isActive("bulletList"),
      run: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Ordered list",
      isActive: (e) => e.isActive("orderedList"),
      run: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      label: "Blockquote",
      isActive: (e) => e.isActive("blockquote"),
      run: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      icon: Code2,
      label: "Code block",
      isActive: (e) => e.isActive("codeBlock"),
      run: (e) => e.chain().focus().toggleCodeBlock().run(),
    },
  ],
];

export function EditorToolbar({ editor }: { editor: Editor }) {
  const { ollama } = useServices();
  const [activeAiAction, setActiveAiAction] = useState<
    "formatting" | "summarizing" | null
  >(null);
  const [aiError, setAiError] = useState<string | null>(null);
  // Subscribe to selection/content changes so active states stay in sync.
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      states: GROUPS.flat().map((b) => b.isActive(e)),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  let buttonIndex = 0;

  const runAiAction = async (
    action: (content: string) => Promise<string>,
    actionName: "formatting" | "summarizing",
    fallbackError: string,
  ) => {
    setActiveAiAction(actionName);
    setAiError(null);
    const original = editor.getHTML();
    try {
      const result = await action(original);
      if (editor.getHTML() !== original) {
        throw new Error(
          "Notatka zmieniła się podczas pracy Ollamy. Wynik nie został zastosowany.",
        );
      }
      editor.commands.setContent(result);
      editor.commands.focus("end");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : fallbackError);
    } finally {
      setActiveAiAction(null);
    }
  };

  const formatNote = () =>
    runAiAction(
      (content) => ollama.formatNote(content),
      "formatting",
      "Nie udało się sformatować notatki.",
    );

  const summarizeNote = () =>
    runAiAction(
      (content) => ollama.summarizeNote(content),
      "summarizing",
      "Nie udało się streścić notatki.",
    );

  return (
    <div className="sticky bottom-5 mx-auto z-10 w-full max-w-200 flex flex-wrap items-center gap-1 border border-border bg-sidebar rounded-lg px-2 py-1.5">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <span className="mx-1 h-5 w-px bg-border" aria-hidden />}
          {group.map((btn) => {
            const active = editorState.states[buttonIndex++];
            const Icon = btn.icon;
            return (
              <button
                key={btn.label}
                type="button"
                title={btn.label}
                aria-label={btn.label}
                aria-pressed={active}
                onClick={() => btn.run(editor)}
                className={
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-sidebar " +
                  (active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80")
                }
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      ))}

      <div className="ml-auto flex items-center gap-0.5">
        {aiError && (
          <span
            role="alert"
            title={aiError}
            className="max-w-64 truncate px-2 text-xs text-destructive"
          >
            {aiError}
          </span>
        )}
        <button
          type="button"
          title="Popraw i sformatuj notatkę z Ollamą"
          aria-label="Popraw i sformatuj notatkę z Ollamą"
          disabled={activeAiAction !== null || editor.isEmpty}
          onClick={formatNote}
          className="flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent"
        >
          {activeAiAction === "formatting" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {activeAiAction === "formatting"
              ? "Formatowanie..."
              : "Formatuj AI"}
          </span>
        </button>
        <button
          type="button"
          title="Streść notatkę z Ollamą"
          aria-label="Streść notatkę z Ollamą"
          disabled={activeAiAction !== null || editor.isEmpty}
          onClick={summarizeNote}
          className="flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent"
        >
          {activeAiAction === "summarizing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanText className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {activeAiAction === "summarizing"
              ? "Streszczanie..."
              : "Streść AI"}
          </span>
        </button>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          disabled={!editorState.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-sidebar disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          disabled={!editorState.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-sidebar disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
