import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface SemanticBadgeProps extends React.ComponentPropsWithoutRef<typeof Badge> {
  status?: "active" | "archived" | "pending" | "owner" | "admin" | "member" | "guest" | string
}

export function SemanticBadge({ status, className, ...props }: SemanticBadgeProps) {
  let colorClass = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50"

  switch (status?.toLowerCase()) {
    case "active":
    case "owner":
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
      break
    case "pending":
    case "admin":
      colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"
      break
    case "archived":
    case "guest":
      colorClass = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50"
      break
    case "member":
      colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50"
      break
    case "destructive":
    case "danger":
      colorClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50"
      break
    default:
      break
  }

  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium shadow-sm", colorClass, className)} 
      {...props} 
    />
  )
}
