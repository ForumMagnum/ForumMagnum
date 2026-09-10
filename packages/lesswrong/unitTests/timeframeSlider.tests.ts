import {
  dayMs,
  keyboardRange,
  overviewScale,
  zoomToRange,
  parseIsoDay,
  dragToRange,
  formatDateRange,
  msToFraction,
  positionToMs,
  presetDateRange,
  shiftRange,
  yearTicks,
} from "../components/search/timeframeSlider";

const scale = {originMs: Date.UTC(2014, 5, 1), nowMs: Date.UTC(2026, 8, 10, 12)};

it("maps fractions to milliseconds linearly and clamps to the scale", () => {
  expect(positionToMs(0, scale)).toBe(scale.originMs);
  expect(positionToMs(1, scale)).toBe(scale.nowMs);
  expect(positionToMs(-1, scale)).toBe(scale.originMs);
  expect(positionToMs(2, scale)).toBe(scale.nowMs);
  expect(msToFraction(positionToMs(0.25, scale), scale)).toBeCloseTo(0.25);
});

it("places a tick at each January the first inside the scale", () => {
  const ticks = yearTicks(scale);
  expect(ticks[0]).toEqual({year: 2015, fraction: msToFraction(Date.UTC(2015, 0, 1), scale)});
  expect(ticks[ticks.length - 1].year).toBe(2026);
  expect(ticks).toHaveLength(12);
});

it("turns a drag into a whole-day range regardless of drag direction", () => {
  const a = msToFraction(Date.UTC(2020, 0, 15, 13), scale);
  const b = msToFraction(Date.UTC(2020, 2, 1, 2), scale);
  const expected = {start: Date.UTC(2020, 0, 15), end: Date.UTC(2020, 2, 2) - 1};
  expect(dragToRange(a, b, scale)).toEqual(expected);
  expect(dragToRange(b, a, scale)).toEqual(expected);
  expect(dragToRange(a, a, scale)).toEqual({start: Date.UTC(2020, 0, 15), end: Date.UTC(2020, 0, 16) - 1});
});

it("shifts a range as a whole and stops at the edges of the scale", () => {
  const range = {start: Date.UTC(2020, 0, 1), end: Date.UTC(2020, 0, 11) - 1};
  const shifted = shiftRange(range, msToFraction(scale.originMs + (5 * dayMs), scale), scale);
  expect(shifted).toEqual({start: Date.UTC(2020, 0, 6), end: Date.UTC(2020, 0, 16) - 1});
  const atStart = shiftRange(range, -1, scale);
  expect(atStart.start).toBe(scale.originMs);
  expect(atStart.end).toBe((scale.originMs + (10 * dayMs)) - 1);
});

it("builds presets relative to now and formats ranges for people", () => {
  expect(presetDateRange("week", scale.nowMs)).toEqual({start: scale.nowMs - (7 * dayMs)});
  expect(presetDateRange("day", scale.nowMs)).toEqual({start: scale.nowMs - dayMs});
  expect(formatDateRange({})).toBe("All time");
  expect(formatDateRange({start: Date.UTC(2020, 0, 15), end: Date.UTC(2020, 2, 2) - 1})).toBe("15 Jan 2020 – 1 Mar 2020");
  expect(formatDateRange({start: Date.UTC(2020, 0, 15)})).toBe("Since 15 Jan 2020");
  expect(formatDateRange({end: Date.UTC(2020, 2, 2) - 1})).toBe("Until 1 Mar 2020");
});


it("keeps keyboard endpoints ordered and makes older selected dates visible", () => {
  const range = {start: Date.UTC(2008, 0, 1), end: Date.UTC(2008, 0, 31)};
  const overview = overviewScale(scale, range);
  expect(overview.originMs).toBe(range.start);
  expect(keyboardRange(range, "start", "End", overview)?.start).toBe(range.end);
  expect(keyboardRange(range, "end", "Home", overview)?.end).toBe(range.start + dayMs - 1);
  expect(zoomToRange(range, overview).nowMs - zoomToRange(range, overview).originMs).toBeLessThan(60 * dayMs);
  expect(parseIsoDay("2024-02-30")).toBeUndefined();
});
