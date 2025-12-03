import { type CronJobSpec } from "@/server/cron/cronUtil";
import { getAllPostgresViews } from "../postgresView";

export const allCronJobs: (CronJobSpec|null)[] = [
  ...getAllPostgresViews().map((view) => view.getCronJob()),
];
