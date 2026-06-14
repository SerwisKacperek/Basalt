import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Bug, X } from "lucide-react";
import { Button } from "@basalt/ui";

const navLinks = [
  { to: "/", label: "Main" },
  { to: "/test", label: "Test" },
  { to: "/example", label: "Example" },
  { to: "/editor", label: "Editor" },
];

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (!open) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Open debug panel"
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
      >
        <Bug size={16} />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-56 rounded-lg border border-border bg-sidebar p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Debug
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(false)}
          aria-label="Close debug panel"
          className="h-7 w-7"
        >
          <X size={16} />
        </Button>
      </div>

      <nav className="flex flex-col gap-1">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Button
              key={link.to}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              asChild
              className="justify-start"
            >
              <Link to={link.to}>{link.label}</Link>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
