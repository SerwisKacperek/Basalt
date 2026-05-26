import { useState } from "react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
} from "@basalt/ui";

export function Example() {
  const [count, setCount] = useState(0);
  const [email, setEmail] = useState("");

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">shadcn/ui Example</h1>
          <p className="text-muted-foreground mt-1">
            Components from <code className="text-sm font-mono">@basalt/ui</code>.
          </p>
        </div>

        <Separator />

        {/* Badges */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Badge</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        <Separator />

        {/* Buttons */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Button</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <Separator />

        {/* Card with form */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Card + Input + Label</h2>
          <Card>
            <CardHeader>
              <CardTitle>Subscribe</CardTitle>
              <CardDescription>Enter your email to get updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setEmail("")}>Clear</Button>
              <Button disabled={!email}>Subscribe</Button>
            </CardFooter>
          </Card>
        </section>

        <Separator />

        {/* Interactive counter */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Interactive counter</h2>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setCount((c) => c - 1)}>−</Button>
            <span className="text-2xl font-mono w-10 text-center">{count}</span>
            <Button variant="outline" size="icon" onClick={() => setCount((c) => c + 1)}>+</Button>
            <Button variant="ghost" size="sm" onClick={() => setCount(0)}>Reset</Button>
          </div>
        </section>

        <Separator />

        <Button variant="ghost" asChild>
          <a href="/">← Back to home</a>
        </Button>
      </div>
    </main>
  );
}
