'use client'

export function TopicCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1">
          <div className="skeleton h-4 w-32 mb-2" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="skeleton h-6 w-3/4 mb-3" />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-2/3 mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="skeleton h-4 w-12" />
          <div className="skeleton h-4 w-12" />
        </div>
        <div className="skeleton h-4 w-20" />
      </div>
    </div>
  )
}

export function TopicFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <TopicCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}

export function CommentSectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8">
        <div className="flex items-start gap-6">
          <div className="skeleton w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-4 w-32" />
            <div className="flex gap-6 pt-4">
              <div className="skeleton h-8 w-20" />
              <div className="skeleton h-8 w-20" />
              <div className="skeleton h-8 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AnimeCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="p-4">
        <div className="skeleton h-5 w-3/4 mb-2" />
        <div className="skeleton h-4 w-1/2 mb-3" />
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

export function AnimeGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  )
}
