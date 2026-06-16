import React, { useState } from "react";
import {
  ChevronRight,
  Folder as FolderIcon,
  GripVertical,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@basalt/ui";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import type { Folder } from "~/pages/main";
import { DRAG_TRANSITION, type FolderHandlers, type NoteHandlers } from "./types";
import { NoteList } from "./NoteList";
import { RenameInput } from "./RenameInput";

/** A folder: sortable (reorder) + droppable (drop notes in), with its notes. */
export const FolderSection = React.memo(function FolderSection({
  folder,
  noteIds,
  noteById,
  noteHandlers,
  folderHandlers,
  isDragging,
}: {
  folder: Folder;
  noteIds: string[];
  noteById: Map<string, EditorNote>;
  noteHandlers: NoteHandlers;
  folderHandlers: FolderHandlers;
  isDragging: boolean;
}) {
  const [open, setOpen] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id: folder.id, transition: DRAG_TRANSITION });

  const {
    editingFolderId,
    onCreate,
    onRenameFolder,
    onDeleteFolder,
    onFolderEditStart,
    onFolderEditEnd,
  } = folderHandlers;
  const isEditing = folder.id === editingFolderId;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  const submitRename = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== folder.name) onRenameFolder(folder.id, trimmed);
    onFolderEditEnd();
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/folder" asChild>
      <SidebarMenuItem
        ref={setNodeRef}
        style={style}
        className={`group/folderrow relative rounded-md ${
          isOver ? "bg-sidebar-accent/40 ring-1 ring-primary/40" : ""
        }`}
      >
        {isEditing ? (
          <div className="px-2 py-1">
            <RenameInput
              initial={folder.name}
              onSubmit={submitRename}
              onCancel={onFolderEditEnd}
            />
          </div>
        ) : (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="pl-1 pr-7 font-medium">
                <span
                  ref={setActivatorNodeRef}
                  {...attributes}
                  {...listeners}
                  aria-label="Drag folder"
                  onClick={(e) => e.stopPropagation()}
                  className="flex size-5 shrink-0 cursor-grab items-center justify-center text-sidebar-foreground/40 opacity-0 transition-opacity hover:text-sidebar-foreground group-hover/folderrow:opacity-100 active:cursor-grabbing [&>svg]:size-3.5"
                >
                  <GripVertical />
                </span>
                <FolderIcon />
                <span className="truncate">{folder.name}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/folder:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Folder options"
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute right-1 top-1.5 flex size-5 items-center justify-center rounded-md text-sidebar-foreground/70 opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 group-hover/folderrow:opacity-100 data-[state=open]:opacity-100 [&>svg]:size-4"
                >
                  <MoreHorizontal />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-44">
                <DropdownMenuItem onSelect={() => onCreate(folder.id)}>
                  <Plus />
                  New note
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onFolderEditStart(folder.id)}>
                  <Pencil />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onDeleteFolder(folder.id)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        <CollapsibleContent>
          <NoteList
            noteIds={noteIds}
            noteById={noteById}
            handlers={noteHandlers}
            emptyLabel="Drop notes here"
          />
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
});
