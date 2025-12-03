import { type CronJobSpec } from "@/server/cron/cronUtil";
import { getAllPostgresViews } from "../postgresView";
import { reviewVoteTotalsCronJob } from "./reviewVoteTotalsCron";

export const allCronJobs: (CronJobSpec|null)[] = [
  ...getAllPostgresViews().map((view) => view.getCronJob()),
  reviewVoteTotalsCronJob,
];
