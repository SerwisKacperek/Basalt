import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import { Button, Input } from "@basalt/ui";
import { useServices } from "~/services/ServiceContext";

export function EditorList() {
  const { editorPersistence } = useServices();
  const [docs, setDocs] = useState<EditorNote[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("Untitled");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rebuildOpen, setRebuildOpen] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  const refresh = () => {
    editorPersistence.listNotes().then(setDocs).catch(console.error);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setTitle("Untitled");
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setCreateOpen(false);
    await editorPersistence.createNote(trimmed);
    refresh();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    await editorPersistence.deleteNote(id);
    refresh();
  };

  const confirmRebuild = async () => {
    setRebuilding(true);
    try {
      await editorPersistence.reset();
      setDocs([]);
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setRebuilding(false);
      setRebuildOpen(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRebuildOpen(true)}>
            Rebuild DB
          </Button>
          <Button onClick={openCreate}>New document</Button>
        </div>
      </div>
      {docs === null ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-muted-foreground">No documents yet. Create one above.</p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-2">
              <Link
                to={`/editor/${d.id}`}
                className="text-blue-700 dark:text-blue-400 hover:underline flex-1"
              >
                {d.name}
              </Link>
              <span className="text-xs text-muted-foreground mr-3">
                {new Date(d.updatedAt).toLocaleString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(d.id)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      {createOpen && (
        <Modal onClose={() => setCreateOpen(false)} title="New document">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitCreate();
            }}
            className="space-y-4"
          >
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim()}>
                Create
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteId && (
        <Modal onClose={() => setDeleteId(null)} title="Delete document?">
          <p className="text-muted-foreground mb-4">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </Modal>
      )}

      {rebuildOpen && (
        <Modal onClose={() => setRebuildOpen(false)} title="Rebuild database?">
          <p className="text-muted-foreground mb-4">
            This wipes the local database and recreates it from scratch. All
            documents on this device will be permanently deleted. Use this to
            recover from a corrupt or stale database.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRebuildOpen(false)}
              disabled={rebuilding}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRebuild}
              disabled={rebuilding}
            >
              {rebuilding ? "Rebuilding…" : "Rebuild"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background text-foreground border border-border rounded-lg shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
