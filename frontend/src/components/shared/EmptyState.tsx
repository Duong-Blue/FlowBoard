import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className,
  ...props 
}: EmptyStateProps) {
  return (
    <div 
      className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-8 text-center", className)}
      {...props}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 mb-4">
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
