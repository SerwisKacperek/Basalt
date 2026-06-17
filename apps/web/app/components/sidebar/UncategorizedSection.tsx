import { SidebarMenuItem } from "@basalt/ui";
import { useDroppable } from "@dnd-kit/core";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import { ROOT, type NoteHandlers } from "./types";
import { NoteList } from "./NoteList";

/**
 * Uncategorized notes (no folder) shown directly below the folders, at the
 * same level — no "Private" header. Still a drop target so notes can be pulled
 * out of folders.
 */
export function UncategorizedSection({
  noteIds,
  noteById,
  handlers,
}: {
  noteIds: string[];
  noteById: Map<string, EditorNote>;
  handlers: NoteHandlers;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: ROOT });
  return (
    <SidebarMenuItem>
      <div
        ref={setNodeRef}
        className={`mt-1 min-h-[34px] rounded-md ${
          isOver ? "bg-sidebar-accent/40 ring-1 ring-primary/40" : ""
        }`}
      >
        <NoteList
          noteIds={noteIds}
          noteById={noteById}
          handlers={handlers}
          subClassName="mx-1 border-l-0 px-0"
        />
      </div>
    </SidebarMenuItem>
  );
}
