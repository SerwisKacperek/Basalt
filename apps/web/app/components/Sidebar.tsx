import React, { useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  PanelLeftClose,
  X,
  User,
  ChevronRight,
  ChevronsUpDown,
  Lock,
  LogOut,
  Settings,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar,
} from "@basalt/ui";
import type { EditorNote } from "@basalt/core/interfaces/IEditorPersistenceService";
import { useServices } from "~/services/ServiceContext";
import { SettingsPanel } from "~/components/SettingsPanel";

export interface AppSidebarProps {
  notes: EditorNote[];
  activeId: string | null;
  editingId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEditStart: (id: string) => void;
  onEditEnd: () => void;
  onRename: (id: string, name: string) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}

export function AppSidebar({
  notes,
  activeId,
  editingId,
  onSelect,
  onCreate,
  onDelete,
  onDuplicate,
  onEditStart,
  onEditEnd,
  onRename,
  onResizeStart,
}: AppSidebarProps) {
  const { ollama } = useServices();
  const { toggleSidebar, state } = useSidebar();
  const [isPrivateOpen, setIsPrivateOpen] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border">
      <SidebarHeader className="h-16 flex-row items-center justify-between border-b border-border px-4">
        {isSearching ? (
          <div className="flex w-full items-center gap-2 animate-in fade-in duration-150">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
              <SidebarInput
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes..."
                className="pl-8"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={closeSearch}
            >
              <X />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 text-sidebar-foreground/70">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setIsSearching(true)}
                  >
                    <Search />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search notes</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={onCreate}
                  >
                    <Plus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New note</TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-sidebar-foreground/50"
                  onClick={toggleSidebar}
                >
                  <PanelLeftClose />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collapse sidebar</TooltipContent>
            </Tooltip>
          </>
        )}
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarMenu>
            <Collapsible
              open={isPrivateOpen}
              onOpenChange={setIsPrivateOpen}
              className="group/collapsible"
              asChild
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="font-medium">
                    <Lock />
                    <span>Private</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {filteredNotes.length === 0 ? (
                    <p className="px-4 py-1.5 text-xs text-muted-foreground">
                      {query.trim() ? "No matching notes" : "No notes yet"}
                    </p>
                  ) : (
                    <SidebarMenuSub>
                      {filteredNotes.map((note) =>
                        note.id === editingId ? (
                          <SidebarMenuSubItem key={note.id}>
                            <RenameInput
                              initial={note.name}
                              onSubmit={(value) => submitRename(note, value)}
                              onCancel={onEditEnd}
                            />
                          </SidebarMenuSubItem>
                        ) : (
                          <SidebarMenuSubItem
                            key={note.id}
                            className="group/note relative"
                          >
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={note.id === activeId}
                                  className="pr-7 w-full"
                                >
                                  <button
                                    type="button"
                                    onClick={() => onSelect(note.id)}
                                    onDoubleClick={() => onEditStart(note.id)}
                                  >
                                    <span className="truncate">{note.name}</span>
                                  </button>
                                </SidebarMenuSubButton>
                              </ContextMenuTrigger>
                              <ContextMenuContent className="w-44">
                                <NoteMenuItems
                                  Item={ContextMenuItem}
                                  Separator={ContextMenuSeparator}
                                  onRename={() => onEditStart(note.id)}
                                  onDuplicate={() => onDuplicate(note.id)}
                                  onDelete={() => onDelete(note.id)}
                                />
                              </ContextMenuContent>
                            </ContextMenu>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="Note options"
                                  className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/70 opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 group-hover/note:opacity-100 data-[state=open]:opacity-100 [&>svg]:size-4"
                                >
                                  <MoreHorizontal />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                side="right"
                                align="start"
                                className="w-44"
                              >
                                <NoteMenuItems
                                  Item={DropdownMenuItem}
                                  Separator={DropdownMenuSeparator}
                                  onRename={() => onEditStart(note.id)}
                                  onDuplicate={() => onDuplicate(note.id)}
                                  onDelete={() => onDelete(note.id)}
                                />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuSubItem>
                        ),
                      )}
                    </SidebarMenuSub>
                  )}
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border px-2 h-16 justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg border border-primary/40">
                    <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                      <User className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Your account</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      Local workspace
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-lg"
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg border border-primary/40">
                      <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                        <User className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        Your account
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        Local workspace
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <SettingsPanel
          ollama={ollama}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          hideTrigger
        />
      </SidebarFooter>

      {state === "expanded" && (
        <div
          onMouseDown={onResizeStart}
          title="Drag to resize"
          className="absolute inset-y-0 right-0 z-20 w-1.5 translate-x-1/2 cursor-col-resize transition-colors hover:bg-primary/40 active:bg-primary"
        />
      )}
    </Sidebar>
  );
}

type MenuItemComponent = React.ComponentType<{
  onSelect?: (e: Event) => void;
  className?: string;
  children?: React.ReactNode;
}>;

function NoteMenuItems({
  Item,
  Separator,
  onRename,
  onDuplicate,
  onDelete,
}: {
  Item: MenuItemComponent;
  Separator: React.ComponentType;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <Item onSelect={onRename}>
        <Pencil />
        Rename
      </Item>
      <Item onSelect={onDuplicate}>
        <Copy />
        Duplicate
      </Item>
      <Separator />
      <Item
        className="text-destructive focus:text-destructive"
        onSelect={onDelete}
      >
        <Trash2 />
        Delete
      </Item>
    </>
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
    <Input
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
      className="h-7 px-2 text-sm"
    />
  );
}
