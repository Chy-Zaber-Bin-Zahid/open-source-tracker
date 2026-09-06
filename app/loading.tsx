/** Shown while a page's queries run. Mirrors the dashboard's shape so the
 *  layout does not jump when the real content arrives. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-8 pt-8 sm:pt-11" aria-busy role="status" aria-label="Loading">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="skeleton h-3 w-24" />
          <span className="skeleton h-12 w-[min(420px,80vw)]" />
          <span className="skeleton h-4 w-52" />
        </div>
        <span className="skeleton h-9 w-64 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="skeleton h-[168px] rounded-card" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <span key={i} className="skeleton h-[92px] rounded-2xl" />
            ))}
          </div>
          <span className="skeleton h-[320px] rounded-card" />
        </div>
        <span className="skeleton h-[320px] rounded-card" />
      </div>
    </div>
  );
}
