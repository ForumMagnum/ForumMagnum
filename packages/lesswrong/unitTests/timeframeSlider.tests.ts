import {
  dayMs,
  defaultTimeframeView,
  keyboardTimeframeView,
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
  calendarBands,
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


it("uses years, months, and days as the visible scale gets smaller", () => {
  expect(calendarBands(scale, 640)[0].unit).toBe("year");
  expect(calendarBands({originMs: Date.UTC(2024, 0, 1), nowMs: Date.UTC(2025, 0, 1)}, 640)[0].unit).toBe("month");
  expect(calendarBands({originMs: Date.UTC(2024, 1, 25), nowMs: Date.UTC(2024, 2, 5)}, 640)[0].unit).toBe("day");
});

it("clips calendar months at the viewport and respects leap years", () => {
  const view = {originMs: Date.UTC(2024, 0, 15), nowMs: Date.UTC(2024, 3, 15)};
  const bands = calendarBands(view, 640);
  expect(bands.map(band => band.label)).toEqual(["Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024"]);
  expect(bands[0].fraction).toBe(0);
  expect(bands[bands.length - 1].endFraction).toBe(1);
  expect(bands[1].endFraction - bands[1].fraction).toBeCloseTo(29 / 91);
  expect(bands.map(band => band.alternate)).toEqual([false, true, false, true]);
});

it("includes leap day and preserves alternating day colors across a month boundary", () => {
  const bands = calendarBands({originMs: Date.UTC(2024, 1, 28), nowMs: Date.UTC(2024, 2, 2)}, 640);
  expect(bands.map(band => band.label)).toEqual(["28 Feb", "29 Feb", "1 Mar"]);
  expect(bands[0].alternate).not.toBe(bands[1].alternate);
  expect(bands[1].alternate).not.toBe(bands[2].alternate);
});

it("reduces detail on narrow tracks and skips labels that would overlap", () => {
  const view = {originMs: Date.UTC(2024, 0, 1), nowMs: Date.UTC(2024, 1, 1)};
  expect(calendarBands(view, 640)[0].unit).toBe("day");
  expect(calendarBands(view, 280)[0].unit).toBe("month");
  const labeled = calendarBands(view, 640).filter(band => band.showLabel);
  for (let i = 1; i < labeled.length; i++) {
    expect((labeled[i].fraction - labeled[i - 1].fraction) * 640).toBeGreaterThanOrEqual(48);
  }
  expect(calendarBands({originMs: 0, nowMs: 0}, 640)).toEqual([]);
});


it("defaults to the last six calendar years, bounded by the archive", () => {
  expect(defaultTimeframeView(scale)).toEqual({originMs: Date.UTC(2020, 8, 10, 12), nowMs: scale.nowMs});
  const short = {originMs: Date.UTC(2025, 0, 1), nowMs: scale.nowMs};
  expect(defaultTimeframeView(short)).toEqual(short);
});

it("pans the viewport without changing its span and clamps at archive boundaries", () => {
  const view = defaultTimeframeView(scale);
  const left = keyboardTimeframeView(view, scale, "ArrowLeft", true, false)!;
  expect(left.originMs).toBeLessThan(view.originMs);
  expect(left.nowMs - left.originMs).toBe(view.nowMs - view.originMs);
  expect(keyboardTimeframeView(view, scale, "ArrowRight", true, false)).toEqual(view);
  let oldest = left;
  for (let i = 0; i < 100; i++) oldest = keyboardTimeframeView(oldest, scale, "ArrowLeft", true, false)!;
  expect(oldest.originMs).toBe(scale.originMs);
});

it("zooms within the archive and stops at a one-day viewport", () => {
  const view = defaultTimeframeView(scale);
  const zoomed = keyboardTimeframeView(view, scale, "ArrowRight", false, true)!;
  expect(zoomed.nowMs - zoomed.originMs).toBeLessThan(view.nowMs - view.originMs);
  expect(keyboardTimeframeView(view, scale, "ArrowLeft", false, true)!.originMs).toBeLessThan(view.originMs);
  let smallest = zoomed;
  for (let i = 0; i < 100; i++) smallest = keyboardTimeframeView(smallest, scale, "ArrowUp", false, true)!;
  expect(smallest.nowMs - smallest.originMs).toBe(dayMs);
  expect(keyboardTimeframeView(scale, scale, "ArrowDown", false, true)).toEqual(scale);
  expect(keyboardTimeframeView(view, scale, "ArrowLeft", false, false)).toBeUndefined();
});
