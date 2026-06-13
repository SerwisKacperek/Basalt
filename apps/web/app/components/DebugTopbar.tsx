import { Link, useLocation } from "react-router";
import { Button } from "@basalt/ui";

const navLinks = [
  { to: "/test", label: "Test" },
  { to: "/example", label: "Example" },
  { to: "/editor", label: "Editor" },
];

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

        <Button variant="outline" size="sm" asChild>
          <Link to="/debug">Go to debug home</Link>
        </Button>
      </div>
    </header>
  );
}
