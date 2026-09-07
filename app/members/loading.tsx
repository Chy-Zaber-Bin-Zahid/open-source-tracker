/**
 * Covers the whole /members subtree, so it shows for the member list *and* for
 * a member page reached from outside the section — Next renders the outermost
 * new boundary, not the nested one. Deliberately neutral for that reason: the
 * nested app/members/[login]/loading.tsx handles the in-section case, where the
 * exact profile shape is known.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-8 pt-11" role="status" aria-busy aria-label="Loading">
      <div className="flex flex-col gap-3">
        <span className="skeleton h-3 w-20" />
        <span className="skeleton h-11 w-[min(360px,75vw)]" />
        <span className="skeleton h-4 w-[min(480px,85vw)]" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <span className="skeleton h-[280px] rounded-card" />
        <span className="skeleton h-[280px] rounded-card" />
      </div>
    </div>
  );
}
