import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppSidebar } from "~/components/sidebar";
import { EditorView } from "~/features/editor/EditorView";
import { useServices } from "~/services/ServiceContext";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import type { Select } from "@basalt/domain";
import { RenameInput } from "~/components/sidebar/RenameInput";
import { BookLock, Plus, PanelLeftOpen } from "lucide-react";

export type Folder = Select<"folders">;
export type Workspace = Select<"workspaces">;
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
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<"sidebar" | "topbar" | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const originalNameRef = useRef<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [width, setWidth] = useState(loadSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(width);
  widthRef.current = width;

  const refresh = useCallback(async () => {
    const [list, folderList] = await Promise.all([
      editorPersistence.listNotes(),
      workspaceId
        ? folderService.findAll({ workspace_id: workspaceId })
        : folderService.findAll(),
    ]);

    // Filter notes to current workspace. Notes with workspaceId === null were
    // created before workspace assignment and are treated as local workspace notes.
    const isLocalWorkspace =
      workspaceList.find((w) => w.id === workspaceId)?.type === "local";
    const workspaceNotes = workspaceId
      ? list.filter(
          (n) =>
            n.workspaceId === workspaceId ||
            (isLocalWorkspace && n.workspaceId === null),
        )
      : list;

    setNotes(workspaceNotes);
    setFolders([...folderList].sort((a, b) => a.position - b.position));
    return workspaceNotes;
  }, [editorPersistence, folderService, workspaceId, workspaceList]);

  useEffect(() => {
    refresh()
      .then((list) => setActiveId((cur) => cur ?? list[0]?.id ?? null))
      .catch(console.error);
  }, [refresh]);

  const refreshWorkspaces = useCallback(async () => {
    const all = await workspaces.findAll();
    setWorkspaceList(all);
    return all;
  }, [workspaces]);

  // Ensure a local workspace exists, then start polling remote workspaces.
  useEffect(() => {
    const init = async () => {
      const all = await workspaces.findAll();
      let local = all.find((w) => w.type === "local");
      if (!local) {
        local = await workspaces.create({ name: "Local workspace", type: "local" });
      }
      setWorkspaceId(local.id);
      setWorkspaceList(await workspaces.findAll());
    };
    init().catch(console.error);
  }, [workspaces]);

  const syncRemote = useCallback(async () => {
    await workspaces.sync?.();
    await refreshWorkspaces();
    if (folderService.sync) {
      await folderService
        .sync()
        .catch((err) => console.error("[sync] folders:", err));
    }
    await editorPersistence
      .syncNoteList()
      .catch((err) => console.error("[sync] notes:", err));
    await refresh();
  }, [workspaces, refreshWorkspaces, editorPersistence, folderService, refresh]);
  const syncRemoteRef = useRef(syncRemote);
  useEffect(() => {
    syncRemoteRef.current = syncRemote;
  }, [syncRemote]);

  // Sync once on mount, then poll every 30 s and on window focus.
  useEffect(() => {
    const tick = () => {
      void syncRemoteRef.current();
    };
    tick();
    const id = setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, []);

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
        workspace_id: workspaceId,
        position: maxPos + 1,
      });
      await refresh();
      setActiveId(note.id);
      setEditingId(note.id);
      setEditingSource("sidebar");
      setEditingName(null);
    },
    [editorPersistence, noteService, refresh, notes, workspaceId],
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

  const handleWorkspaceSelect = useCallback((id: string) => {
    setWorkspaceId(id);
    setActiveId(null);
  }, []);

  const handleCreateWorkspace = useCallback(
    async (name: string, type: "local" | "remote", url?: string) => {
      await workspaces.create({ name, type, url: url ?? null });
      await workspaces.sync?.();
      setWorkspaceList(await workspaces.findAll());
    },
    [workspaces],
  );

  const handleJoinWorkspace = useCallback(
    async (ws: { id: string; name: string; url: string }) => {
      await workspaces.join?.({ id: ws.id, name: ws.name, type: "remote", url: ws.url });
      await syncRemote();
      setWorkspaceId(ws.id);
    },
    [workspaces, syncRemote],
  );

  const handleDeleteWorkspace = useCallback(
    async (id: string) => {
      await workspaces.delete(id);
      const remaining = await workspaces.findAll();
      setWorkspaceList(remaining);
      setWorkspaceId((cur) => {
        if (cur !== id) return cur;
        return remaining.find((w) => w.type === "local")?.id ?? remaining[0]?.id ?? null;
      });
    },
    [workspaces],
  );

  const handleUpdateWorkspaceUrl = useCallback(
    async (id: string, url: string) => {
      await workspaces.update(id, { url });
      setWorkspaceList(await workspaces.findAll());
    },
    [workspaces],
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
        workspaces={workspaceList}
        activeWorkspaceId={workspaceId}
        activeId={activeId}
        editingId={editingSource === "sidebar" ? editingId : null}
        editingFolderId={editingFolderId}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onEditStart={(id) => {
          setEditingId(id);
          setEditingSource("sidebar");
          setEditingName(null);
          originalNameRef.current = null;
        }}
        onEditEnd={() => {
          setEditingId(null);
          setEditingSource(null);
          setEditingName(null);
        }}
        onRename={handleRename}
        onRenameValueChange={setEditingName}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onFolderEditStart={setEditingFolderId}
        onFolderEditEnd={() => setEditingFolderId(null)}
        onMoveNote={handleMoveNote}
        onReorderFolders={handleReorderFolders}
        onResizeStart={initResize}
        onWorkspaceSelect={handleWorkspaceSelect}
        onCreateWorkspace={handleCreateWorkspace}
        onJoinWorkspace={handleJoinWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onUpdateWorkspaceUrl={handleUpdateWorkspaceUrl}
      />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border p-4">
          <h1 className="flex min-w-0 flex-1 items-center gap-2 text-xl font-bold">
            <OpenSidebarButton />
            <BookLock size={18} className="shrink-0" />
            {activeNote && editingId === activeId && editingSource === "topbar" ? (
              <RenameInput
                initial={activeNote.name}
                onSubmit={(name) => {
                  const trimmed = name.trim();
                  if (trimmed && trimmed !== originalNameRef.current) {
                    void handleRename(activeId!, trimmed);
                  } else {
                    const orig = originalNameRef.current;
                    if (orig !== null) {
                      setNotes((prev) =>
                        prev?.map((n) => (n.id === activeId ? { ...n, name: orig } : n)) ?? null,
                      );
                    }
                  }
                  setEditingId(null);
                  setEditingSource(null);
                  setEditingName(null);
                }}
                onCancel={() => {
                  const orig = originalNameRef.current;
                  if (orig !== null) {
                    setNotes((prev) =>
                      prev?.map((n) => (n.id === activeId ? { ...n, name: orig } : n)) ?? null,
                    );
                  }
                  setEditingId(null);
                  setEditingSource(null);
                  setEditingName(null);
                }}
                onValueChange={(value) => {
                  setNotes((prev) =>
                    prev?.map((n) => (n.id === activeId ? { ...n, name: value } : n)) ?? null,
                  );
                }}
                className="h-8 min-w-0 flex-1 px-2 text-xl font-bold"
              />
            ) : (
              <span
                className={activeNote ? "cursor-text truncate" : "truncate"}
                onDoubleClick={
                  activeNote
                    ? () => {
                        originalNameRef.current = activeNote.name;
                        setEditingId(activeId!);
                        setEditingSource("topbar");
                        setEditingName(null);
                      }
                    : undefined
                }
              >
                {editingId === activeId && editingSource === "sidebar" && editingName !== null
                  ? editingName
                  : activeNote?.name ?? "Basalt"}
              </span>
            )}
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
