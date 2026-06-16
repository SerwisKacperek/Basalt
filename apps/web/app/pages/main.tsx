import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppSidebar } from "~/components/sidebar";
import { EditorView } from "~/features/editor/EditorView";
import { useServices } from "~/services/ServiceContext";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import type { Select } from "@basalt/domain";
import { BookLock, Plus, PanelLeftOpen } from "lucide-react";

export type Folder = Select<"folders">;
import {
  Button,
  SidebarInset,
  SidebarProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar,
} from "@basalt/ui";

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 240;
const SIDEBAR_WIDTH_STORAGE_KEY = "basalt:sidebar-width";

function loadSidebarWidth(): number {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
  const saved = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
  return saved >= MIN_SIDEBAR_WIDTH && saved <= MAX_SIDEBAR_WIDTH
    ? saved
    : DEFAULT_SIDEBAR_WIDTH;
}

export default function Main() {
  const { editorPersistence, notes: noteService, folders: folderService, workspaces } =
    useServices();
  const [notes, setNotes] = useState<EditorNote[] | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [width, setWidth] = useState(loadSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(width);
  widthRef.current = width;

  const refresh = useCallback(async () => {
    const [list, folderList] = await Promise.all([
      editorPersistence.listNotes(),
      folderService.findAll(),
    ]);
    setNotes(list);
    setFolders([...folderList].sort((a, b) => a.position - b.position));
    return list;
  }, [editorPersistence, folderService]);

  useEffect(() => {
    refresh()
      .then((list) => setActiveId((cur) => cur ?? list[0]?.id ?? null))
      .catch(console.error);
  }, [refresh]);

  // Folders require a workspace (NOT NULL FK); ensure a default one exists.
  useEffect(() => {
    workspaces
      .findAll()
      .then(async (all) => {
        const ws = all[0] ?? (await workspaces.create({ name: "Local workspace" }));
        setWorkspaceId(ws.id);
      })
      .catch(console.error);
  }, [workspaces]);

  const handleCreate = useCallback(
    async (folderId: string | null = null) => {
      const note = await editorPersistence.createNote("Untitled");
      const maxPos = Math.max(
        -1,
        ...(notes ?? [])
          .filter((n) => (n.folderId ?? null) === folderId)
          .map((n) => n.position),
      );
      await noteService.update(note.id, {
        folder_id: folderId,
        position: maxPos + 1,
      });
      await refresh();
      setActiveId(note.id);
      setEditingId(note.id);
    },
    [editorPersistence, noteService, refresh, notes],
  );

  const handleRename = useCallback(
    async (id: string, name: string) => {
      await editorPersistence.renameNote(id, name);
      await refresh();
    },
    [editorPersistence, refresh],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await editorPersistence.deleteNote(id);
      const list = await refresh();
      setActiveId((cur) => (cur === id ? list[0]?.id ?? null : cur));
    },
    [editorPersistence, refresh],
  );

  const handleDuplicate = useCallback(
    async (id: string) => {
      const original = notes?.find((n) => n.id === id);
      const copy = await editorPersistence.createNote(
        `${original?.name ?? "Untitled"} (copy)`,
      );
      const { snapshot, operations } = await editorPersistence.loadNote(id);
      const updates = snapshot ? [snapshot, ...operations] : operations;
      for (const update of updates) {
        await editorPersistence.appendOperation(copy.id, update);
      }
      // Place the copy right next to the original, in the same folder.
      await noteService.update(copy.id, {
        folder_id: original?.folderId ?? null,
        position: (original?.position ?? 0) + 1,
      });
      await refresh();
      setActiveId(copy.id);
    },
    [editorPersistence, noteService, refresh, notes],
  );

  const handleCreateFolder = useCallback(async () => {
    if (!workspaceId) return;
    const maxPos = Math.max(-1, ...folders.map((f) => f.position));
    const folder = await folderService.create({
      name: "New folder",
      workspace_id: workspaceId,
      position: maxPos + 1,
    });
    await refresh();
    setEditingFolderId(folder.id);
  }, [folderService, refresh, folders, workspaceId]);

  const handleRenameFolder = useCallback(
    async (id: string, name: string) => {
      await folderService.update(id, { name });
      await refresh();
    },
    [folderService, refresh],
  );

  const handleDeleteFolder = useCallback(
    async (id: string) => {
      // Never destroy notes: move children back to the root section first.
      const children = (notes ?? []).filter((n) => n.folderId === id);
      await Promise.all(
        children.map((n) => noteService.update(n.id, { folder_id: null })),
      );
      await folderService.delete(id);
      await refresh();
    },
    [folderService, noteService, refresh, notes],
  );

  // Move a note into a folder (or root, folderId === null) at a given index,
  // reindexing the target list densely so the order persists.
  const handleMoveNote = useCallback(
    async (noteId: string, targetFolderId: string | null, targetIndex: number) => {
      const moved = (notes ?? []).find((n) => n.id === noteId);
      if (!moved) return;
      const siblings = (notes ?? [])
        .filter((n) => (n.folderId ?? null) === targetFolderId && n.id !== noteId)
        .sort((a, b) => a.position - b.position);
      const ordered = [...siblings];
      ordered.splice(Math.max(0, Math.min(targetIndex, siblings.length)), 0, moved);
      await Promise.all(
        ordered.map((n, i) => {
          if (n.id === noteId) {
            return noteService.update(n.id, {
              folder_id: targetFolderId,
              position: i,
            });
          }
          return n.position === i
            ? Promise.resolve()
            : noteService.update(n.id, { position: i });
        }),
      );
      await refresh();
    },
    [noteService, refresh, notes],
  );

  const handleReorderFolders = useCallback(
    async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, i) => {
          const f = folders.find((x) => x.id === id);
          return !f || f.position === i
            ? Promise.resolve()
            : folderService.update(id, { position: i });
        }),
      );
      await refresh();
    },
    [folderService, refresh, folders],
  );

  const initResize = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
    const doResize = (mouseMoveEvent: MouseEvent) => {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setWidth(newWidth);
      }
    };
    const stopResize = () => {
      setIsResizing(false);
      window.localStorage.setItem(
        SIDEBAR_WIDTH_STORAGE_KEY,
        String(widthRef.current),
      );
      window.removeEventListener("mousemove", doResize);
      window.removeEventListener("mouseup", stopResize);
    };
    window.addEventListener("mousemove", doResize);
    window.addEventListener("mouseup", stopResize);
  }, []);

  const activeNote = notes?.find((n) => n.id === activeId) ?? null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${width}px`,
          ...(isResizing ? { "--sidebar-transition-duration": "0ms" } : {}),
        } as React.CSSProperties
      }
      className="h-full min-h-0 overflow-hidden"
    >
      <AppSidebar
        notes={notes ?? []}
        folders={folders}
        activeId={activeId}
        editingId={editingId}
        editingFolderId={editingFolderId}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onEditStart={setEditingId}
        onEditEnd={() => setEditingId(null)}
        onRename={handleRename}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onFolderEditStart={setEditingFolderId}
        onFolderEditEnd={() => setEditingFolderId(null)}
        onMoveNote={handleMoveNote}
        onReorderFolders={handleReorderFolders}
        onResizeStart={initResize}
      />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border p-4">
          <h1 className="flex min-w-0 items-center gap-2 text-xl font-bold">
            <OpenSidebarButton />
            <BookLock size={18} className="shrink-0" />
            <span className="truncate">{activeNote?.name ?? "Basalt"}</span>
          </h1>
          <div className="flex items-center gap-2">
            {activeNote && (
              <p className="mx-2 whitespace-nowrap text-sm text-muted-foreground">
                Last edited: {new Date(activeNote.updatedAt).toLocaleString()}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleCreate()}
            >
              <Plus className="size-4" />
              New note
            </Button>
          </div>
        </header>
        {activeId ? (
          <EditorView key={activeId} id={activeId} />
        ) : (
          notes !== null && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
              <p>No note selected.</p>
              <Button onClick={() => handleCreate()}>
                <Plus size={16} />
                New note
              </Button>
            </div>
          )
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

function OpenSidebarButton() {
  const { state, toggleSidebar } = useSidebar();
  if (state !== "collapsed") return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={toggleSidebar}
        >
          <PanelLeftOpen />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Open sidebar</TooltipContent>
    </Tooltip>
  );
}
