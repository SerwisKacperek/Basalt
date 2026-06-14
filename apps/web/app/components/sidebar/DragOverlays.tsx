import { Folder as FolderIcon } from "lucide-react";

/** Floating clone shown under the cursor while dragging a note. */
export function NoteRowOverlay({ name }: { name: string }) {
  return (
    <div className="flex h-8 items-center rounded-md border border-sidebar-border bg-sidebar px-2 text-sm text-sidebar-foreground shadow-lg ring-1 ring-primary/40">
      <span className="truncate">{name}</span>
    </div>
  );
}

/** Floating clone shown under the cursor while dragging a folder. */
export function FolderRowOverlay({ name }: { name: string }) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-md border border-sidebar-border bg-sidebar px-2 text-sm font-medium text-sidebar-foreground shadow-lg ring-1 ring-primary/40 [&>svg]:size-4">
      <FolderIcon />
      <span className="truncate">{name}</span>
    </div>
  );
}
