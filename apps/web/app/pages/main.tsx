import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppSidebar } from "~/components/Sidebar";
import { EditorView } from "~/features/editor/EditorView";
import { useServices } from "~/services/ServiceContext";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import { BookLock, Plus, PanelLeftOpen } from "lucide-react";
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
  const { editorPersistence } = useServices();
  const [notes, setNotes] = useState<EditorNote[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [width, setWidth] = useState(loadSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(width);
  widthRef.current = width;

  const refresh = useCallback(async () => {
    const list = await editorPersistence.listNotes();
    setNotes(list);
    return list;
  }, [editorPersistence]);

  useEffect(() => {
    refresh()
      .then((list) => setActiveId((cur) => cur ?? list[0]?.id ?? null))
      .catch(console.error);
  }, [refresh]);

  const handleCreate = useCallback(async () => {
    const note = await editorPersistence.createNote("Untitled");
    await refresh();
    setActiveId(note.id);
    setEditingId(note.id);
  }, [editorPersistence, refresh]);

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
      const updates = await editorPersistence.loadUpdates(id);
      for (const update of updates) {
        await editorPersistence.appendUpdate(copy.id, update);
      }
      await refresh();
      setActiveId(copy.id);
    },
    [editorPersistence, refresh, notes],
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
        activeId={activeId}
        editingId={editingId}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onEditStart={setEditingId}
        onEditEnd={() => setEditingId(null)}
        onRename={handleRename}
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
              onClick={handleCreate}
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
              <Button onClick={handleCreate}>
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
