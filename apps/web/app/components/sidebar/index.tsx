import { useMemo, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuSub,
  useSidebar,
} from "@basalt/ui";
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  DRAG_TRANSITION,
  ROOT,
  type AppSidebarProps,
  type FolderHandlers,
  type NoteHandlers,
} from "./types";
import { useSidebarDnd } from "./useSidebarDnd";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { FolderSection } from "./FolderSection";
import { UncategorizedSection } from "./UncategorizedSection";
import { NoteRow } from "./NoteRow";
import { NoteRowOverlay, FolderRowOverlay } from "./DragOverlays";

export type { AppSidebarProps } from "./types";

/** Snappy drop settle; keeps the source row faded until it lands. */
const dropAnimation: DropAnimation = {
  duration: DRAG_TRANSITION.duration,
  easing: DRAG_TRANSITION.easing,
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

export function AppSidebar(props: AppSidebarProps) {
  const { notes, folders, onResizeStart } = props;
  const { state } = useSidebar();

  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const dnd = useSidebarDnd({
    notes,
    folders,
    onMoveNote: props.onMoveNote,
    onReorderFolders: props.onReorderFolders,
  });

  // Stable identity so memoized rows skip re-render during cross-folder drags.
  const noteHandlers: NoteHandlers = useMemo(
    () => ({
      activeNoteId: props.activeId,
      editingId: props.editingId,
      onSelect: props.onSelect,
      onDelete: props.onDelete,
      onDuplicate: props.onDuplicate,
      onEditStart: props.onEditStart,
      onEditEnd: props.onEditEnd,
      onRename: props.onRename,
    }),
    [
      props.activeId,
      props.editingId,
      props.onSelect,
      props.onDelete,
      props.onDuplicate,
      props.onEditStart,
      props.onEditEnd,
      props.onRename,
    ],
  );

  const folderHandlers: FolderHandlers = useMemo(
    () => ({
      editingFolderId: props.editingFolderId,
      onCreate: props.onCreate,
      onRenameFolder: props.onRenameFolder,
      onDeleteFolder: props.onDeleteFolder,
      onFolderEditStart: props.onFolderEditStart,
      onFolderEditEnd: props.onFolderEditEnd,
    }),
    [
      props.editingFolderId,
      props.onCreate,
      props.onRenameFolder,
      props.onDeleteFolder,
      props.onFolderEditStart,
      props.onFolderEditEnd,
    ],
  );

  const filteredNotes = useMemo(
    () => (q ? notes.filter((n) => n.name.toLowerCase().includes(q)) : notes),
    [notes, q],
  );

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border">
      <SidebarHeader
        isSearching={isSearching}
        query={query}
        onQueryChange={setQuery}
        onOpenSearch={() => setIsSearching(true)}
        onCloseSearch={() => {
          setIsSearching(false);
          setQuery("");
        }}
        onCreate={() => props.onCreate()}
        onCreateFolder={props.onCreateFolder}
      />

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          {q ? (
            // Search results: flat, no folders / drag-and-drop.
            <SidebarMenu>
              {filteredNotes.length === 0 ? (
                <p className="px-4 py-1.5 text-xs text-muted-foreground">
                  No matching notes
                </p>
              ) : (
                <SidebarMenuSub>
                  {filteredNotes.map((note) => (
                    <NoteRow key={note.id} note={note} handlers={noteHandlers} />
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenu>
          ) : (
            <DndContext
              sensors={dnd.sensors}
              collisionDetection={dnd.collisionDetection}
              {...dnd.dndHandlers}
            >
              <SidebarMenu>
                <SortableContext items={dnd.order} strategy={verticalListSortingStrategy}>
                  {dnd.order.map((fid) => {
                    const folder = dnd.folderById.get(fid);
                    if (!folder) return null;
                    return (
                      <FolderSection
                        key={fid}
                        folder={folder}
                        noteIds={dnd.items[fid] ?? []}
                        noteById={dnd.noteById}
                        noteHandlers={noteHandlers}
                        folderHandlers={folderHandlers}
                        isDragging={dnd.draggingId === fid}
                      />
                    );
                  })}
                </SortableContext>

                <UncategorizedSection
                  noteIds={dnd.items[ROOT] ?? []}
                  noteById={dnd.noteById}
                  handlers={noteHandlers}
                />
              </SidebarMenu>

              <DragOverlay dropAnimation={dropAnimation}>
                {dnd.draggedNote ? (
                  <NoteRowOverlay name={dnd.draggedNote.name} />
                ) : dnd.draggedFolder ? (
                  <FolderRowOverlay name={dnd.draggedFolder.name} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarUserMenu
        workspaces={props.workspaces}
        activeWorkspaceId={props.activeWorkspaceId}
        onWorkspaceSelect={props.onWorkspaceSelect}
        onCreateWorkspace={props.onCreateWorkspace}
        onJoinWorkspace={props.onJoinWorkspace}
        onDeleteWorkspace={props.onDeleteWorkspace}
        onUpdateWorkspaceUrl={props.onUpdateWorkspaceUrl}
      />

      {state === "expanded" && (
        <div
          onMouseDown={onResizeStart}
          title="Drag to resize"
          className="absolute inset-y-0 right-0 z-20 w-1.5 translate-x-1/2 cursor-col-resize transition-colors hover:bg-primary/40 active:bg-primary"
        />
      )}
    </Sidebar>
  );
}
