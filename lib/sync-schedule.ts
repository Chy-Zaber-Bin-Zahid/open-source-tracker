/**
 * The tracker syncs itself overnight, so nobody has to remember to press the
 * button. Both schedulers (the compose `sync` service and the Vercel cron in
 * vercel.json) are pinned to this hour in APP_TZ; keep all three in step.
 */
export const SYNC_HOUR_LOCAL = 2;

export const SYNC_SCHEDULE_LABEL = "auto-syncs nightly at 2:00 AM";
