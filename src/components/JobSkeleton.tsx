export function JobSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-base-300 rounded w-3/4 mb-4"></div>
        <div className="flex gap-4 mb-4">
          <div className="h-4 bg-base-300 rounded w-32"></div>
          <div className="h-4 bg-base-300 rounded w-24"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-base-300 rounded w-32"></div>
          <div className="h-10 bg-base-300 rounded w-24"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="h-4 bg-base-300 rounded w-full"></div>
          <div className="h-4 bg-base-300 rounded w-5/6"></div>
          <div className="h-4 bg-base-300 rounded w-4/6"></div>
          <div className="h-4 bg-base-300 rounded w-full"></div>
          <div className="h-4 bg-base-300 rounded w-3/4"></div>
        </div>

        <div className="xl:col-span-2">
          <div className="sticky top-8 space-y-4">
            <div className="h-32 bg-base-300 rounded"></div>
            <div className="h-24 bg-base-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
