/** Silhouettes affichées pendant le chargement du fil (à la place d'un simple rond qui tourne). */
export function PostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/[0.08] bg-surface" aria-hidden="true">
      <div className="relative aspect-[4/5] animate-pulse bg-white/[0.04]">
        <div className="absolute left-4 top-4 flex items-center gap-3 sm:left-5 sm:top-5">
          <div className="h-10 w-10 rounded-full bg-white/[0.08]" />
          <div className="space-y-2">
            <div className="h-3 w-32 rounded bg-white/[0.08]" />
            <div className="h-2.5 w-20 rounded bg-white/[0.06]" />
          </div>
        </div>
        <div className="absolute bottom-6 left-4 right-20 space-y-2.5 sm:left-5">
          <div className="h-6 w-3/4 rounded bg-white/[0.08]" />
          <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
        </div>
        <div className="absolute bottom-6 right-4 grid gap-3">
          {[0, 1, 2].map(i => <div key={i} className="h-11 w-11 rounded-full bg-white/[0.07]" />)}
        </div>
      </div>
    </div>
  )
}

export default function FeedSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Chargement du fil">
      {Array.from({ length: count }, (_, i) => <PostCardSkeleton key={i} />)}
    </div>
  )
}

/** Lignes de classement en cours de chargement. */
export function TrendRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="py-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-2.5">
          <div className="h-3 w-4 rounded bg-white/[0.06]" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-white/[0.08]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </li>
      ))}
    </ul>
  )
}
