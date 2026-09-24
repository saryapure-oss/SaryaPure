export function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products" className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card animate-pulse overflow-hidden">
          <div className="aspect-square bg-beige-200" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-beige-200" />
            <div className="h-4 w-3/4 rounded bg-beige-200" />
            <div className="h-4 w-1/2 rounded bg-beige-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
