import { contentForYouRateLimitFromGenerations } from "@/server/resolvers/contentForYouResolvers";

const NOW = new Date("2026-09-05T12:00:00.000Z");
const HOUR_MS = 60 * 60 * 1000;

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - (minutes * 60 * 1000));
}

describe("Content for You generation rate limit", () => {
  it("leaves the reader free to generate while under the hourly limit", () => {
    const limit = contentForYouRateLimitFromGenerations([minutesAgo(5), minutesAgo(20), minutesAgo(50)], NOW);
    expect(limit.remainingThisHour).toBe(7);
    expect(limit.nextAllowedAt).toBeNull();
  });

  it("blocks the reader at the limit until the oldest counted generation ages out", () => {
    const times = Array.from({ length: 10 }, (_, index) => minutesAgo((index * 5) + 1));
    const limit = contentForYouRateLimitFromGenerations(times, NOW);
    expect(limit.remainingThisHour).toBe(0);
    expect(limit.nextAllowedAt).toEqual(new Date(minutesAgo(46).getTime() + HOUR_MS));
  });

  it("ignores generations older than the window", () => {
    const limit = contentForYouRateLimitFromGenerations([minutesAgo(61), minutesAgo(90)], NOW);
    expect(limit.remainingThisHour).toBe(10);
    expect(limit.nextAllowedAt).toBeNull();
  });

  it("counts only the newest generations when more than the limit fall in the window", () => {
    const times = Array.from({ length: 12 }, (_, index) => minutesAgo((index * 4) + 1));
    const limit = contentForYouRateLimitFromGenerations(times, NOW);
    expect(limit.remainingThisHour).toBe(0);
    // The tenth-newest generation was 37 minutes ago; a slot frees an hour after it.
    expect(limit.nextAllowedAt).toEqual(new Date(minutesAgo(37).getTime() + HOUR_MS));
  });
});
