import { Link } from "react-router";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from "@basalt/ui";

const debugPages = [
  {
    to: "/test",
    title: "Test page",
    description: "Run diagnostics and inspect the app health service.",
  },
  {
    to: "/example",
    title: "shadcn example",
    description: "View UI components and example variants from @basalt/ui.",
  },
  {
    to: "/editor",
    title: "Editor list",
    description: "Open the editor flow and pick a sample document.",
  },
];

export function DebugPage() {
  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Debug center
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
            Dedykowana strona debug
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Tutaj znajdziesz spis podstron testowych aplikacji.
          </p>
        </section>

        <Separator />

        <div className="grid gap-4 lg:grid-cols-3">
          {debugPages.map((page) => (
            <Card key={page.to} className="group border border-gray-200/70 dark:border-gray-700/80">
              <CardHeader>
                <CardTitle>{page.title}</CardTitle>
                <CardDescription>{page.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Przejdź do strony, aby przetestować działanie i sprawdzić komponenty.
                </p>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button asChild>
                  <Link to={page.to}>Otwórz</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
