import React from "react";
import { MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@basalt/ui";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import { DRAG_TRANSITION, type NoteHandlers } from "./types";
import { RenameInput } from "./RenameInput";

/** A draggable note row used inside folders / root. */
export const SortableNoteRow = React.memo(function SortableNoteRow({
  note,
  handlers,
}: {
  note: EditorNote;
  handlers: NoteHandlers;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: note.id, transition: DRAG_TRANSITION });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };
  return (
    <NoteRow
      note={note}
      handlers={handlers}
      setNodeRef={setNodeRef}
      style={style}
      dragProps={{ ...attributes, ...listeners }}
    />
  );
});

export const NoteRow = React.memo(function NoteRow({
  note,
  handlers,
  setNodeRef,
  style,
  dragProps,
}: {
  note: EditorNote;
  handlers: NoteHandlers;
  setNodeRef?: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
  dragProps?: React.HTMLAttributes<HTMLElement>;
}) {
  const { activeNoteId, editingId, onSelect, onDelete, onDuplicate, onEditStart, onEditEnd, onRename, onRenameValueChange } =
    handlers;

  if (note.id === editingId) {
    const submitRename = (value: string) => {
      const trimmed = value.trim();
      if (trimmed && trimmed !== note.name) onRename(note.id, trimmed);
      onEditEnd();
    };
    return (
      <SidebarMenuSubItem ref={setNodeRef} style={style}>
        <RenameInput
          initial={note.name}
          onSubmit={submitRename}
          onCancel={onEditEnd}
          onValueChange={onRenameValueChange}
        />
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarMenuSubItem ref={setNodeRef} style={style} className="group/note relative">
      <SidebarMenuSubButton
        asChild
        isActive={note.id === activeNoteId}
        className="pr-7 w-full drag:cursor-grabbing"
      >
        <button
          type="button"
          {...dragProps}
          onClick={() => onSelect(note.id)}
          onDoubleClick={() => onEditStart(note.id)}
        >
          <span className="truncate">{note.name}</span>
        </button>
      </SidebarMenuSubButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Note options"
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/70 opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 group-hover/note:opacity-100 data-[state=open]:opacity-100 [&>svg]:size-4"
          >
            <MoreHorizontal />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-44">
          <DropdownMenuItem onSelect={() => onEditStart(note.id)}>
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDuplicate(note.id)}>
            <Copy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onDelete(note.id)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuSubItem>
  );
});
