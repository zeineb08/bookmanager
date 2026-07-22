export function BookCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="skeleton h-48 w-full mb-4" />
      <div className="skeleton h-4 w-3/4 mb-2" />
      <div className="skeleton h-3 w-1/2 mb-3" />
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-8 w-full mt-4" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="skeleton h-4 w-1/2 mb-3" />
      <div className="skeleton h-8 w-1/3" />
    </div>
  );
}
