import { useState } from "react";
import {
  User,
  ChevronsUpDown,
  LogOut,
  Settings,
  Check,
  Plus,
  HardDrive,
  Globe,
  MoreHorizontal,
  Trash2,
  Link,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  Button,
  Input,
  Label,
} from "@basalt/ui";
import { useServices } from "~/services/ServiceContext";
import { SettingsPanel } from "~/components/SettingsPanel";
import { useAuth } from "~/hooks/useAuth";
import type { Workspace } from "~/pages/main";

function AccountAvatar() {
  return (
    <Avatar className="size-8 rounded-lg border border-primary/40">
      <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
        <User className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}

async function healthcheck(url: string): Promise<void> {
  const res = await fetch(`${url.replace(/\/$/, "")}/api/healthcheck`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Server responded with ${res.status}`);
}

interface RemoteWorkspaceEntry {
  id: string;
  name: string;
  type?: string | null;
}

interface SidebarUserMenuProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (id: string) => void;
  onCreateWorkspace: (name: string, type: "local" | "remote", url?: string) => Promise<void>;
  onJoinWorkspace: (ws: { id: string; name: string; url: string }) => Promise<void>;
  onDeleteWorkspace: (id: string) => Promise<void>;
  onUpdateWorkspaceUrl: (id: string, url: string) => Promise<void>;
}

type CreateStep = "type" | "local" | "remote" | "join";

export function SidebarUserMenu({
  workspaces,
  activeWorkspaceId,
  onWorkspaceSelect,
  onCreateWorkspace,
  onJoinWorkspace,
  onDeleteWorkspace,
  onUpdateWorkspaceUrl,
}: SidebarUserMenuProps) {
  const { ai } = useServices();
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // — Create dialog —
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("type");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // — Join state —
  const [joinUrl, setJoinUrl] = useState("");
  const [joinList, setJoinList] = useState<RemoteWorkspaceEntry[]>([]);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState<string | null>(null);

  // — Workspace action dialog (three-dots) —
  const [actionWs, setActionWs] = useState<Workspace | null>(null);
  const [actionView, setActionView] = useState<"menu" | "changeUrl">("menu");
  const [changeUrl, setChangeUrl] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changingUrl, setChangingUrl] = useState(false);
  const [deletingWs, setDeletingWs] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const activeLabel = activeWorkspace?.name ?? "Local workspace";
  const isLocal = activeWorkspace?.type === "local" || !activeWorkspace;

  function openCreate() {
    setCreateStep("type");
    setNewName("");
    setNewUrl("");
    setCreateError("");
    setCreating(false);
    setJoinUrl("");
    setJoinList([]);
    setJoinError("");
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
  }

  async function handleCreateLocal() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setCreateError("");
    try {
      await onCreateWorkspace(name, "local");
      closeCreate();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateRemote() {
    const name = newName.trim();
    const url = newUrl.trim();
    if (!name || !url) return;
    setCreating(true);
    setCreateError("");
    try {
      await healthcheck(url);
      await onCreateWorkspace(name, "remote", url);
      closeCreate();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Could not reach server");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinSearch() {
    const url = joinUrl.trim();
    if (!url) return;
    setJoinLoading(true);
    setJoinError("");
    setJoinList([]);
    try {
      await healthcheck(url);
      const res = await fetch(`${url.replace(/\/$/, "")}/api/workspaces`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = (await res.json()) as RemoteWorkspaceEntry[];
      // Exclude workspaces already joined and locally-typed ones
      const existingIds = new Set(workspaces.map((w) => w.id));
      setJoinList(data.filter((w) => w.type !== "local" && !existingIds.has(w.id)));
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Could not reach server");
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleJoinSelect(ws: RemoteWorkspaceEntry) {
    const url = joinUrl.trim();
    setJoining(ws.id);
    try {
      await onJoinWorkspace({ id: ws.id, name: ws.name, url });
      closeCreate();
    } finally {
      setJoining(null);
    }
  }

  function openActionMenu(ws: Workspace) {
    setActionWs(ws);
    setActionView("menu");
    setChangeUrl(ws.url ?? "");
    setChangeError("");
    setChangingUrl(false);
    setDeletingWs(false);
  }

  async function handleDelete() {
    if (!actionWs) return;
    setDeletingWs(true);
    try {
      await onDeleteWorkspace(actionWs.id);
      setActionWs(null);
    } finally {
      setDeletingWs(false);
    }
  }

  async function handleChangeUrl() {
    const url = changeUrl.trim();
    if (!url || !actionWs) return;
    setChangingUrl(true);
    setChangeError("");
    try {
      await healthcheck(url);
      await onUpdateWorkspaceUrl(actionWs.id, url);
      setActionWs(null);
    } catch (e) {
      setChangeError(e instanceof Error ? e.message : "Could not reach server");
    } finally {
      setChangingUrl(false);
    }
  }

  return (
    <SidebarFooter className="border-t border-border px-2 h-16 justify-center">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <AccountAvatar />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {auth.user ? auth.user.email : "Your account"}
                  </span>
                  <span className="flex items-center gap-1 truncate text-xs text-sidebar-foreground/70">
                    {isLocal ? (
                      <HardDrive className="size-3 shrink-0" />
                    ) : (
                      <Globe className="size-3 shrink-0" />
                    )}
                    {activeLabel}
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
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>

              {workspaces.map((ws) => (
                <div key={ws.id} className="group relative flex items-center">
                  <DropdownMenuItem
                    onSelect={() => onWorkspaceSelect(ws.id)}
                    className="flex-1 gap-2 pr-7"
                  >
                    {ws.type === "local" ? (
                      <HardDrive className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Globe className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate">{ws.name}</span>
                    {ws.id === activeWorkspaceId && (
                      <Check className="size-4 shrink-0" />
                    )}
                  </DropdownMenuItem>
                  <button
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      setMenuOpen(false);
                      openActionMenu(ws);
                    }}
                    aria-label={`Options for ${ws.name}`}
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </div>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={openCreate} className="gap-2">
                <Plus className="size-4 shrink-0" />
                New workspace
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={() => setSettingsOpen(true)} className="gap-2">
                <Settings className="size-4 shrink-0" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!auth.user}
                onSelect={() => auth.logout()}
                className="gap-2"
              >
                <LogOut className="size-4 shrink-0" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SettingsPanel
        ai={ai}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        hideTrigger
        auth={auth}
      />

      {/* ── New workspace dialog ── */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && closeCreate()}>
        <DialogContent className="sm:max-w-sm">
          {createStep === "type" && (
            <>
              <DialogHeader>
                <DialogTitle>New workspace</DialogTitle>
                <DialogDescription>Choose a workspace type.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 py-2">
                <button
                  onClick={() => setCreateStep("local")}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent transition-colors"
                >
                  <HardDrive className="size-6 text-muted-foreground" />
                  <span className="text-xs font-medium">Local</span>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">
                    This device only
                  </span>
                </button>
                <button
                  onClick={() => setCreateStep("remote")}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent transition-colors"
                >
                  <Globe className="size-6 text-muted-foreground" />
                  <span className="text-xs font-medium">New remote</span>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">
                    Create on server
                  </span>
                </button>
                <button
                  onClick={() => { setCreateStep("join"); setJoinUrl(""); setJoinList([]); setJoinError(""); }}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent transition-colors"
                >
                  <Users className="size-6 text-muted-foreground" />
                  <span className="text-xs font-medium">Join</span>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">
                    Existing workspace
                  </span>
                </button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeCreate}>
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}

          {createStep === "local" && (
            <>
              <DialogHeader>
                <DialogTitle>New local workspace</DialogTitle>
                <DialogDescription>Stored on this device only.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                <Label htmlFor="ws-name-local">Name</Label>
                <Input
                  id="ws-name-local"
                  placeholder="My workspace"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateLocal()}
                  autoFocus
                />
              </div>
              {createError && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" /> {createError}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateStep("type")}>
                  Back
                </Button>
                <Button
                  onClick={handleCreateLocal}
                  disabled={!newName.trim() || creating}
                >
                  {creating ? <Loader2 className="size-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </>
          )}

          {createStep === "remote" && (
            <>
              <DialogHeader>
                <DialogTitle>New remote workspace</DialogTitle>
                <DialogDescription>
                  A healthcheck runs before the workspace is created.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="ws-name-remote">Name</Label>
                  <Input
                    id="ws-name-remote"
                    placeholder="My workspace"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ws-url">Server URL</Label>
                  <Input
                    id="ws-url"
                    placeholder="https://my-server.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateRemote()}
                  />
                </div>
              </div>
              {createError && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" /> {createError}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateStep("type")}>
                  Back
                </Button>
                <Button
                  onClick={handleCreateRemote}
                  disabled={!newName.trim() || !newUrl.trim() || creating}
                >
                  {creating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Connect & create"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
          {createStep === "join" && (
            <>
              <DialogHeader>
                <DialogTitle>Join existing workspace</DialogTitle>
                <DialogDescription>
                  Enter a server URL to browse its workspaces.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://my-server.com"
                    value={joinUrl}
                    onChange={(e) => { setJoinUrl(e.target.value); setJoinList([]); setJoinError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinSearch()}
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    onClick={handleJoinSearch}
                    disabled={!joinUrl.trim() || joinLoading}
                  >
                    {joinLoading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
                {joinError && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3" /> {joinError}
                  </p>
                )}
                {joinList.length > 0 && (
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-lg border border-border p-1">
                    {joinList.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => handleJoinSelect(ws)}
                        disabled={joining === ws.id}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
                      >
                        <Globe className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{ws.name}</span>
                        {joining === ws.id && <Loader2 className="size-3 animate-spin" />}
                      </button>
                    ))}
                  </div>
                )}
                {!joinLoading && joinList.length === 0 && joinUrl && !joinError && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No workspaces found. Try searching.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateStep("type")}>Back</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Workspace action dialog (three-dots) ── */}
      <Dialog open={!!actionWs} onOpenChange={(o) => !o && setActionWs(null)}>
        <DialogContent className="sm:max-w-sm">
          {actionView === "menu" && actionWs && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {actionWs.type === "local" ? (
                    <HardDrive className="size-4" />
                  ) : (
                    <Globe className="size-4" />
                  )}
                  {actionWs.name}
                </DialogTitle>
                <DialogDescription>
                  {actionWs.type === "remote"
                    ? actionWs.url ?? "No server URL set"
                    : "Local workspace"}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 py-2">
                {actionWs.type === "remote" && (
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => setActionView("changeUrl")}
                  >
                    <Link className="size-4" />
                    Change server URL
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deletingWs}
                >
                  {deletingWs ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Remove workspace
                </Button>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setActionWs(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}

          {actionView === "changeUrl" && actionWs && (
            <>
              <DialogHeader>
                <DialogTitle>Change server URL</DialogTitle>
                <DialogDescription>
                  A healthcheck runs before saving. Current: {actionWs.url ?? "none"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                <Label htmlFor="change-url">Server URL</Label>
                <Input
                  id="change-url"
                  placeholder="https://my-server.com"
                  value={changeUrl}
                  onChange={(e) => setChangeUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangeUrl()}
                  autoFocus
                />
              </div>
              {changeError && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" /> {changeError}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setActionView("menu")}>
                  Back
                </Button>
                <Button
                  onClick={handleChangeUrl}
                  disabled={!changeUrl.trim() || changingUrl}
                >
                  {changingUrl ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarFooter>
  );
}
