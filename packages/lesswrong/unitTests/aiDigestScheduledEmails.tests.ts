import {
  AI_DIGEST_SEND_DUE_SLACK_MS,
  aiDigestSendDueBefore,
  isAiDigestSendDue,
} from "@/server/aiDigest/aiDigestScheduledEmails";

const NOW = new Date("2026-07-17T12:00:00.000Z");
const HOUR_MS = 60 * 60 * 1_000;

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - (hours * HOUR_MS));
}

function isDue(lastScheduledIssueAt: Date | null, cadenceDays = 2): boolean {
  return isAiDigestSendDue({ lastScheduledIssueAt, cadenceDays, now: NOW });
}

describe("AI digest scheduled send due check", () => {
  it("puts the cutoff a slack window ahead of the full cadence", () => {
    expect(aiDigestSendDueBefore(NOW, 2)).toEqual(hoursAgo(48 - (AI_DIGEST_SEND_DUE_SLACK_MS / HOUR_MS)));
  });

  it("treats a reader who has never had a scheduled issue as due", () => {
    expect(isDue(null)).toBe(true);
  });

  it("sends slightly early rather than letting the hourly cron stretch the cadence", () => {
    expect(isDue(hoursAgo(47))).toBe(true);
    expect(isDue(aiDigestSendDueBefore(NOW, 2))).toBe(true);
    expect(isDue(hoursAgo(45))).toBe(false);
  });

  it("holds a reader back until the cadence has nearly elapsed", () => {
    expect(isDue(hoursAgo(1))).toBe(false);
    expect(isDue(NOW)).toBe(false);
  });

  it("respects a longer configured cadence", () => {
    expect(isDue(hoursAgo(120), 7)).toBe(false);
    expect(isDue(hoursAgo(167), 7)).toBe(true);
  });

  it("floors a misconfigured cadence at one day", () => {
    expect(isDue(hoursAgo(21), 0)).toBe(false);
    expect(isDue(hoursAgo(23), 0)).toBe(true);
    expect(isDue(hoursAgo(23), -5)).toBe(true);
  });
});
