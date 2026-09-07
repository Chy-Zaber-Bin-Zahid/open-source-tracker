/** Matches a member page: back link, profile header, then the two columns. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-8 pt-11" role="status" aria-busy aria-label="Loading member">
      <span className="skeleton h-4 w-32" />

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-5">
          <span className="skeleton h-20 w-20 rounded-[24px]" />
          <div className="flex flex-col gap-2">
            <span className="skeleton h-10 w-56" />
            <span className="skeleton h-4 w-40" />
          </div>
        </div>
        <span className="skeleton h-14 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col gap-6">
          <span className="skeleton h-[300px] rounded-card" />
          <span className="skeleton h-[200px] rounded-card" />
        </div>
        <div className="flex flex-col gap-6">
          <span className="skeleton h-[220px] rounded-card" />
          <span className="skeleton h-[260px] rounded-card" />
        </div>
      </div>
    </div>
  );
}
