import type { SearchDateRange } from "@/lib/search/searchFilters";

export const dayMs = 24 * 60 * 60 * 1000;

/** The horizontal track spans the search origin (left) to now (right). */
export interface TimeframeScale {
  originMs: number;
  nowMs: number;
}

export interface YearTick {
  year: number;
  fraction: number;
}

export type TimeframePreset = "day" | "week" | "month" | "year";

function clampFraction(fraction: number): number {
  return Math.min(1, Math.max(0, fraction));
}

export function positionToMs(fraction: number, scale: TimeframeScale): number {
  return scale.originMs + (clampFraction(fraction) * (scale.nowMs - scale.originMs));
}

export function msToFraction(ms: number, scale: TimeframeScale): number {
  return clampFraction((ms - scale.originMs) / (scale.nowMs - scale.originMs));
}

export function yearTicks(scale: TimeframeScale): YearTick[] {
  const ticks: YearTick[] = [];
  const firstYear = new Date(scale.originMs).getUTCFullYear() + 1;
  const lastYear = new Date(scale.nowMs).getUTCFullYear();
  for (let year = firstYear; year <= lastYear; year++) {
    const ms = Date.UTC(year, 0, 1);
    if (ms >= scale.originMs && ms <= scale.nowMs) ticks.push({year, fraction: msToFraction(ms, scale)});
  }
  return ticks;
}

function startOfDay(ms: number): number {
  return Math.floor(ms / dayMs) * dayMs;
}

function endOfDay(ms: number): number {
  return (startOfDay(ms) + dayMs) - 1;
}

/** A drag between two track positions selects whole UTC days, in either direction. */
export function dragToRange(anchorFraction: number, currentFraction: number, scale: TimeframeScale): SearchDateRange {
  const a = positionToMs(anchorFraction, scale);
  const b = positionToMs(currentFraction, scale);
  return {start: startOfDay(Math.min(a, b)), end: endOfDay(Math.max(a, b))};
}

/** Moves a closed range by a track distance, keeping its length, inside the scale. */
export function shiftRange(range: Required<SearchDateRange>, deltaFraction: number, scale: TimeframeScale): Required<SearchDateRange> {
  const length = range.end - range.start;
  const deltaMs = deltaFraction * (scale.nowMs - scale.originMs);
  const deltaDays = Math.round(deltaMs / dayMs);
  const maxStart = (startOfDay(scale.nowMs) - length) + (dayMs - 1);
  const start = Math.min(Math.max(range.start + (deltaDays * dayMs), scale.originMs), Math.max(scale.originMs, maxStart));
  return {start, end: start + length};
}

export function presetDateRange(preset: TimeframePreset, nowMs: number): SearchDateRange {
  const now = new Date(nowMs);
  switch (preset) {
    case "day": return {start: nowMs - dayMs};
    case "week": return {start: nowMs - (7 * dayMs)};
    case "month": return {start: Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes())};
    case "year": return {start: Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes())};
  }
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(ms: number): string {
  const date = new Date(ms);
  return `${date.getUTCDate()} ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDateRange(range: SearchDateRange): string {
  if (range.start === undefined && range.end === undefined) return "All time";
  if (range.start !== undefined && range.end !== undefined) return `${formatDay(range.start)} – ${formatDay(range.end)}`;
  if (range.start !== undefined) return `Since ${formatDay(range.start)}`;
  return `Until ${formatDay(range.end!)}`;
}

/** Reject dates such as February 30 instead of allowing Date.parse to roll them over. */
export function parseIsoDay(value: string | undefined): number | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms : undefined;
}

export type TimeframeEndpoint = "start" | "end";

export function resizeRange(range: SearchDateRange, endpoint: TimeframeEndpoint, ms: number, scale: TimeframeScale): SearchDateRange {
  const bounded = Math.max(scale.originMs, Math.min(scale.nowMs, ms));
  if (endpoint === "start") return {...range, start: Math.min(startOfDay(bounded), startOfDay(range.end ?? scale.nowMs))};
  return {...range, end: Math.max(endOfDay(bounded), endOfDay(range.start ?? scale.originMs))};
}

export function keyboardRange(range: SearchDateRange, endpoint: TimeframeEndpoint, key: string, scale: TimeframeScale): SearchDateRange | undefined {
  const current = range[endpoint] ?? (endpoint === "start" ? scale.originMs : scale.nowMs);
  const steps: Record<string, number> = {ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -30, PageUp: 30};
  const days = steps[key];
  const ms = key === "Home" ? scale.originMs : key === "End" ? scale.nowMs : days !== undefined ? current + (days * dayMs) : undefined;
  return ms === undefined ? undefined : resizeRange(range, endpoint, ms, scale);
}

/** Keep dates from older archives or pasted URLs accessible in the overview. */
export function overviewScale(scale: TimeframeScale, range: SearchDateRange): TimeframeScale {
  return {
    originMs: startOfDay(Math.min(scale.originMs, range.start ?? scale.originMs, range.end ?? scale.originMs)),
    nowMs: endOfDay(Math.max(scale.nowMs, range.start ?? scale.nowMs, range.end ?? scale.nowMs)),
  };
}

export function zoomToRange(range: SearchDateRange, scale: TimeframeScale): TimeframeScale {
  const start = range.start ?? scale.originMs;
  const end = range.end ?? scale.nowMs;
  const padding = Math.max(7 * dayMs, (end - start) * 0.15);
  return {originMs: Math.max(scale.originMs, startOfDay(start - padding)), nowMs: Math.min(scale.nowMs, endOfDay(end + padding))};
}
