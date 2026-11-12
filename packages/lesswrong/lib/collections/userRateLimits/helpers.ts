interface UserRateLimitValidationInput {
  actionsPerInterval: number | null;
  intervalLength: number | null;
  endedAt?: Date | null;
  liftAtAverageKarma?: number | null;
  liftAverageKarmaCount?: number | null;
}

/** Active manual limits include explicit restrictions without a scheduled expiry. */
export function getActiveUserRateLimitSelector() {
  return { $or: [{ endedAt: { $gt: new Date() } }, { endedAt: null }] };
}

/** Validate expiry/karma-lift limits and the existing explicit zero-action block. */
export function validateUserRateLimit(limit: UserRateLimitValidationInput) {
  if (limit.actionsPerInterval === null || !Number.isInteger(limit.actionsPerInterval) || limit.actionsPerInterval < 0) {
    throw new Error('Actions per interval must be a non-negative integer');
  }
  if (limit.intervalLength === null || !Number.isFinite(limit.intervalLength) || limit.intervalLength <= 0) {
    throw new Error('The rate-limit interval must be positive');
  }
  const hasKarma = limit.liftAtAverageKarma != null;
  const hasCount = limit.liftAverageKarmaCount != null;
  if (hasKarma !== hasCount || (hasKarma && (!Number.isFinite(limit.liftAtAverageKarma) || !Number.isInteger(limit.liftAverageKarmaCount) || (limit.liftAverageKarmaCount ?? 0) < 1))) {
    throw new Error('Karma lift requires a finite karma threshold and a positive integer content count');
  }
  if (limit.endedAt && !Number.isFinite(new Date(limit.endedAt).getTime())) {
    throw new Error('The rate-limit expiry must be a valid date');
  }
  // Zero-action limits are an existing explicit block; without an expiry they remain blocked.
  if (!limit.endedAt && !hasKarma && limit.actionsPerInterval !== 0) {
    throw new Error('A rate limit needs an expiry or a karma-lift condition');
  }
}
