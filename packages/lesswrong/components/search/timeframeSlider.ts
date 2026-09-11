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

export interface CalendarBand {
  startMs: number;
  unit: "year" | "month" | "day";
  fraction: number;
  endFraction: number;
  label: string;
  alternate: boolean;
  showLabel: boolean;
}

/** Calendar-aligned UTC bands, with detail and label spacing based on track width. */
export function calendarBands(scale: TimeframeScale, width: number): CalendarBand[] {
  const span = scale.nowMs - scale.originMs;
  if (span <= 0 || width <= 0) return [];
  const pixelsPerDay = width * dayMs / span;
  const unit = pixelsPerDay >= 12 ? "day" : pixelsPerDay * 28 >= 32 ? "month" : "year";
  const first = new Date(scale.originMs);
  let startMs = unit === "day" ? startOfDay(scale.originMs)
    : Date.UTC(first.getUTCFullYear(), unit === "month" ? first.getUTCMonth() : 0, 1);
  const bands: CalendarBand[] = [];
  let lastLabelX = -Infinity;
  const labelWidth = unit === "month" ? 64 : 48;
  while (startMs < scale.nowMs) {
    const date = new Date(startMs);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const endMs = unit === "day" ? startMs + dayMs : Date.UTC(year + (unit === "year" ? 1 : 0), unit === "month" ? month + 1 : 0, 1);
    const fraction = msToFraction(startMs, scale);
    const endFraction = msToFraction(endMs, scale);
    const x = fraction * width;
    const showLabel = x - lastLabelX >= labelWidth && width - x >= labelWidth;
    if (showLabel) lastLabelX = x;
    bands.push({
      startMs, unit, fraction, endFraction, showLabel,
      label: unit === "year" ? String(year) : unit === "month" ? `${monthNames[month]} ${year}` : `${date.getUTCDate()} ${monthNames[month]}`,
      alternate: (unit === "day" ? Math.floor(startMs / dayMs) : unit === "month" ? month : year) % 2 !== 0,
    });
    startMs = endMs;
  }
  return bands;
}

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


/** The initial viewport is independent of the selected dates. */
export function defaultTimeframeView(scale: TimeframeScale): TimeframeScale {
  const start = new Date(scale.nowMs);
  start.setUTCFullYear(start.getUTCFullYear() - 6);
  return {originMs: Math.max(scale.originMs, start.getTime()), nowMs: scale.nowMs};
}

/** Shift pans by a tenth of the view; Ctrl zooms around its center. */
export function keyboardTimeframeView(
  view: TimeframeScale,
  bounds: TimeframeScale,
  key: string,
  shiftKey: boolean,
  ctrlKey: boolean,
): TimeframeScale | undefined {
  const direction = key === "ArrowRight" || key === "ArrowUp" ? 1
    : key === "ArrowLeft" || key === "ArrowDown" ? -1 : undefined;
  if (direction === undefined || (!shiftKey && !ctrlKey)) return undefined;
  return moveTimeframeView(view, bounds, direction * 0.1, ctrlKey ? (direction > 0 ? 0.8 : 1.25) : 1);
}

/** Wheel distances are pixels; scale movement to the visible track width. */
export function wheelTimeframeView(view: TimeframeScale, bounds: TimeframeScale, deltaPixels: number, width: number, ctrlKey: boolean): TimeframeScale {
  const distance = deltaPixels / Math.max(1, width);
  return moveTimeframeView(view, bounds, distance, ctrlKey ? Math.exp(-distance) : 1);
}

function moveTimeframeView(view: TimeframeScale, bounds: TimeframeScale, panFraction: number, zoomFactor: number): TimeframeScale {
  const span = view.nowMs - view.originMs;
  const fullSpan = bounds.nowMs - bounds.originMs;
  const nextSpan = Math.min(fullSpan, Math.max(dayMs, span * zoomFactor));
  const start = zoomFactor !== 1 ? view.originMs + (span - nextSpan) / 2 : view.originMs + panFraction * span;
  const originMs = Math.max(bounds.originMs, Math.min(bounds.nowMs - nextSpan, start));
  return {originMs, nowMs: originMs + nextSpan};
}
