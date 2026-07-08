export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 animate-pulse">
      <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded" />
    </div>
  )
}
