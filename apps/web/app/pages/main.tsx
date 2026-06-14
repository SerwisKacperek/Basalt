import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "~/components/Sidebar";
import { EditorView } from "~/features/editor/EditorView";
import { useServices } from "~/services/ServiceContext";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import { BookLock, Share2, Save, Ellipsis, Plus, PanelLeftOpen } from "lucide-react";
import { Button } from "@basalt/ui";

export default function Main() {
  const { editorPersistence } = useServices();
  const [notes, setNotes] = useState<EditorNote[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const activeNote = notes?.find((n) => n.id === activeId) ?? null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        notes={notes ?? []}
        activeId={activeId}
        collapsed={collapsed}
        editingId={editingId}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onCollapse={() => setCollapsed(true)}
        onEditStart={setEditingId}
        onEditEnd={() => setEditingId(null)}
        onRename={handleRename}
      />
      <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <header className="h-16 border-b border-border p-4 flex items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-xl font-bold min-w-0">
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                title="Open sidebar"
                className="shrink-0 text-foreground/70 hover:text-primary transition-colors cursor-pointer"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
            <BookLock size={18} className="shrink-0" />
            <span className="truncate">{activeNote?.name ?? "Basalt"}</span>
          </h1>
          <div className="flex items-center gap-2">
            {activeNote && (
              <p className="text-sm text-muted-foreground whitespace-nowrap mx-2">
                Last edited: {new Date(activeNote.updatedAt).toLocaleString()}
              </p>
            )}
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
      </main>
    </div>
  );
}
