import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Bug } from "lucide-react";
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <>
          <div className="fixed inset-0" onMouseDown={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 min-w-44 py-1 rounded-md bg-sidebar border border-primary shadow-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-1 duration-100">
            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              Debug
            </div>
            <div className="my-1 border-t border-primary/50" />
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-colors cursor-pointer
                    ${isActive
                      ? "bg-primary/15 text-text font-medium"
                      : "text-text/80 hover:bg-primary/10 hover:text-text"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close debug panel" : "Open debug panel"}
        className="rounded-full shadow-lg"
      >
        <Bug size={16} />
      </Button>
    </div>
  );
}
