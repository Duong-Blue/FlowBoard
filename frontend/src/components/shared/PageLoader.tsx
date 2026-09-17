import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PageLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string
}

export function PageLoader({ text, className, ...props }: PageLoaderProps) {
  return (
    <div 
      className={cn("flex flex-col items-center justify-center p-4", className)} 
      {...props}
    >
      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      {text && <p className="mt-2 text-sm font-medium text-slate-500">{text}</p>}
    </div>
  )
}
