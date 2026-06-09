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
} from "lucide-react";
import type { ComponentType } from "react";

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

  return (
    <div className="sticky bottom-5 mx-auto z-10 w-full max-w-[800px] flex flex-wrap items-center gap-1 border border-border bg-sidebar rounded-lg px-2 py-1.5">
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
