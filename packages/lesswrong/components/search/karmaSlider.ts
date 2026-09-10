import type { SearchKarmaRange } from "@/lib/search/searchFilters";

/** Slider stops. The first and last stop mean "no bound" on that side. */
export const karmaStops = [-100, 0, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

export function karmaRangeFromStops(minStop: number, maxStop: number): SearchKarmaRange {
  const range: SearchKarmaRange = {};
  if (minStop > 0) range.min = karmaStops[minStop];
  if (maxStop < karmaStops.length - 1) range.max = karmaStops[maxStop];
  return range;
}

function nearestStop(value: number): number {
  let best = 0;
  for (let index = 1; index < karmaStops.length; index++) {
    if (Math.abs(karmaStops[index] - value) < Math.abs(karmaStops[best] - value)) best = index;
  }
  return best;
}

export function stopsFromKarmaRange(range: SearchKarmaRange): [number, number] {
  const minStop = range.min === undefined ? 0 : nearestStop(range.min);
  const maxStop = range.max === undefined ? karmaStops.length - 1 : nearestStop(range.max);
  return [Math.min(minStop, maxStop), Math.max(minStop, maxStop)];
}

export function formatKarmaRange(range: SearchKarmaRange): string {
  if (range.min === undefined && range.max === undefined) return "Any karma";
  if (range.min !== undefined && range.max !== undefined) return `Karma ${range.min} – ${range.max}`;
  if (range.min !== undefined) return `Karma ≥ ${range.min}`;
  return `Karma ≤ ${range.max}`;
}

/** Keep an exact edited bound and move the opposite bound if necessary. Empty input opens that side. */
export function karmaRangeWithBound(range: SearchKarmaRange, bound: "min" | "max", raw: string): SearchKarmaRange {
  const number = raw === "" ? undefined : Number(raw);
  if (number !== undefined && !Number.isSafeInteger(number)) return range;
  if (bound === "min") {
    return {...range, min: number, max: number !== undefined && range.max !== undefined && number > range.max ? number : range.max};
  }
  return {...range, max: number, min: number !== undefined && range.min !== undefined && number < range.min ? number : range.min};
}
