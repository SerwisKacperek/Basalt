import type React from "react";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import type { Folder, Workspace } from "~/pages/main";

/** Special container id for notes that don't belong to any folder. */
export const ROOT = "__root__";

/**
 * Shared drag motion: quick reflow / drop settle with a snappy easing so
 * dragging feels responsive rather than floaty. Used for `useSortable`
 * transitions and the `DragOverlay` drop animation.
 */
export const DRAG_TRANSITION = {
  duration: 150,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

export type FolderTarget = string | null;

/** Ordered note ids keyed by container id (folder id or {@link ROOT}). */
export type Items = Record<string, string[]>;

export interface AppSidebarProps {
  notes: EditorNote[];
  folders: Folder[];
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeId: string | null;
  editingId: string | null;
  editingFolderId: string | null;
  onSelect: (id: string) => void;
  onCreate: (folderId?: string | null) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEditStart: (id: string) => void;
  onEditEnd: () => void;
  onRename: (id: string, name: string) => void;
  onRenameValueChange?: (value: string) => void;
  onCreateFolder: () => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onFolderEditStart: (id: string) => void;
  onFolderEditEnd: () => void;
  onMoveNote: (noteId: string, targetFolderId: FolderTarget, index: number) => void;
  onReorderFolders: (orderedIds: string[]) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onWorkspaceSelect: (id: string) => void;
  onCreateWorkspace: (name: string, type: "local" | "remote", url?: string) => Promise<void>;
  onJoinWorkspace: (ws: { id: string; name: string; url: string }) => Promise<void>;
  onDeleteWorkspace: (id: string) => Promise<void>;
  onUpdateWorkspaceUrl: (id: string, url: string) => Promise<void>;
}

/** Shared note-row callbacks, bundled to avoid prop drilling. */
export interface NoteHandlers {
  activeNoteId: string | null;
  editingId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEditStart: (id: string) => void;
  onEditEnd: () => void;
  onRename: (id: string, name: string) => void;
  onRenameValueChange?: (value: string) => void;
}

/** Shared folder-row callbacks, bundled to avoid prop drilling. */
export interface FolderHandlers {
  editingFolderId: string | null;
  onCreate: (folderId?: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onFolderEditStart: (id: string) => void;
  onFolderEditEnd: () => void;
}
