/**
 * Shown while the board's queries run. Every page here is force-dynamic, so
 * this is what stands in for the real thing on a cold navigation. It mirrors
 * the dashboard's layout closely enough that nothing jumps when the data lands.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-8 pt-11" role="status" aria-busy aria-label="Loading the board">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="skeleton h-3 w-28" />
          <span className="skeleton h-12 w-[min(460px,80vw)]" />
          <span className="skeleton h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <span className="skeleton h-9 w-28 rounded-full" />
          <span className="skeleton h-9 w-28 rounded-full" />
          <span className="skeleton h-9 w-24 rounded-full" />
        </div>
      </div>

      {/* Podium: the middle card sits taller, like the real one. */}
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
        <span className="skeleton h-[210px] rounded-card" />
        <span className="skeleton h-[260px] rounded-card" />
        <span className="skeleton h-[210px] rounded-card" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <span className="skeleton h-[96px] rounded-2xl" />
            <span className="skeleton h-[96px] rounded-2xl" />
            <span className="skeleton h-[96px] rounded-2xl" />
          </div>
          <span className="skeleton h-[300px] rounded-card" />
        </div>
        <span className="skeleton h-[420px] rounded-card" />
      </div>
    </div>
  );
}
