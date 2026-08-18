import { getManualRateLimitInfo } from "../lib/rateLimits/utils";

function createManualRateLimit(actionsPerInterval: number, endedAt: Date): DbUserRateLimit {
  return {
    _id: "rate-limit-id",
    schemaVersion: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    legacyData: null,
    userId: "user-id",
    type: "allPosts",
    intervalUnit: "weeks",
    intervalLength: 1,
    actionsPerInterval,
    endedAt,
  };
}

describe("getManualRateLimitInfo", () => {
  it("blocks zero actions until the manual rate limit ends", () => {
    const endedAt = new Date("2030-02-01T00:00:00.000Z");
    const rateLimit = createManualRateLimit(0, endedAt);

    const rateLimitInfo = getManualRateLimitInfo(rateLimit, []);

    expect(rateLimitInfo?.nextEligible).toEqual(endedAt);
  });

  it("allows the first action under a positive rate limit", () => {
    const rateLimit = createManualRateLimit(1, new Date("2030-02-01T00:00:00.000Z"));

    expect(getManualRateLimitInfo(rateLimit, [])).toBeNull();
  });
});
