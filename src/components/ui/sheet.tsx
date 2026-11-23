"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Icon } from "@/components/Icon"
import { Dialog as SheetPrimitive } from "radix-ui"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  onSwipeClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  /** Left sheets only: a leftward touch swipe past the threshold closes the sheet. Vertical scrolling is untouched. */
  onSwipeClose?: () => void
}) {
  const swipe = useSwipeToClose(side === "left" ? onSwipeClose : undefined)
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        aria-modal="true"
        className={cn(
          "fixed z-50 flex flex-col gap-4 border-border bg-pad shadow-overlay transition duration-200 ease-soft data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-200",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
          side === "left" &&
            "inset-y-0 left-0 h-dvh w-[min(86vw,20rem)] max-w-none touch-pan-y [&_.overflow-y-auto]:touch-pan-y border-r pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          swipe.onPointerDown(event)
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event)
          swipe.onPointerMove(event)
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event)
          swipe.onPointerUp(event)
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event)
          swipe.onPointerCancel(event)
        }}
        onClickCapture={(event) => {
          onClickCapture?.(event)
          if (swipe.consumeClick()) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
            <Icon icon={Cancel01Icon} />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

/**
 * Touch swipe to close. The sheet follows the finger only once the gesture is clearly horizontal (leftward), so a
 * vertical scroll of the list never moves the sheet. Past 30% of its width, or on a quick flick, it closes; otherwise it
 * springs back. The close runs from the current position and skips Radix's exit animation, which would jump back.
 */
function useSwipeToClose(onClose: (() => void) | undefined) {
  const drag = React.useRef<{
    pointer: number
    x0: number
    y0: number
    x: number
    t: number
    axis: "pending" | "x" | "none"
    el: HTMLElement
  } | null>(null)
  const suppressClick = React.useRef(false)

  const release = (el: HTMLElement, pointer: number) => {
    try {
      if (el.hasPointerCapture(pointer)) el.releasePointerCapture(pointer)
    } catch {}
  }

  const settle = (el: HTMLElement, closing: boolean) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (closing) {
      el.style.animation = "none"
      el.style.transition = reduce ? "none" : "transform 160ms cubic-bezier(0.4, 0, 1, 1)"
      el.style.transform = "translateX(-100%)"
      window.setTimeout(() => onClose?.(), reduce ? 0 : 160)
      return
    }
    el.style.transition = reduce ? "none" : "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)"
    el.style.transform = "translateX(0px)"
    window.setTimeout(() => {
      el.style.transition = ""
      el.style.transform = ""
    }, reduce ? 0 : 200)
  }

  return {
    onPointerDown(event: React.PointerEvent<HTMLElement>) {
      suppressClick.current = false
      if (!onClose || event.pointerType === "mouse" || !event.isPrimary) return
      // Capture from the start, so the browser never takes the gesture for a native pan before we decide it's ours.
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {}
      drag.current = {
        pointer: event.pointerId,
        x0: event.clientX,
        y0: event.clientY,
        x: event.clientX,
        t: event.timeStamp,
        axis: "pending",
        el: event.currentTarget,
      }
    },
    onPointerMove(event: React.PointerEvent<HTMLElement>) {
      const d = drag.current
      if (!d || d.pointer !== event.pointerId) return
      const dx = event.clientX - d.x0
      const dy = event.clientY - d.y0
      if (d.axis === "pending") {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (dx < 0 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          d.axis = "x"
          d.el.style.transition = "none"
        } else {
          // Vertical or rightward: not ours. Release and let the browser scroll.
          release(d.el, event.pointerId)
          drag.current = null
          return
        }
      }
      d.x = event.clientX
      d.t = event.timeStamp
      d.el.style.transform = `translateX(${Math.min(0, dx)}px)`
    },
    onPointerUp(event: React.PointerEvent<HTMLElement>) {
      const d = drag.current
      drag.current = null
      if (d) release(d.el, event.pointerId)
      if (!d || d.pointer !== event.pointerId || d.axis !== "x") return
      const offset = Math.min(0, event.clientX - d.x0)
      const velocity = (event.clientX - d.x) / Math.max(1, event.timeStamp - d.t)
      const closing = -offset > d.el.offsetWidth * 0.3 || (velocity < -0.5 && offset < -16)
      suppressClick.current = true
      window.setTimeout(() => {
        suppressClick.current = false
      }, 300)
      settle(d.el, closing)
    },
    onPointerCancel(event: React.PointerEvent<HTMLElement>) {
      const d = drag.current
      drag.current = null
      if (d) release(d.el, event.pointerId)
      if (d && d.pointer === event.pointerId && d.axis === "x") settle(d.el, false)
    },
    consumeClick(): boolean {
      const was = suppressClick.current
      suppressClick.current = false
      return was
    },
  }
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
