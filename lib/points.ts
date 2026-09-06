export const CONTRIBUTION_TYPES = ["pr_merged", "pr_closed", "pr_opened", "review", "issue"] as const;
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

/**
 * Scoring rule: only merged pull requests earn points. Reviews, issues and pending PRs are
 * tracked and shown for context but score nothing. Closed-without-merge PRs drop off.
 */
export const POINTS: Record<ContributionType, number> = {
  pr_merged: 10,
  pr_closed: 0,
  review: 0,
  issue: 0,
  pr_opened: 0,
};

export const TYPE_LABEL: Record<ContributionType, string> = {
  pr_merged: "Merged PR",
  pr_closed: "Closed PR",
  pr_opened: "Pending PR",
  review: "Review",
  issue: "Issue",
};

export const TYPE_VERB: Record<ContributionType, string> = {
  pr_merged: "merged",
  pr_closed: "closed without merging",
  pr_opened: "opened (pending)",
  review: "reviewed",
  issue: "filed issue",
};

export function isContributionType(value: unknown): value is ContributionType {
  return typeof value === "string" && (CONTRIBUTION_TYPES as readonly string[]).includes(value);
}

export const SCORING_SUMMARY = "Ordered by merged pull requests · pending, issues and reviews are tracked only";
