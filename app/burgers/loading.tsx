/** Stands in for the burger page while its query runs: header, three tiles, two lists. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-8 pt-11" role="status" aria-busy aria-label="Loading burger parties">
      <div className="flex flex-col gap-3">
        <span className="skeleton h-3 w-20" />
        <span className="skeleton h-12 w-[min(380px,80vw)]" />
        <span className="skeleton h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <span className="skeleton h-[96px] rounded-2xl" />
        <span className="skeleton h-[96px] rounded-2xl" />
        <span className="skeleton h-[96px] rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <span className="skeleton h-[420px] rounded-card" />
        <span className="skeleton h-[260px] rounded-card" />
      </div>
    </div>
  );
}
