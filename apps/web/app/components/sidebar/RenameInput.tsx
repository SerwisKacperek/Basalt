import { useRef, useState } from "react";
import { Input } from "@basalt/ui";

/** Inline text field for renaming a note or folder. Commits on Enter/blur. */
export function RenameInput({
  initial,
  onSubmit,
  onCancel,
  onValueChange,
  className,
}: {
  initial: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const [value, setValue] = useState(initial);
  // Guard so Enter (which blurs) doesn't also fire the blur handler.
  const doneRef = useRef(false);

  const finish = (commit: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (commit) onSubmit(value);
    else onCancel();
  };

  return (
    <Input
      autoFocus
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onValueChange?.(e.target.value);
      }}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
        }
      }}
      className={className ?? "h-7 px-2 text-sm"}
    />
  );
}
