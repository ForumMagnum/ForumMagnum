import {
  getSeasonalOpenThreadInfo,
  getSeasonalOpenThreadTitle,
  OPEN_THREAD_BODY_MARKDOWN,
} from "@/lib/seasonalOpenThread";

describe("seasonal open thread helpers", () => {
  it("returns no thread info for non-scheduled dates", () => {
    expect(getSeasonalOpenThreadInfo(new Date(Date.UTC(2026, 5, 5)))).toBeNull();
    expect(getSeasonalOpenThreadInfo(new Date(Date.UTC(2026, 4, 1)))).toBeNull();
  });

  it("builds spring, summer, and autumn titles on the first day of each season", () => {
    expect(getSeasonalOpenThreadInfo(new Date(Date.UTC(2026, 2, 1)))?.title).toBe("Open Thread Spring 2026");
    expect(getSeasonalOpenThreadInfo(new Date(Date.UTC(2026, 5, 1)))?.title).toBe("Open Thread Summer 2026");
    expect(getSeasonalOpenThreadInfo(new Date(Date.UTC(2026, 8, 1)))?.title).toBe("Open Thread Autumn 2026");
  });

  it("formats winter titles with the cross-year suffix", () => {
    expect(getSeasonalOpenThreadTitle("Winter", 2025)).toBe("Open Thread Winter 2025/26");
    expect(getSeasonalOpenThreadInfo(new Date(Date.UTC(2026, 11, 1)))?.title).toBe("Open Thread Winter 2026/27");
  });

  it("uses midnight UTC as the intended run time", () => {
    const info = getSeasonalOpenThreadInfo(new Date(Date.UTC(2026, 2, 1, 22, 30)));

    expect(info?.intendedAt.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("contains the standard open thread body links", () => {
    expect(OPEN_THREAD_BODY_MARKDOWN).toContain("If it's worth saying");
    expect(OPEN_THREAD_BODY_MARKDOWN).toContain("[Highlights from the Sequences](/highlights)");
    expect(OPEN_THREAD_BODY_MARKDOWN).toContain("The Open Thread sequence is [here](/s/yai5mppkuCHPQmzpN)");
  });
});
