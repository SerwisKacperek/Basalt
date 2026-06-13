import { Outlet, isRouteErrorResponse, useRouteError } from "react-router";
import { ThemeProvider } from "@basalt/ui";
import { DebugTopbar } from "~/components/DebugTopbar";
import { useServices } from "~/services/ServiceContext"; 
import "./app.css";

export default function Root() {
  const { storage } = useServices();

  return (
    <ThemeProvider defaultTheme="theme-green" storageKey="app_preferences" storage={storage}>
      <div className="min-h-screen bg-background text-slate-950 dark:text-white">
        <DebugTopbar />
        <main>
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (error instanceof Error) {
    details = error.message;
    stack = error.stack;
  } else if (error != null) {
    details = String(error);
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}