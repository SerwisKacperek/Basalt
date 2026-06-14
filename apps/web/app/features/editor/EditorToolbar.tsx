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
} from "lucide-react";
import { Fragment, useState, type ComponentType } from "react";
import { useServices } from "~/services/ServiceContext";
import {
  Button,
  Separator,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from "@basalt/ui";

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
  const [isFormatting, setIsFormatting] = useState(false);
  // Subscribe to selection/content changes so active states stay in sync.
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      states: GROUPS.flat().map((b) => b.isActive(e)),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const formatNote = async () => {
    setIsFormatting(true);
    const original = editor.getHTML();
    try {
      const formatted = await ollama.formatNote(original);
      if (editor.getHTML() !== original) {
        throw new Error(
          "The note changed while formatting. The result was not applied.",
        );
      }
      editor.commands.setContent(formatted);
      editor.commands.focus("end");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't format the note.",
      );
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="sticky bottom-5 mx-auto z-10 flex w-full max-w-200 flex-nowrap items-center gap-1 overflow-x-auto scrollbar-thin rounded-lg border border-border bg-sidebar px-2 py-1.5">
        {GROUPS.map((group, gi) => {
          const offset = GROUPS.slice(0, gi).reduce((n, g) => n + g.length, 0);
          return (
            <Fragment key={gi}>
              {gi > 0 && (
                <Separator
                  orientation="vertical"
                  className="mx-1 h-5 shrink-0"
                />
              )}
              <div
                className="flex shrink-0 items-center gap-0.5"
                aria-label={`Formatting group ${gi + 1}`}
              >
                {group.map((btn, i) => {
                  const Icon = btn.icon;
                  return (
                    <Tooltip key={btn.label}>
                      <TooltipTrigger asChild>
                        <Toggle
                          size="sm"
                          pressed={editorState.states[offset + i]}
                          onPressedChange={() => btn.run(editor)}
                          aria-label={btn.label}
                          className="size-8 shrink-0 text-foreground/80 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary aria-pressed:hover:text-primary-foreground"
                        >
                          <Icon className="h-4 w-4" />
                        </Toggle>
                      </TooltipTrigger>
                      <TooltipContent>{btn.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </Fragment>
          );
        })}

        <div className="ml-auto flex shrink-0 items-center gap-0.5 pl-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Clean up & format note with AI"
                disabled={isFormatting || editor.isEmpty}
                onClick={formatNote}
                className="h-8 gap-1.5 px-2 text-foreground/80 hover:bg-primary/10 hover:text-primary"
              >
                {isFormatting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isFormatting ? "Formatting…" : "Format with AI"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clean up &amp; format note with AI</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-5 shrink-0" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Undo"
                className="size-8 text-foreground/80"
                disabled={!editorState.canUndo}
                onClick={() => editor.chain().focus().undo().run()}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Redo"
                className="size-8 text-foreground/80"
                disabled={!editorState.canRedo}
                onClick={() => editor.chain().focus().redo().run()}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
