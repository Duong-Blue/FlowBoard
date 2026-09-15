import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface SemanticBadgeProps extends React.ComponentPropsWithoutRef<typeof Badge> {
  status?: "active" | "archived" | "pending" | "owner" | "admin" | "member" | "guest" | string
}

export function SemanticBadge({ status, className, ...props }: SemanticBadgeProps) {
  let colorClass = "bg-slate-50 text-slate-700 border-slate-200"

  switch (status?.toLowerCase()) {
    case "active":
    case "owner":
      colorClass = "bg-green-50 text-green-700 border-green-200"
      break
    case "pending":
    case "admin":
      colorClass = "bg-amber-50 text-amber-700 border-amber-200"
      break
    case "archived":
    case "guest":
      colorClass = "bg-slate-100 text-slate-600 border-slate-200"
      break
    case "member":
      colorClass = "bg-blue-50 text-blue-700 border-blue-200"
      break
    default:
      break
  }

  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium shadow-sm transition-none hover:bg-transparent", colorClass, className)} 
      {...props} 
    />
  )
}
