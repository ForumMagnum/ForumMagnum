import type { RateLimitUser } from "./types";

export function totalKarmaBelow(user: RateLimitUser, threshold: number): boolean {
  return user.exemptFromTotalKarmaAutoRateLimits !== true && user.karma < threshold;
}

/** When exempt from total-karma auto limits, treat karma as high for threshold branches (e.g. downvoter counts). */
export function karmaForDownvoterThresholdBranch(user: RateLimitUser): number {
  return user.exemptFromTotalKarmaAutoRateLimits === true ? Infinity : user.karma;
}
