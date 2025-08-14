
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  variant?: 'card' | 'text' | 'avatar' | 'button' | 'table'
  lines?: number
}

export const LoadingSkeleton = ({ 
  className, 
  variant = 'card',
  lines = 3 
}: LoadingSkeletonProps) => {
  const baseClasses = "animate-pulse bg-muted rounded"
  
  if (variant === 'card') {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        <div className={`${baseClasses} h-4 w-3/4`} />
        <div className={`${baseClasses} h-4 w-1/2`} />
        <div className={`${baseClasses} h-24 w-full`} />
      </div>
    )
  }
  
  if (variant === 'text') {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className={`${baseClasses} h-4`}
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    )
  }
  
  if (variant === 'avatar') {
    return (
      <div className={cn(`${baseClasses} w-10 h-10 rounded-full`, className)} />
    )
  }
  
  if (variant === 'button') {
    return (
      <div className={cn(`${baseClasses} h-10 w-24`, className)} />
    )
  }
  
  if (variant === 'table') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className={`${baseClasses} h-8 w-full`} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className={`${baseClasses} h-6 w-1/4`} />
            <div className={`${baseClasses} h-6 w-1/3`} />
            <div className={`${baseClasses} h-6 w-1/4`} />
            <div className={`${baseClasses} h-6 w-1/6`} />
          </div>
        ))}
      </div>
    )
  }
  
  return <div className={cn(baseClasses, className)} />
}

export const EventCardSkeleton = () => (
  <div className="border rounded-lg p-6 space-y-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded w-48" />
        <div className="h-4 bg-muted rounded w-32" />
      </div>
      <div className="h-6 bg-muted rounded w-16" />
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-3/4" />
    </div>
    <div className="flex justify-between items-center pt-4">
      <div className="h-4 bg-muted rounded w-24" />
      <div className="h-10 bg-muted rounded w-32" />
    </div>
  </div>
)

export const PatientCardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-5 bg-muted rounded w-40" />
        <div className="h-4 bg-muted rounded w-32" />
      </div>
      <div className="h-8 bg-muted rounded w-20" />
    </div>
    <div className="space-y-1">
      <div className="h-3 bg-muted rounded w-28" />
      <div className="h-3 bg-muted rounded w-36" />
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-2 animate-pulse">
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-8 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LoadingSkeleton variant="card" className="h-64" />
      <LoadingSkeleton variant="card" className="h-64" />
    </div>
  </div>
)
