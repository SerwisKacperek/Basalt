import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Inbox, PanelLeftClose, X, User, ChevronDown, ChevronRight, Pencil, Copy, Trash2 } from "lucide-react";
import { Input, SettingsPanel } from "@basalt/ui";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import { useServices } from "~/services/ServiceContext";

// const TEAMSPACES = [
//   { id: "t1", name: "Marta's Teamspace" },
//   { id: "t2", name: "Drużyna Pierścienia" },
//   { id: "t3", name: "Drużyna A" },
//   { id: "t4", name: "Drużyna AA" },
//   { id: "t5", name: "Team Numero Uno" },
// ];

export interface SidebarProps {
  notes: EditorNote[];
  activeId: string | null;
  collapsed: boolean;
  editingId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCollapse: () => void;
  onEditStart: (id: string) => void;
  onEditEnd: () => void;
  onRename: (id: string, name: string) => void;
}

interface ContextMenuState {
  noteId: string;
  x: number;
  y: number;
}

export function Sidebar({
  notes,
  activeId,
  collapsed,
  editingId,
  onSelect,
  onCreate,
  onDelete,
  onDuplicate,
  onCollapse,
  onEditStart,
  onEditEnd,
  onRename,
}: SidebarProps) {
  const { ollama } = useServices();
  const [isPrivateOpen, setIsPrivateOpen] = useState(true);
  const [isTeamsOpen, setIsTeamsOpen] = useState(true);
  const [width, setWidth] = useState(240);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const openContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    setContextMenu({ noteId, x: e.clientX, y: e.clientY });
  };

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => n.name.toLowerCase().includes(q));
  }, [notes, query]);

  const closeSearch = () => {
    setIsSearching(false);
    setQuery("");
  };

  const submitRename = (note: EditorNote, value: string) => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== note.name) onRename(note.id, trimmed);
    onEditEnd();
  };

  const initResize = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const doResize = (mouseMoveEvent: MouseEvent) => {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth >= 200 && newWidth <= 500) setWidth(newWidth);
    };
    const stopResize = () => {
      window.removeEventListener("mousemove", doResize);
      window.removeEventListener("mouseup", stopResize);
    };
    window.addEventListener("mousemove", doResize);
    window.addEventListener("mouseup", stopResize);
  };

  if (collapsed) return null;

  return (
    <aside style={{ width: `${width}px` }} className="relative flex flex-col h-screen overflow-hidden bg-sidebar border-r border-primary select-none shrink-0">

      <div className="flex items-center justify-between p-4 border-b border-primary h-16 shrink-0">
        {isSearching ? (
          <div className="flex items-center gap-2 w-full animate-in fade-in duration-150">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text/50" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes..."
                className="pl-8"
              />
            </div>
            <button
              onClick={closeSearch}
              className="text-text/50 hover:text-primary transition-colors cursor-pointer shrink-0 p-1"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 text-text/70">
              <button
                onClick={() => setIsSearching(true)}
                title="Search notes"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                <Search size={18} />
              </button>
              <button
                onClick={onCreate}
                title="New note"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                <Plus size={18} />
              </button>
              <button title="Inbox" className="hover:text-primary transition-colors cursor-pointer">
                <Inbox size={18} />
              </button>
            </div>
            <button
              onClick={onCollapse}
              title="Collapse sidebar"
              className="text-text/50 hover:text-primary transition-colors cursor-pointer shrink-0 ml-auto"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">

        <div>
          <button
            onClick={() => setIsPrivateOpen(!isPrivateOpen)}
            className="flex items-center gap-1 w-full text-sm font-bold tracking-wider text-primary mb-3 px-2 uppercase cursor-pointer truncate"
          >
            {isPrivateOpen ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />}
            <span className="truncate">Private</span>
          </button>

          {isPrivateOpen && (
            filteredNotes.length === 0 ? (
              <p className="px-4 text-xs text-text/50">
                {query.trim() ? "No matching notes" : "No notes yet"}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filteredNotes.map((note) => {
                  const isActive = note.id === activeId;
                  if (note.id === editingId) {
                    return (
                      <li key={note.id}>
                        <RenameInput
                          initial={note.name}
                          onSubmit={(value) => submitRename(note, value)}
                          onCancel={onEditEnd}
                        />
                      </li>
                    );
                  }
                  return (
                    <li key={note.id} className="flex items-center">
                      <button
                        onClick={() => onSelect(note.id)}
                        onDoubleClick={() => onEditStart(note.id)}
                        onContextMenu={(e) => openContextMenu(e, note.id)}
                        title="Double-click to rename, right-click for options"
                        className={`flex items-center gap-2 flex-1 min-w-0 text-left px-4 py-1.5 text-sm transition-colors cursor-pointer
                          ${isActive
                            ? "bg-primary/20 text-text font-medium"
                            : "text-text/80 hover:bg-primary/5 hover:text-text"
                          }`}
                      >
                        <span className="text-xs text-primary/70 shrink-0">•</span>
                        <span className="truncate">{note.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          )}
        </div>

        {/*<div>
          <button
            onClick={() => setIsTeamsOpen(!isTeamsOpen)}
            className="flex items-center gap-1 w-full text-left text-sm font-bold tracking-wider text-primary mb-3 px-2 uppercase cursor-pointer truncate"
          >
            {isTeamsOpen ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />}
            <span className="truncate">Teamspaces</span>
          </button>

          {isTeamsOpen && (
            <ul className="space-y-0.5">
              {TEAMSPACES.map((team) => (
                <li key={team.id}>
                  <button className="w-full text-left px-6 py-1.5 text-sm text-text/80 rounded-sm hover:bg-primary/5 hover:text-text transition-colors cursor-pointer truncate">
                    {team.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>*/}

      </div>

      <div className="border-t border-primary px-4 h-16 flex items-center justify-between bg-sidebar shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
            <User size={16} />
          </div>
          <span className="text-sm font-medium truncate">Username</span>
        </div>
        <SettingsPanel ollama={ollama} />
      </div>

      <div
        onMouseDown={initResize}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/40 active:bg-primary transition-colors z-50 translate-x-0.75"
      />

      {contextMenu && (
        <NoteContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={() => onEditStart(contextMenu.noteId)}
          onDuplicate={() => onDuplicate(contextMenu.noteId)}
          onDelete={() => onDelete(contextMenu.noteId)}
        />
      )}
    </aside>
  );
}

function NoteContextMenu({
  x,
  y,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Keep the menu inside the viewport.
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPos({
      x: Math.min(x, window.innerWidth - width - 8),
      y: Math.min(y, window.innerHeight - height - 8),
    });
  }, [x, y]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = (action: () => void) => () => {
    action();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-100" onMouseDown={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
      <div
        ref={menuRef}
        style={{ top: pos.y, left: pos.x }}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute min-w-40 py-1 rounded-md bg-sidebar border border-primary shadow-lg animate-in fade-in zoom-in-95 duration-100"
      >
        <button
          onClick={run(onRename)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-text/80 hover:bg-primary/10 hover:text-text transition-colors cursor-pointer"
        >
          <Pencil size={14} className="shrink-0" />
          Rename
        </button>
        <button
          onClick={run(onDuplicate)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-text/80 hover:bg-primary/10 hover:text-text transition-colors cursor-pointer"
        >
          <Copy size={14} className="shrink-0" />
          Duplicate
        </button>
        <div className="my-1 border-t border-primary/50" />
        <button
          onClick={run(onDelete)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 size={14} className="shrink-0" />
          Delete
        </button>
      </div>
    </div>,
    document.body,
  );
}

function RenameInput({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  // Guard so Enter (which blurs) doesn't also fire the blur handler.
  const doneRef = useRef(false);

  const finish = (commit: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (commit) onSubmit(value);
    else onCancel();
  };

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
        }
      }}
      className="w-full mx-1 px-3 py-1 text-sm bg-background text-text border border-primary rounded-sm outline-none"
    />
  );
}
