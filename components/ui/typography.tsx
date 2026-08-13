import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const typographyVariants = cva("text-foreground", {
  variants: {
    variant: {
      display: "text-display",
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
      bodyLg: "text-body-lg",
      body: "text-body",
      caption: "text-caption",
      label: "text-label",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement | HTMLSpanElement>,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, as, ...props }, ref) => {
    // Map variants to default semantic HTML tags
    const Comp =
      as ||
      (variant === "display"
        ? "h1"
        : variant === "h1"
        ? "h1"
        : variant === "h2"
        ? "h2"
        : variant === "h3"
        ? "h3"
        : variant === "label"
        ? "label"
        : variant === "caption"
        ? "span"
        : "p");

    return (
      <Comp
        className={cn(typographyVariants({ variant, className }))}
        ref={ref as any}
        {...props}
      />
    );
  }
);
Typography.displayName = "Typography";
