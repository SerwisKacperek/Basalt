import { cn } from "../../lib/utils";

interface TestComponentProps {
  title: string;
  description?: string;
  className?: string;
}

export function TestComponent({ title, description, className }: TestComponentProps) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm p-6", className)}>
      <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
