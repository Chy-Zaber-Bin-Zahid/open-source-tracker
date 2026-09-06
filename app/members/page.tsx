import { MembersManager } from "@/components/MembersManager";
import { getMembers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();
  return (
    <div className="flex flex-col gap-8 pt-11">
      <div className="flex flex-col gap-2">
        <span className="eyebrow !text-lime">Members</span>
        <h1 className="text-[40px] font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-[48px]">Team members</h1>
        <p className="max-w-xl text-[15px] text-ink-muted">
          Add a teammate by GitHub username. Their public pull requests, reviews and issues get pulled in on the next sync.
        </p>
      </div>
      <MembersManager
        initial={members}
        orgName={
          process.env.REQUIRED_ORG?.split(",")
            .map((org) => org.trim())
            .filter(Boolean)
            .join(", ") || null
        }
      />
    </div>
  );
}
