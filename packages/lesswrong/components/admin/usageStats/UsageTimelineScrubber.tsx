"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "../../hooks/useStyles";
import {
  DAY_MS,
  isoToMs,
  msToIso,
  usageStatsRangeKey,
  utcTodayIso,
  type UsageStatsRange,
} from "./usageStatsRange";

/**
 * Timeline scrubber for the usage-stats dashboard's date range, ported from
 * the ai-2030 analytics dashboard: the whole scrubber domain laid out as a
 * horizontal track with a draggable selection window on it. Drag the window
 * to move it, pull either edge to resize, click empty track to jump the
 * window there, or press-and-drag empty track to draw a fresh range — always
 * capped at `maxDays`. Drags edit a local draft and only commit (→ refetch)
 * on release, so scrubbing never fires a query per mousemove. Once the
 * dashboard's background history sweep delivers daily pageviews, they paint
 * the track as a faint traffic graph, so the window is dragged over the
 * actual shape of the site's readership.
 */

const styles = defineStyles("UsageTimelineScrubber", (theme: ThemeType) => ({
  root: {
    userSelect: "none",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  labelsRow: {
    position: "relative",
    height: 20,
    fontSize: 11,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    color: theme.palette.primary.dark,
  },
  edgeLabel: {
    position: "absolute",
    transform: "translateX(-50%)",
    whiteSpace: "nowrap",
  },
  glide: {
    transition: "left 150ms ease-out, width 150ms ease-out",
  },
  hoverLabel: {
    position: "absolute",
    zIndex: 30,
    transform: "translateX(-50%)",
    whiteSpace: "nowrap",
    border: theme.palette.border.faint,
    background: theme.palette.background.paper,
    padding: "0 4px",
    fontWeight: 400,
    color: theme.palette.grey[600],
  },
  hoverLabelViews: {
    color: theme.palette.primary.dark,
  },
  track: {
    position: "relative",
    height: 44,
    border: theme.palette.border.normal,
    background: theme.palette.panelBackground.darken03,
    touchAction: "pan-y",
    cursor: "crosshair",
  },
  trackGrabbing: {
    cursor: "grabbing",
  },
  trackResizing: {
    cursor: "ew-resize",
  },
  tick: {
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    background: theme.palette.greyAlpha(0.08),
  },
  tickYear: {
    background: theme.palette.greyAlpha(0.2),
  },
  historySvg: {
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  historyArea: {
    fill: theme.palette.primary.main,
    fillOpacity: 0.15,
  },
  historyLine: {
    stroke: theme.palette.primary.main,
    strokeOpacity: 0.5,
    fill: "none",
  },
  hoverLine: {
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    background: theme.palette.primary.main,
    opacity: 0.4,
  },
  selectionWindow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 10,
    minWidth: 6,
    cursor: "grab",
    border: `1px solid ${theme.palette.primary.main}`,
    background: `${theme.palette.primary.main}26`,
    outline: "none",
    "&:hover": {
      background: `${theme.palette.primary.main}40`,
    },
    "&:focus-visible": {
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}80`,
    },
  },
  selectionWindowActive: {
    cursor: "grabbing",
    background: `${theme.palette.primary.main}40`,
  },
  spanBadgeWrapper: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spanBadge: {
    background: theme.palette.panelBackground.translucent2,
    padding: "0 4px",
    fontSize: 10,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    color: theme.palette.primary.dark,
  },
  edgeHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 20,
    display: "flex",
    width: 14,
    transform: "translateX(-50%)",
    cursor: "ew-resize",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
    touchAction: "pan-y",
    "&:focus-visible": {
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}80`,
    },
  },
  edgeHandleBar: {
    pointerEvents: "none",
    height: 20,
    width: 3,
    borderRadius: 999,
    background: theme.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.palette.background.paper}`,
  },
  tickLabelsRow: {
    position: "relative",
    height: 16,
    fontSize: 10,
    lineHeight: "16px",
    color: theme.palette.grey[500],
  },
  tickLabel: {
    position: "absolute",
    whiteSpace: "nowrap",
    paddingLeft: 2,
  },
  tickLabelYear: {
    fontWeight: 500,
    color: theme.palette.grey[600],
  },
  todayLabel: {
    position: "absolute",
    right: 0,
    fontWeight: 500,
    color: theme.palette.primary.dark,
  },
}));

const clamp = (value: number, lo: number, hi: number) =>
  Math.min(Math.max(value, lo), hi);

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const formatDateNoYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Inclusive day-index pair — the selection window. Every position is a day
 * INDEX from the domain start; index arithmetic runs on UTC milliseconds of
 * plain YYYY-MM-DD dates, so a DST shift can never make a day 23 or 25 hours
 * wide. */
interface Selection {
  start: number;
  end: number;
}

/** One in-flight pointer interaction. `aim` is a press on empty track that
 * hasn't revealed itself yet: release in place = click (jump the window),
 * move past the threshold = start drawing a new range from the anchor. */
type Gesture =
  | { kind: "move"; pointerId: number; grabOffset: number; span: number }
  | { kind: "resize-start"; pointerId: number; fixedEnd: number }
  | { kind: "resize-end"; pointerId: number; fixedStart: number }
  | { kind: "aim"; pointerId: number; anchor: number; downX: number }
  | { kind: "draw"; pointerId: number; anchor: number };

/** Pixels of movement that turn an `aim` press into a draw instead of a click. */
const DRAW_THRESHOLD_PX = 4;

/** Estimated half-widths (px) of the floating date labels, for clamping them
 * inside the card and deciding when the two edge labels must merge into one. */
const EDGE_LABEL_HALF = 40;
const MERGED_LABEL_HALF = 78;
const MERGE_BELOW_PX = 170;

export interface UsageHistoryPoint {
  date: string;
  views: number;
}

const UsageTimelineScrubber = ({
  domainStart,
  value,
  maxDays,
  onChange,
  history,
}: {
  /** First day the timeline offers, as an ISO date. */
  domainStart: string;
  value: UsageStatsRange;
  maxDays: number;
  onChange: (range: UsageStatsRange) => void;
  /** Daily pageview counts across the scrubber domain, drawn as an area graph
   * behind the track. Null until the dashboard's background history sweep
   * delivers its first chunk; may cover only part of the domain while chunks
   * stream in (the graph draws just the loaded span). */
  history: UsageHistoryPoint[] | null;
}) => {
  const classes = useStyles(styles);
  const todayIso = utcTodayIso();
  const todayMs = isoToMs(todayIso);
  const valueStartIso =
    value.kind === "days"
      ? msToIso(todayMs - ((value.days - 1) * DAY_MS))
      : value.start;
  const valueEndIso = value.kind === "days" ? todayIso : value.end;
  // Domain start → today, stretched left if a restored range predates the
  // domain so the window always fits on the track.
  const domainStartMs = Math.min(
    isoToMs(domainStart),
    isoToMs(valueStartIso),
    todayMs,
  );
  const totalDays = Math.round((todayMs - domainStartMs) / DAY_MS) + 1;
  const maxSpan = Math.min(maxDays, totalDays);

  const idxToIso = (idx: number) => msToIso(domainStartMs + (idx * DAY_MS));
  const isoToIdx = (iso: string) =>
    clamp(Math.round((isoToMs(iso) - domainStartMs) / DAY_MS), 0, totalDays - 1);

  const valueSel: Selection = {
    start: isoToIdx(valueStartIso),
    end: isoToIdx(valueEndIso),
  };

  // The in-progress selection while dragging or keyboard-nudging; null means
  // "show the committed value". lastDraftRef mirrors it so pointerup and the
  // debounced keyboard commit read the latest selection without a stale
  // closure.
  const [draft, setDraft] = useState<Selection | null>(null);
  const lastDraftRef = useRef<Selection | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const commitTimerRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // Day the pointer is hovering on empty track (drives the ghost line/date).
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  // Measured track width, for px-space label clamping and tick density.
  const [trackWidth, setTrackWidth] = useState(0);

  const shown = draft ?? valueSel;
  const spanDays = shown.end - shown.start + 1;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) =>
      setTrackWidth(entries[0].contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Any committed-value change (our own commit landing) or a domain shift
  // invalidates the draft's day indices.
  const valueKey = usageStatsRangeKey(value);
  useEffect(() => {
    setDraft(null);
    lastDraftRef.current = null;
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  }, [valueKey, domainStartMs]);

  useEffect(
    () => () => {
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
      }
    },
    [],
  );

  const dayAt = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const frac = (clientX - rect.left) / Math.max(1, rect.width);
    return clamp(Math.floor(frac * totalDays), 0, totalDays - 1);
  };

  const setDraftSel = (sel: Selection) => {
    lastDraftRef.current = sel;
    setDraft(sel);
  };

  // A window ending today is committed as trailing-days; anything else is a
  // fixed custom range. Same-range commits are dropped so a plain click that
  // lands where the window already is doesn't refetch everything.
  const commit = (sel: Selection) => {
    const span = sel.end - sel.start + 1;
    const next: UsageStatsRange =
      sel.end === totalDays - 1
        ? { kind: "days", days: span }
        : { kind: "custom", start: idxToIso(sel.start), end: idxToIso(sel.end) };
    setDraft(null);
    lastDraftRef.current = null;
    if (usageStatsRangeKey(next) !== usageStatsRangeKey(value)) onChange(next);
  };

  const beginGesture = (e: React.PointerEvent, gesture: Gesture) => {
    if (e.button !== 0 || gestureRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    // Capture on the track so every subsequent move/up lands on it, even when
    // the press started on a handle or the pointer leaves the card.
    trackRef.current?.setPointerCapture(e.pointerId);
    gestureRef.current = gesture;
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    setHoverIdx(null);
  };

  const handleTrackPointerMove = (e: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture) {
      const idx = dayAt(e.clientX);
      setHoverIdx(idx < shown.start || idx > shown.end ? idx : null);
      return;
    }
    if (e.pointerId !== gesture.pointerId) return;
    const idx = dayAt(e.clientX);

    let active: Gesture = gesture;
    if (gesture.kind === "aim") {
      if (Math.abs(e.clientX - gesture.downX) < DRAW_THRESHOLD_PX) return;
      active = {
        kind: "draw",
        pointerId: gesture.pointerId,
        anchor: gesture.anchor,
      };
      gestureRef.current = active;
    }
    if (active.kind === "draw") {
      setDraftSel(
        active.anchor <= idx
          ? {
              start: active.anchor,
              end: Math.min(idx, active.anchor + maxSpan - 1),
            }
          : {
              start: Math.max(idx, active.anchor - maxSpan + 1),
              end: active.anchor,
            },
      );
    } else if (active.kind === "move") {
      const start = clamp(idx - active.grabOffset, 0, totalDays - active.span);
      setDraftSel({ start, end: start + active.span - 1 });
    } else if (active.kind === "resize-start") {
      const start = clamp(
        idx,
        Math.max(0, active.fixedEnd - maxSpan + 1),
        active.fixedEnd,
      );
      setDraftSel({ start, end: active.fixedEnd });
    } else if (active.kind === "resize-end") {
      const end = clamp(
        idx,
        active.fixedStart,
        Math.min(totalDays - 1, active.fixedStart + maxSpan - 1),
      );
      setDraftSel({ start: active.fixedStart, end });
    }
  };

  const handleTrackPointerUp = (e: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    gestureRef.current = null;
    if (gesture.kind === "aim") {
      // Never became a draw → plain click: keep the span, center it on the
      // clicked day.
      const start = clamp(
        gesture.anchor - Math.floor(spanDays / 2),
        0,
        totalDays - spanDays,
      );
      commit({ start, end: start + spanDays - 1 });
    } else if (lastDraftRef.current) {
      commit(lastDraftRef.current);
    } else {
      setDraft(null);
    }
  };

  const abortGesture = () => {
    gestureRef.current = null;
    lastDraftRef.current = null;
    setDraft(null);
  };

  // Keyboard nudges edit the draft immediately but commit on a short debounce,
  // so tapping an arrow five times refetches once, not five times. ±Infinity
  // deltas (Home/End) clamp to the legal bound.
  const nudge = (which: "move" | "start" | "end", delta: number) => {
    const base = draft ?? valueSel;
    let sel: Selection;
    if (which === "move") {
      const span = base.end - base.start + 1;
      const start = clamp(base.start + delta, 0, totalDays - span);
      sel = { start, end: start + span - 1 };
    } else if (which === "start") {
      const start = clamp(
        base.start + delta,
        Math.max(0, base.end - maxSpan + 1),
        base.end,
      );
      sel = { start, end: base.end };
    } else {
      const end = clamp(
        base.end + delta,
        base.start,
        Math.min(totalDays - 1, base.start + maxSpan - 1),
      );
      sel = { start: base.start, end };
    }
    setDraftSel(sel);
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = window.setTimeout(() => {
      commitTimerRef.current = null;
      if (lastDraftRef.current) commit(lastDraftRef.current);
    }, 500);
  };

  const keyHandler =
    (which: "move" | "start" | "end") => (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 7 : 1;
      if (e.key === "ArrowLeft") nudge(which, -step);
      else if (e.key === "ArrowRight") nudge(which, step);
      else if (e.key === "Home") nudge(which, -Infinity);
      else if (e.key === "End") nudge(which, Infinity);
      else return;
      e.preventDefault();
    };

  // Month gridlines with year boundaries emphasized. Label density adapts to
  // the track width; Januaries label the year, other months the month name,
  // and the first label carries its year so short histories still say which
  // year they're in. Labels near the right edge yield to the "Today" cap.
  const ticks = useMemo(() => {
    const width = trackWidth || 800;
    const pxPerMonth = (width / totalDays) * 30.44;
    const stride = clamp(Math.ceil(56 / pxPerMonth), 1, 12);
    const first = new Date(domainStartMs);
    let year = first.getUTCFullYear();
    let month = first.getUTCMonth();
    if (first.getUTCDate() !== 1) {
      month += 1;
      if (month === 12) {
        month = 0;
        year += 1;
      }
    }
    const list: { iso: string; frac: number; isYear: boolean; label: string | null }[] = [];
    let labelledYet = false;
    for (;;) {
      const ms = Date.UTC(year, month, 1);
      if (ms > todayMs) break;
      const frac = (ms - domainStartMs) / DAY_MS / totalDays;
      const isYear = month === 0;
      let label: string | null = null;
      if (month % stride === 0 && frac * width < width - 48) {
        label = isYear
          ? String(year)
          : labelledYet
            ? MONTH_LABELS[month]
            : `${MONTH_LABELS[month]} ${year}`;
        labelledYet = true;
      }
      list.push({ iso: msToIso(ms), frac, isYear, label });
      month += 1;
      if (month === 12) {
        month = 0;
        year += 1;
      }
    }
    return list;
  }, [domainStartMs, todayMs, totalDays, trackWidth]);

  // The traffic graph behind the track: an SVG area over the loaded span of
  // history, in day-index space (viewBox width = totalDays, height = 100;
  // preserveAspectRatio="none" stretches it across the track). Missing days
  // inside the span draw as zero. Heights use a sqrt scale: traffic spikes
  // run far above steady-state traffic, and a linear scale would flatten
  // everything else into an unreadable sliver.
  const historyGraph = useMemo(() => {
    if (!history || history.length === 0) return null;
    const viewsByIdx = new Map<number, number>();
    for (const point of history) {
      const idx = Math.round((isoToMs(point.date) - domainStartMs) / DAY_MS);
      if (idx >= 0 && idx < totalDays) viewsByIdx.set(idx, point.views);
    }
    if (viewsByIdx.size === 0) return null;
    const indices = [...viewsByIdx.keys()];
    const first = Math.min(...indices);
    const last = Math.max(...indices);
    const max = Math.max(1, ...viewsByIdx.values());
    // 92 (not 100) so the tallest day keeps a sliver of headroom under the
    // track's top edge instead of touching it.
    const yAt = (views: number) => (100 - (Math.sqrt(views / max) * 92)).toFixed(1);
    const line = Array.from({ length: last - first + 1 }, (_, i) => {
      const idx = first + i;
      return `${i === 0 ? "M" : "L"} ${idx + 0.5} ${yAt(viewsByIdx.get(idx) ?? 0)}`;
    }).join(" ");
    return {
      line,
      area: `${line} L ${last + 0.5} 100 L ${first + 0.5} 100 Z`,
      viewsByIdx,
    };
  }, [history, domainStartMs, totalDays]);

  // ---------- px-space layout for the floating pieces ----------
  const width = trackWidth || 800;
  const startEdgePct = (shown.start / totalDays) * 100;
  const endEdgePct = ((shown.end + 1) / totalDays) * 100;
  const startEdgePx = (startEdgePct / 100) * width;
  const endEdgePx = (endEdgePct / 100) * width;
  const rectPx = endEdgePx - startEdgePx;

  const startIso = idxToIso(shown.start);
  const endIso = idxToIso(shown.end);
  const sameYear = startIso.slice(0, 4) === endIso.slice(0, 4);
  const mergedLabel = `${
    sameYear ? formatDateNoYear(startIso) : formatDate(startIso)
  } – ${formatDate(endIso)}`;
  const useMergedLabel = rectPx < MERGE_BELOW_PX;

  // Committed changes (click-jumps, keyboard commits) glide into place; live
  // drags track the pointer with no lag.
  const glide = !draft;

  // Pageviews on the hovered day, appended to the hover date label once the
  // history sweep has covered that day.
  const hoverViews =
    hoverIdx !== null ? historyGraph?.viewsByIdx.get(hoverIdx) : undefined;

  const gestureKind = gestureRef.current?.kind;

  return (
    <section role="group" aria-label="Date range" className={classes.root}>
      {/* Floating date labels riding the selection edges (merged into one when
          the window is too narrow for both), plus the hover date. */}
      <div className={classes.labelsRow}>
        {useMergedLabel ? (
          <span
            className={classNames(classes.edgeLabel, glide && classes.glide)}
            style={{
              left: clamp(
                (startEdgePx + endEdgePx) / 2,
                MERGED_LABEL_HALF,
                Math.max(MERGED_LABEL_HALF, width - MERGED_LABEL_HALF),
              ),
            }}
          >
            {mergedLabel}
          </span>
        ) : (
          <>
            <span
              className={classNames(classes.edgeLabel, glide && classes.glide)}
              style={{ left: clamp(startEdgePx, EDGE_LABEL_HALF, width - EDGE_LABEL_HALF) }}
            >
              {formatDate(startIso)}
            </span>
            <span
              className={classNames(classes.edgeLabel, glide && classes.glide)}
              style={{ left: clamp(endEdgePx, EDGE_LABEL_HALF, width - EDGE_LABEL_HALF) }}
            >
              {formatDate(endIso)}
            </span>
          </>
        )}
        {hoverIdx !== null && (
          <span
            className={classes.hoverLabel}
            style={{
              left: clamp(
                ((hoverIdx + 0.5) / totalDays) * width,
                EDGE_LABEL_HALF,
                width - EDGE_LABEL_HALF,
              ),
            }}
          >
            {formatDate(idxToIso(hoverIdx))}
            {hoverViews !== undefined && (
              <span className={classes.hoverLabelViews}>
                {" "}· {hoverViews.toLocaleString()} views
              </span>
            )}
          </span>
        )}
      </div>

      {/* The track: the whole scrubber domain, one gesture surface. */}
      <div
        ref={trackRef}
        className={classNames(classes.track, {
          [classes.trackGrabbing]: gestureKind === "move",
          [classes.trackResizing]: gestureKind === "resize-start" || gestureKind === "resize-end",
        })}
        onPointerDown={(e) =>
          beginGesture(e, {
            kind: "aim",
            pointerId: e.pointerId,
            anchor: dayAt(e.clientX),
            downX: e.clientX,
          })
        }
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerCancel={abortGesture}
        onPointerLeave={() => setHoverIdx(null)}
      >
        {ticks.map(
          (tick) =>
            tick.frac > 0 && (
              <div
                key={tick.iso}
                aria-hidden="true"
                className={classNames(classes.tick, tick.isYear && classes.tickYear)}
                style={{ left: `${tick.frac * 100}%` }}
              />
            ),
        )}
        {/* Daily-pageviews area graph, painted over the gridlines but under
            the hover line and the selection window. */}
        {historyGraph && (
          <svg
            aria-hidden="true"
            className={classes.historySvg}
            viewBox={`0 0 ${totalDays} 100`}
            preserveAspectRatio="none"
          >
            <path d={historyGraph.area} className={classes.historyArea} />
            <path
              d={historyGraph.line}
              className={classes.historyLine}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
        {hoverIdx !== null && (
          <div
            aria-hidden="true"
            className={classes.hoverLine}
            style={{ left: `${((hoverIdx + 0.5) / totalDays) * 100}%` }}
          />
        )}

        {/* Selection window. Arrow keys slide it (Shift = a week at a time). */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Selected date range — drag to move"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={totalDays - spanDays}
          aria-valuenow={shown.start}
          aria-valuetext={`${formatDate(startIso)} to ${formatDate(endIso)}`}
          onPointerDown={(e) =>
            beginGesture(e, {
              kind: "move",
              pointerId: e.pointerId,
              grabOffset: dayAt(e.clientX) - shown.start,
              span: spanDays,
            })
          }
          onKeyDown={keyHandler("move")}
          className={classNames(
            classes.selectionWindow,
            gestureKind === "move" && classes.selectionWindowActive,
            glide && classes.glide,
          )}
          style={{ left: `${startEdgePct}%`, width: `${endEdgePct - startEdgePct}%` }}
        >
          {rectPx >= 56 && (
            <span className={classes.spanBadgeWrapper}>
              <span className={classes.spanBadge}>{spanDays}d</span>
            </span>
          )}
        </div>

        {/* Edge handles. Each is a slider over its own legal day range. */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Start date"
          aria-orientation="horizontal"
          aria-valuemin={Math.max(0, shown.end - maxSpan + 1)}
          aria-valuemax={shown.end}
          aria-valuenow={shown.start}
          aria-valuetext={formatDate(startIso)}
          onPointerDown={(e) =>
            beginGesture(e, {
              kind: "resize-start",
              pointerId: e.pointerId,
              fixedEnd: shown.end,
            })
          }
          onKeyDown={keyHandler("start")}
          className={classNames(classes.edgeHandle, glide && classes.glide)}
          style={{ left: `${startEdgePct}%` }}
        >
          <span className={classes.edgeHandleBar} />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label="End date"
          aria-orientation="horizontal"
          aria-valuemin={shown.start}
          aria-valuemax={Math.min(totalDays - 1, shown.start + maxSpan - 1)}
          aria-valuenow={shown.end}
          aria-valuetext={formatDate(endIso)}
          onPointerDown={(e) =>
            beginGesture(e, {
              kind: "resize-end",
              pointerId: e.pointerId,
              fixedStart: shown.start,
            })
          }
          onKeyDown={keyHandler("end")}
          className={classNames(classes.edgeHandle, glide && classes.glide)}
          style={{ left: `${endEdgePct}%` }}
        >
          <span className={classes.edgeHandleBar} />
        </div>
      </div>

      {/* Month/year tick labels, capped by "Today" at the right edge. */}
      <div className={classes.tickLabelsRow}>
        {ticks
          .filter((tick) => tick.label !== null)
          .map((tick) => (
            <span
              key={tick.iso}
              className={classNames(classes.tickLabel, tick.isYear && classes.tickLabelYear)}
              style={{ left: `${tick.frac * 100}%` }}
            >
              {tick.label}
            </span>
          ))}
        <span className={classes.todayLabel}>Today</span>
      </div>
    </section>
  );
};

export default UsageTimelineScrubber;
