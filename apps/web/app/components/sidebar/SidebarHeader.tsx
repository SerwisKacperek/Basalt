import { Search, Plus, FolderPlus, PanelLeftClose, X } from "lucide-react";
import {
  Button,
  SidebarHeader as SidebarHeaderShell,
  SidebarInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar,
} from "@basalt/ui";

/** Small icon button with a tooltip, used for the header actions. */
function HeaderAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className ?? "size-8"}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Sidebar header: toggles between the action bar and an inline search field. */
export function SidebarHeader({
  isSearching,
  query,
  onQueryChange,
  onOpenSearch,
  onCloseSearch,
  onCreate,
  onCreateFolder,
}: {
  isSearching: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onCreate: () => void;
  onCreateFolder: () => void;
}) {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarHeaderShell className="h-16 flex-row items-center justify-between border-b border-border px-4">
      {isSearching ? (
        <div className="flex w-full items-center gap-2 animate-in fade-in duration-150">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
            <SidebarInput
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search notes..."
              className="pl-8"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={onCloseSearch}
          >
            <X />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 text-sidebar-foreground/70">
            <HeaderAction label="Search notes" onClick={onOpenSearch}>
              <Search />
            </HeaderAction>
            <HeaderAction label="New note" onClick={onCreate}>
              <Plus />
            </HeaderAction>
            <HeaderAction label="New folder" onClick={onCreateFolder}>
              <FolderPlus />
            </HeaderAction>
          </div>
          <HeaderAction
            label="Collapse sidebar"
            onClick={toggleSidebar}
            className="size-8 text-sidebar-foreground/50"
          >
            <PanelLeftClose />
          </HeaderAction>
        </>
      )}
    </SidebarHeaderShell>
  );
}
