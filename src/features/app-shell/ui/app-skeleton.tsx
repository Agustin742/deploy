const block = "animate-pulse rounded-card bg-soft motion-reduce:animate-none";

/** Placeholder shown while the session or the saved data load (replaces a bare "Cargando…"). */
export function AppSkeleton({ withHeader = false }: { withHeader?: boolean }) {
  return (
    <div role="status" aria-label="Cargando" className={withHeader ? "mx-auto max-w-[1180px] px-4" : undefined}>
      {withHeader ? <div className="-mx-4 mb-6 h-16 border-b border-line" /> : null}
      <div className={`${block} mb-6 h-9 w-56`} />
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-28`} />
        ))}
      </div>
      <div className={`${block} mt-4 h-56`} />
    </div>
  );
}
