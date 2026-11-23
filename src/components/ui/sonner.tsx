"use client"

import {
  Alert02Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  Loading03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { Icon } from "@/components/Icon"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <Icon icon={Tick02Icon} />,
        info: <Icon icon={InformationCircleIcon} />,
        warning: <Icon icon={Alert02Icon} />,
        error: <Icon icon={AlertCircleIcon} />,
        loading: <Icon icon={Loading03Icon} className="animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "!shadow-menu font-sans text-sm",
          actionButton: "!bg-transparent !text-brand font-medium",
        },
      }}
      style={
        {
          "--normal-bg": "var(--pad)",
          "--normal-text": "var(--text)",
          "--normal-border": "var(--border)",
          "--border-radius": "14px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
