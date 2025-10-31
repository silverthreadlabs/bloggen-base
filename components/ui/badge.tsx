import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-alert-solid/20 dark:aria-invalid:ring-alert-solid/40 aria-invalid:border-alert-border transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-solid text-primary-on-primary [a&]:hover:bg-primary-solid-hover",
        secondary:
          "border-transparent bg-secondary-bg text-secondary-text-contrast [a&]:hover:bg-secondary-bg-hover",
        destructive:
          "border-transparent bg-alert-solid text-white [a&]:hover:bg-alert-solid-hover focus-visible:ring-alert-solid/20 dark:focus-visible:ring-alert-solid/40 dark:bg-alert-solid/60",
        outline:
          "text-canvas-text-contrast border-canvas-border [a&]:hover:bg-secondary-bg-hover [a&]:hover:text-secondary-text-contrast",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
