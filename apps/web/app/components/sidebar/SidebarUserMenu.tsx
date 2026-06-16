import { useState } from "react";
import { User, ChevronsUpDown, LogOut, Settings } from "lucide-react";
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
} from "@basalt/ui";
import { useServices } from "~/services/ServiceContext";
import { SettingsPanel } from "~/components/SettingsPanel";

function AccountAvatar() {
  return (
    <Avatar className="size-8 rounded-lg border border-primary/40">
      <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
        <User className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}

/** Avatar + account name/subtitle, shared by the trigger and the dropdown label. */
function AccountInfo({ subtitleClassName }: { subtitleClassName: string }) {
  return (
    <>
      <AccountAvatar />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">Your account</span>
        <span className={`truncate text-xs ${subtitleClassName}`}>Local workspace</span>
      </div>
    </>
  );
}

/** Footer account menu with the settings dialog. */
export function SidebarUserMenu() {
  const { ai } = useServices();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SidebarFooter className="border-t border-border px-2 h-16 justify-center">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <AccountInfo subtitleClassName="text-sidebar-foreground/70" />
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
                  <AccountInfo subtitleClassName="text-muted-foreground" />
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
        ai={ai}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        hideTrigger
      />
    </SidebarFooter>
  );
}
