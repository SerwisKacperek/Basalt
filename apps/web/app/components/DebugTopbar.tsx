import { Link, useLocation } from "react-router";
import { Button } from "@basalt/ui";
import { useSyncStatus } from "~/features/editor/useSyncStatus";
import type { ConnectionStatus } from "~/features/editor/useSyncStatus";

const navLinks = [
  { to: "/", label: "Root" },
  { to: "/main", label: "Main" },
  { to: "/test", label: "Test" },
  { to: "/example", label: "Example" },
  { to: "/editor", label: "Editor" },
];

const statusConfig: Record<
  "no-backend" | ConnectionStatus,
  { label: string; className: string }
> = {
  "no-backend": {
    label: "No sync",
    className:
      "border-gray-300/80 bg-gray-100/80 text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400",
  },
  idle: {
    label: "Idle",
    className:
      "border-gray-300/80 bg-gray-100/80 text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400",
  },
  connecting: {
    label: "Connecting…",
    className:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
  connected: {
    label: "Connected",
    className:
      "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/60 dark:text-green-300",
  },
  error: {
    label: "Sync error",
    className:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/60 dark:text-red-300",
  },
};

function SyncChip() {
  const { status, error, isBackendConfigured } = useSyncStatus();
  const key = !isBackendConfigured ? "no-backend" : status;
  const { label, className } = statusConfig[key];

  return (
    <div className="relative group">
      <div
        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
      >
        {label}
      </div>
      {error && (
        <div className="absolute left-0 top-full mt-1.5 z-50 hidden group-hover:block w-64 rounded-md border border-red-200 bg-white p-2.5 shadow-lg dark:border-red-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
            WebSocket closed (code {error.code})
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 break-words">
            {error.reason}
          </p>
        </div>
      )}
    </div>
  );
}

export function DebugTopbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-gray-300/80 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-600 shadow-sm shadow-gray-900/5 dark:border-gray-700 dark:bg-slate-950/95 dark:text-gray-200">
            Debug
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Button
                  key={link.to}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link to={link.to}>{link.label}</Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <SyncChip />
          <Button variant="outline" size="sm" asChild>
            <Link to="/debug">Go to debug home</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
