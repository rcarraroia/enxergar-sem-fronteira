
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy loading para componentes pesados
export const LazyEventForm = lazy(() => import('@/components/admin/EventForm'))
export const LazyRegistrationsList = lazy(() => import('@/components/admin/RegistrationsList'))
export const LazySystemHealthCard = lazy(() => import('@/components/admin/SystemHealthCard'))
export const LazySystemLogsCard = lazy(() => import('@/components/admin/SystemLogsCard'))

// Wrapper com loading skeleton
interface LazyWrapperProps {
  children: React.ReactNode
  height?: string
}

export const LazyWrapper = ({ children, height = "h-48" }: LazyWrapperProps) => (
  <Suspense fallback={
    <div className={`w-full ${height} p-4`}>
      <Skeleton className="h-full w-full" />
    </div>
  }>
    {children}
  </Suspense>
)

// Loading skeletons específicos
export const EventFormSkeleton = () => (
  <div className="space-y-6 p-6">
    <Skeleton className="h-8 w-48" />
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="flex space-x-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
)

export const RegistrationsListSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-32" />
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  </div>
)
