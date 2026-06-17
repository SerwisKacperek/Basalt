import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PointerSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import type { Folder } from "~/pages/main";
import { ROOT, type FolderTarget, type Items } from "./types";

/** Group notes/folders into ordered per-container id lists. */
function buildItems(
  notes: EditorNote[],
  folders: Folder[],
): { items: Items; order: string[] } {
  const order = [...folders].sort((a, b) => a.position - b.position).map((f) => f.id);
  const items: Items = { [ROOT]: [] };
  for (const id of order) items[id] = [];
  const sorted = [...notes].sort((a, b) => a.position - b.position);
  for (const n of sorted) {
    const key = n.folderId && items[n.folderId] ? n.folderId : ROOT;
    (items[key] ??= []).push(n.id);
  }
  return { items, order };
}

interface UseSidebarDndArgs {
  notes: EditorNote[];
  folders: Folder[];
  onMoveNote: (noteId: string, targetFolderId: FolderTarget, index: number) => void;
  onReorderFolders: (orderedIds: string[]) => void;
}

/**
 * Owns the optimistic note/folder tree and all drag-and-drop wiring.
 *
 * The local tree is only rebuilt from props when the *set* of notes/folders
 * changes (create/delete) — reorders and moves are committed back to the parent,
 * so resyncing on those would just cause flicker.
 */
export function useSidebarDnd({
  notes,
  folders,
  onMoveNote,
  onReorderFolders,
}: UseSidebarDndArgs) {
  const noteById = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);
  const folderById = useMemo(
    () => new Map(folders.map((f) => [f.id, f])),
    [folders],
  );

  const membership = useMemo(
    () =>
      folders.map((f) => f.id).sort().join(",") +
      "|" +
      notes.map((n) => n.id).sort().join(","),
    [folders, notes],
  );
  const [tree, setTree] = useState(() => buildItems(notes, folders));
  const { items, order } = tree;
  const setItems = useCallback(
    (next: Items | ((prev: Items) => Items)) =>
      setTree((t) => ({ ...t, items: typeof next === "function" ? next(t.items) : next })),
    [],
  );
  const setOrder = useCallback(
    (next: string[]) => setTree((t) => ({ ...t, order: next })),
    [],
  );
  const lastMembership = useRef("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (draggingId) return;
    if (membership === lastMembership.current) return;
    lastMembership.current = membership;
    setTree(buildItems(notes, folders));
  }, [notes, folders, membership, draggingId]);

  const clonedItems = useRef<Items | null>(null);
  const lastOverId = useRef<string | null>(null);
  const recentlyMoved = useRef(false);
  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMoved.current = false;
    });
  }, [items]);

  const sensors = useSensors(
    // Require a small drag before activating, so clicks / double-clicks work.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // `buildItems` always seeds `items[ROOT]`, so folders and root are exactly the keys.
  const isContainer = useCallback((id: string) => id in items, [items]);

  // Reverse index: note id -> its container id, rebuilt only when items change.
  // Avoids an O(containers x items) scan on every drag-over (called twice each).
  const containerByItem = useMemo(() => {
    const map = new Map<string, string>();
    for (const key of Object.keys(items)) {
      for (const id of items[key] ?? []) map.set(id, key);
    }
    return map;
  }, [items]);

  const findContainer = useCallback(
    (id: string): string | undefined => {
      if (isContainer(id)) return id;
      return containerByItem.get(id);
    },
    [containerByItem, isContainer],
  );

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      // Dragging a folder: only collide with other folder containers.
      if (draggingId && isContainer(draggingId)) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (c) => c.id !== ROOT && String(c.id) in items,
          ),
        });
      }
      const pointer = pointerWithin(args);
      const intersections = pointer.length > 0 ? pointer : rectIntersection(args);
      let overId = getFirstCollision(intersections, "id");
      if (overId != null) {
        const containerItems = items[String(overId)];
        if (containerItems && containerItems.length > 0) {
          // Over a container — narrow to the closest note inside it.
          const closest = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (c) => c.id !== overId && containerItems.includes(String(c.id)),
            ),
          });
          overId = closest[0]?.id ?? overId;
        }
        lastOverId.current = String(overId);
        return [{ id: overId }];
      }
      if (recentlyMoved.current) lastOverId.current = draggingId;
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [draggingId, items, isContainer],
  );

  const onDragStart = (e: DragStartEvent) => {
    setDraggingId(String(e.active.id));
    clonedItems.current = items;
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    const aId = String(active.id);
    if (over == null || isContainer(aId)) return; // folder drag handled on end
    const overId = String(over.id);
    const overContainer = findContainer(overId);
    const activeContainer = findContainer(aId);
    if (!overContainer || !activeContainer || activeContainer === overContainer)
      return;

    setItems((prev) => {
      const overItems = prev[overContainer] ?? [];
      const activeItems = prev[activeContainer] ?? [];
      const overIndex = overItems.indexOf(overId);
      let newIndex: number;
      if (overId in prev) {
        newIndex = overItems.length;
      } else {
        const translated = active.rect.current.translated;
        const isBelow =
          !!translated && translated.top > over.rect.top + over.rect.height / 2;
        newIndex = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : overItems.length;
      }
      recentlyMoved.current = true;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== aId),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          aId,
          ...overItems.slice(newIndex),
        ],
      };
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const aId = String(active.id);

    // Folder reorder.
    if (isContainer(aId)) {
      const overId = over ? String(over.id) : null;
      if (overId && overId !== ROOT && overId in items && overId !== aId) {
        const oldIndex = order.indexOf(aId);
        const newIndex = order.indexOf(overId);
        if (oldIndex >= 0 && newIndex >= 0) {
          const next = arrayMove(order, oldIndex, newIndex);
          setOrder(next);
          onReorderFolders(next);
        }
      }
      setDraggingId(null);
      return;
    }

    // Note move / reorder.
    const overId = over ? String(over.id) : null;
    if (!overId) {
      if (clonedItems.current) setItems(clonedItems.current);
      setDraggingId(null);
      return;
    }
    const overContainer = findContainer(overId);
    const activeContainer = findContainer(aId);
    if (activeContainer && overContainer) {
      let arr = items[overContainer] ?? [];
      const activeIndex = arr.indexOf(aId);
      const overIndex = arr.indexOf(overId);
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        arr = arrayMove(arr, activeIndex, overIndex);
        setItems((prev) => ({ ...prev, [overContainer]: arr }));
      }
      const targetFolderId = overContainer === ROOT ? null : overContainer;
      onMoveNote(aId, targetFolderId, arr.indexOf(aId));
    }
    setDraggingId(null);
  };

  const onDragCancel = () => {
    if (clonedItems.current) setItems(clonedItems.current);
    clonedItems.current = null;
    setDraggingId(null);
  };

  const draggedNote = draggingId ? noteById.get(draggingId) : undefined;
  const draggedFolder = draggingId ? folderById.get(draggingId) : undefined;

  return {
    items,
    order,
    draggingId,
    noteById,
    folderById,
    draggedNote,
    draggedFolder,
    sensors,
    collisionDetection,
    dndHandlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
  };
}
