import React from "react";
import * as Icons from "lucide-react";
import { cn } from "../../lib/utils";

interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: keyof typeof Icons;
  size?: number | string;
  strokeWidth?: number;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      name,
      size = 24,
      strokeWidth = 2,
      className,
      ...props
    },
    ref
  ) => {
    const IconComponent = Icons[name] as React.ComponentType<{
      size?: number | string;
      strokeWidth?: number;
      className?: string;
      ref?: React.Ref<SVGSVGElement>;
    }>;

    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in lucide-react`);
      return null;
    }

    return (
      <IconComponent
        ref={ref}
        size={size}
        strokeWidth={strokeWidth}
        className={cn("inline-block", className)}
        {...props}
      />
    );
  }
);

Icon.displayName = "Icon";
