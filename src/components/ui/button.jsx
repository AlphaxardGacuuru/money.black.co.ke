import * as React from "react"
import { forwardRef } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const btnVariants = cva(
  "inline-flex items-center justify-center min-h-[36px] rounded-3xl text-white border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all duration-700 ease-out group font-light font-nunito text-base capitalize disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default: "bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10",
        destructive:
          "bg-destructive/5 backdrop-blur-md border-destructive/10 text-white hover:bg-destructive/10",
        outline:
          "border backdrop-blur-md bg-white/5 border-white/20 hover:bg-white/10",
        secondary:
          "bg-secondary/5 backdrop-blur-md border-secondary/10 text-secondary-foreground hover:bg-secondary/10",
        ghost:
          "bg-transparent backdrop-blur-md hover:bg-white/10 border-transparent",
        link: "text-white underline-offset-4 hover:underline backdrop-blur-md border-transparent",
        glass:
          "bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 hover:border-white/30",
      },
      size: {
        default: "p-1 px-5",
        sm: "p-0.5 px-3",
        lg: "p-2 px-8",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Btn = forwardRef(({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  text,
  icon,
  iconFront,
  loading,
  children,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"

  // If text, icon, or loading props are used, render custom button style
  const hasCustomProps = text || icon || iconFront || loading

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={loading || props.disabled}
      className={cn(btnVariants({ variant, size, className }))}
      {...props}>
      {/* Loading Spinner */}
      {loading && (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}

      {/* Icon */}
      {!loading && icon && <span className="text-inherit">{icon}</span>}

      {/* Text or Children */}
      {text ? (
        <span className="mx-2 text-inherit font-light font-nunito text-nowrap">{text}</span>
      ) : (
        children
      )}

      {/* Icon Front */}
      {!loading && iconFront && (
        <span className="text-inherit">{iconFront}</span>
      )}
    </Comp>
  )
})

Btn.displayName = "Btn"

export { Btn, btnVariants }
export default Btn
