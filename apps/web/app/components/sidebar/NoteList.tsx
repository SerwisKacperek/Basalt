import { SidebarMenuSub } from "@basalt/ui";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import type { NoteHandlers } from "./types";
import { SortableNoteRow } from "./NoteRow";

/** A sortable list of notes within one container (folder or root). */
export function NoteList({
  noteIds,
  noteById,
  handlers,
  emptyLabel,
  subClassName,
}: {
  noteIds: string[];
  noteById: Map<string, EditorNote>;
  handlers: NoteHandlers;
  emptyLabel?: string;
  subClassName?: string;
}) {
  if (noteIds.length === 0) {
    return emptyLabel ? (
      <p className="px-4 py-1.5 text-xs text-muted-foreground">{emptyLabel}</p>
    ) : null;
  }
  return (
    <SidebarMenuSub className={subClassName ?? "min-h-[8px]"}>
      <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
        {noteIds.map((id) => {
          const note = noteById.get(id);
          if (!note) return null;
          return <SortableNoteRow key={id} note={note} handlers={handlers} />;
        })}
      </SortableContext>
    </SidebarMenuSub>
  );
}
