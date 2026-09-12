import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import type { SearchDateRange } from '@/lib/search/searchFilters';
import SearchChip from './SearchChip';
import {
  TimeframePreset,
  TimeframeScale,
  dayMs,
  dragToRange,
  formatDateRange,
  formatDay,
  msToFraction,
  presetDateRange,
  shiftRange,
  calendarBands,
  parseIsoDay,
  keyboardRange,
  resizeRange,
  positionToMs,
  overviewScale,
  zoomToRange,
  defaultTimeframeView,
  keyboardTimeframeView,
  wheelTimeframeView,
  expandTimeframeView,
} from './timeframeSlider';

const trackHeight = 40;
const trackRightPadding = 24;

const styles = defineStyles("SearchTimeframeBar", (theme: ThemeType) => ({
  root: {
    "--timeframe-label": theme.palette.text.dim,
    "--timeframe-selected-label": theme.palette.text.alwaysWhite,
    "--timeframe-green": `color-mix(in srgb, ${theme.palette.primary.main} 85%, ${theme.palette.background.paper})`,
    "--timeframe-green-alternate": theme.palette.primary.main,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
    flex: 1,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  label: {
    ...theme.typography.body2,
    fontSize: 13,
    color: theme.palette.grey[700],
    marginLeft: "auto",
    whiteSpace: "nowrap",
  },
  hint: {
    ...theme.typography.body2,
    fontSize: 13,
    color: theme.palette.text.dim,
    marginLeft: 8,
    whiteSpace: "nowrap",
  },
  dateInput: {
    ...theme.typography.body2,
    fontSize: 13,
    padding: "2px 10px",
    minHeight: 32,
    boxSizing: "border-box",
    border: "none",
    borderRadius: 3,
    background: theme.palette.greyAlpha(0.04),
    color: theme.palette.text.normal,
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`},
    "&:disabled": {opacity: 0.45},
    "&:enabled:hover": {background: theme.palette.greyAlpha(0.08)},
    "@media (pointer: coarse)": {minHeight: 40},
  },
  track: {
    position: "relative",
    height: trackHeight,
    borderRadius: 3,
    backgroundColor: theme.palette.greyAlpha(0.06),
    cursor: "crosshair",
    touchAction: "none",
    userSelect: "none",
    overflow: "hidden",
  },
  trackContents: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: trackRightPadding,
    pointerEvents: "none",
    "& [data-band], & [data-endpoint]": {pointerEvents: "auto"},
  },
  tick: {
    position: "absolute",
    top: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  tickAlternate: {
    backgroundColor: theme.palette.greyAlpha(0.08),
  },
  tickLabel: {
    ...theme.typography.body2,
    position: "absolute",
    top: 0,
    display: "flex",
    alignItems: "center",
    height: 28,
    left: 8,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    pointerEvents: "none",
    color: "transparent",
    backgroundClip: "text",
    whiteSpace: "nowrap",
  },
  band: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "var(--timeframe-green)",
    borderRadius: 3,
    boxSizing: "border-box",
    minWidth: 2,
  },
  endpoint: {
    position: "absolute",
    width: 40,
    height: 40,
    padding: 0,
    transform: "translateX(-50%)",
    border: "none",
    background: "transparent",
    color: theme.palette.text.alwaysWhite,
    cursor: "ew-resize",
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2},
  },
  grip: {
    position: "absolute",
    bottom: 3,
    width: 3,
    height: 10,
    borderRadius: 2,
    background: theme.palette.text.alwaysWhite,
    boxShadow: `0 0 0 1px ${theme.palette.primary.dark}`,
    pointerEvents: "none",
  },
  startEndpoint: {top: 0},
  endEndpoint: {bottom: 0},
  error: {color: theme.palette.text.normal, fontSize: 13},
  bandShiftable: {
    cursor: "grab",
  },
}));

const presets: {preset: TimeframePreset, label: string}[] = [
  {preset: "day", label: "Past day"},
  {preset: "week", label: "Past week"},
  {preset: "month", label: "Past month"},
  {preset: "year", label: "Past year"},
];

type Drag = {mode: "select", anchor: number} | {mode: "shift", from: number, original: Required<SearchDateRange>} | {mode: "start" | "end"};

function trackFraction(track: HTMLDivElement, clientX: number): number {
  const rect = track.getBoundingClientRect();
  return rect.width > trackRightPadding ? (clientX - rect.left) / (rect.width - trackRightPadding) : 0;
}

function isClosed(range: SearchDateRange): range is Required<SearchDateRange> {
  return range.start !== undefined && range.end !== undefined;
}

function isEmpty(range: SearchDateRange): boolean {
  return range.start === undefined && range.end === undefined;
}

function toIsoDay(ms: number | undefined): string {
  return ms === undefined ? "" : new Date(ms).toISOString().slice(0, 10);
}

interface ZoomAnimation {
  from: TimeframeScale,
  to: TimeframeScale,
  target: TimeframeScale | null,
  started: number | null,
  viewRef: React.RefObject<TimeframeScale>,
  zoomFrame: React.RefObject<number | null>,
  setZoom: React.Dispatch<React.SetStateAction<TimeframeScale | null>>,
}

function advanceZoom(animation: ZoomAnimation, now: number) {
  animation.started ??= now;
  const {from, to, target, viewRef, zoomFrame, setZoom} = animation;
  const progress = Math.min(1, (now - animation.started) / 300);
  const eased = 1 - Math.pow(1 - progress, 3);
  const fromSpan = from.nowMs - from.originMs;
  const toSpan = to.nowMs - to.originMs;
  // Geometric scale changes keep large archive-to-day zooms smooth.
  // Use the same blend for both edges to keep the selection anchored.
  const span = fromSpan * Math.pow(toSpan / fromSpan, eased);
  const blend = fromSpan === toSpan ? eased : (span - fromSpan) / (toSpan - fromSpan);
  const next = {
    originMs: from.originMs + ((to.originMs - from.originMs) * blend),
    nowMs: from.nowMs + ((to.nowMs - from.nowMs) * blend),
  };
  viewRef.current = progress === 1 ? to : next;
  setZoom(progress === 1 ? target : next);
  zoomFrame.current = progress === 1 ? null : requestAnimationFrame(advanceZoom.bind(null, animation));
}

/**
 * A track over all years since the search origin. Drag on it to select any
 * range of days, drag the selection to move it, or use the presets and the
 * date inputs.
 */
const SearchTimeframeBar = ({value, onChange, scale, children}: {
  value: SearchDateRange,
  onChange: (range: SearchDateRange) => void,
  scale: TimeframeScale,
  children?: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [draft, setDraft] = useState<SearchDateRange | null>(null);
  // The scale depends on settings and the clock, which can differ between the
  // server render and the client. The track contents are drawn after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [trackWidth, setTrackWidth] = useState(640);
  useEffect(() => {
    const element = track.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setTrackWidth(Math.max(1, entry.contentRect.width - trackRightPadding));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [zoom, setZoom] = useState<TimeframeScale | null>(() => isEmpty(value) ? null : zoomToRange(value, scale));
  const [dateError, setDateError] = useState("");
  const overview = overviewScale(scale, value);
  const viewScale = zoom ?? defaultTimeframeView(overview);
  const shown = draft ?? value;
  const [edgeFraction, setEdgeFraction] = useState<number | null>(null);
  const viewRef = useRef(viewScale);
  viewRef.current = viewScale;
  const zoomFrame = useRef<number | null>(null);
  const stopZoom = useCallback(() => {
    if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current);
    zoomFrame.current = null;
  }, []);
  useEffect(() => stopZoom, [stopZoom]);

  const animateZoom = useCallback((target: TimeframeScale | null) => {
    stopZoom();
    const from = viewRef.current;
    const to = target ?? defaultTimeframeView({originMs: overview.originMs, nowMs: overview.nowMs});
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      viewRef.current = to;
      setZoom(target);
      return;
    }
    zoomFrame.current = requestAnimationFrame(advanceZoom.bind(null, {
      from, to, target, started: null, viewRef, zoomFrame, setZoom,
    }));
  }, [overview.originMs, overview.nowMs, stopZoom]);

  const previousValue = useRef(value);
  useEffect(() => {
    // An external clear also resets a manually panned or zoomed all-time view.
    if (previousValue.current !== value && isEmpty(value)) {
      animateZoom(null);
      setDateError("");
    }
    previousValue.current = value;
  }, [value, animateZoom]);

  const ticks = mounted ? calendarBands(viewScale, trackWidth) : [];
  const draftRef = useRef<SearchDateRange | null>(null);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const bounds = {originMs: overview.originMs, nowMs: overview.nowMs};
    const onWheel = (event: WheelEvent) => {
      // Shift+wheel is reported as vertical input by some mice/browsers.
      const verticalZoom = !event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX);
      const delta = verticalZoom ? -event.deltaY : event.deltaX || (event.shiftKey ? event.deltaY : 0);
      if (!delta) return;
      event.preventDefault();
      const pixelsPerUnit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? trackWidth : 1;
      drag.current = null;
      draftRef.current = null;
      setDraft(null);
      stopZoom();
      const next = wheelTimeframeView(viewRef.current, bounds, delta * pixelsPerUnit, trackWidth, verticalZoom || event.ctrlKey);
      viewRef.current = next;
      setZoom(next);
    };
    // React wheel listeners are passive, which would leave browser scrolling/zoom enabled.
    element.addEventListener("wheel", onWheel, {passive: false});
    return () => element.removeEventListener("wheel", onWheel);
  }, [overview.originMs, overview.nowMs, trackWidth, stopZoom]);

  useEffect(() => {
    if (edgeFraction === null) return;
    const bounds = {originMs: overview.originMs, nowMs: overview.nowMs};
    const timer = window.setInterval(() => {
      const active = drag.current;
      if (!active || active.mode !== "start") return;
      const current = viewRef.current;
      const next = expandTimeframeView(current, bounds, edgeFraction);
      if (next.originMs === current.originMs && next.nowMs === current.nowMs) return;
      viewRef.current = next;
      setZoom(next);
      const range = resizeRange(value, active.mode, positionToMs(edgeFraction, next), bounds);
      draftRef.current = range;
      setDraft(range);
    }, 50);
    return () => window.clearInterval(timer);
  }, [edgeFraction, overview.originMs, overview.nowMs, value]);

  const updateDraft = (range: SearchDateRange) => {
    draftRef.current = range;
    setDraft(range);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !track.current) return;
    stopZoom();
    const fraction = trackFraction(track.current, event.clientX);
    const onBand = event.target instanceof HTMLElement && event.target.dataset.band !== undefined;
    const endpoint = event.target instanceof HTMLElement ? event.target.closest("[data-endpoint]")?.getAttribute("data-endpoint") : null;
    drag.current = endpoint === "start" || endpoint === "end" ? {mode: endpoint} : onBand && isClosed(value)
      ? {mode: "shift", from: fraction, original: value}
      : {mode: "select", anchor: fraction};
    track.current.focus();
    track.current.setPointerCapture(event.pointerId);
    updateDraft(drag.current.mode === "select" ? dragToRange(fraction, fraction, viewScale, overview) : value);
    event.preventDefault();
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !track.current) return;
    const fraction = trackFraction(track.current, event.clientX);
    setEdgeFraction(drag.current.mode === "start" && fraction < 0.08 ? fraction : null);
    updateDraft(drag.current.mode === "select"
      ? dragToRange(drag.current.anchor, fraction, viewScale, overview)
      : drag.current.mode === "shift" ? shiftRange(drag.current.original, (fraction - drag.current.from) * (viewScale.nowMs - viewScale.originMs) / (overview.nowMs - overview.originMs), overview)
      : resizeRange(value, drag.current.mode, positionToMs(fraction, viewScale), overview));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setEdgeFraction(null);
    if (draftRef.current) {
      animateZoom(zoomToRange(draftRef.current, overview));
      onChange(draftRef.current);
    }
    draftRef.current = null;
    setDraft(null);
  };

  const cancelDrag = () => {
    setEdgeFraction(null);
    drag.current = null;
    draftRef.current = null;
    setDraft(null);
  };
  const setDate = (event: React.ChangeEvent<HTMLInputElement>, endpoint: "start" | "end") => {
    const input = event.target;
    const day = parseIsoDay(input.value);
    if (input.validity.badInput || (input.value && day === undefined)) {
      setDateError("Enter a valid calendar date.");
      return;
    }
    if (day !== undefined && (day < scale.originMs || day > scale.nowMs)) {
      setDateError(`Choose a date from ${formatDay(scale.originMs)} through today.`);
      return;
    }
    const bound = day === undefined ? undefined : day + (endpoint === "end" ? dayMs - 1 : 0);
    const next = {...value, [endpoint]: bound};
    if (next.start !== undefined && next.end !== undefined && next.start > next.end) {
      setDateError("The from date must be on or before the to date.");
      return;
    }
    setDateError("");
    animateZoom(isEmpty(next) ? null : zoomToRange(next, overviewScale(scale, next)));
    onChange(next);
  };
  const onEndpointKey = (event: React.KeyboardEvent<HTMLButtonElement>, endpoint: "start" | "end") => {
    if (event.shiftKey || event.ctrlKey) return;
    const next = keyboardRange(value, endpoint, event.key, overview);
    if (next) {
      event.preventDefault();
      animateZoom(zoomToRange(next, overview));
      onChange(next);
    }
  };

  const onTrackKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") cancelDrag();
    const next = keyboardTimeframeView(viewScale, overview, event.key, event.shiftKey, event.ctrlKey);
    if (next) {
      event.preventDefault();
      cancelDrag();
      stopZoom();
      setZoom(next);
    }
  };

  const startFraction = msToFraction(shown.start ?? scale.originMs, viewScale);
  const endFraction = msToFraction(shown.end ?? scale.nowMs, viewScale);

  return <div className={classes.root}>
    <div className={classes.controls}>
      <SearchChip selected={isEmpty(value)} onToggle={() => {animateZoom(null); setDateError(""); onChange({});}}>All time</SearchChip>
      {presets.map(({preset, label}) => {
        const range = presetDateRange(preset, scale.nowMs);
        const selected = value.start === range.start && value.end === undefined;
        return <SearchChip key={preset} selected={selected} onToggle={() => {animateZoom(selected ? null : zoomToRange(range, scale)); setDateError(""); onChange(selected ? {} : range);}}>{label}</SearchChip>;
      })}
      <input type="date" min={toIsoDay(scale.originMs)} max={toIsoDay(scale.nowMs)} aria-label="From date" className={classes.dateInput} value={toIsoDay(value.start)} onChange={event => setDate(event, "start")} aria-invalid={!!dateError} />
      <input type="date" min={toIsoDay(scale.originMs)} max={toIsoDay(scale.nowMs)} aria-label="To date" className={classes.dateInput} value={toIsoDay(value.end)} onChange={event => setDate(event, "end")} aria-invalid={!!dateError} />

      {(viewScale.originMs !== defaultTimeframeView(overview).originMs || viewScale.nowMs !== defaultTimeframeView(overview).nowMs) && <button type="button" className={classes.dateInput} onClick={() => animateZoom(defaultTimeframeView(overview))}>All years</button>}
      <span className={classes.hint}>Drag to select.</span>
      <span className={classes.label} aria-live="polite">{isEmpty(shown) ? `${formatDay(scale.originMs)}–now` : formatDateRange(shown)}</span>
      {children}
    </div>
    {dateError && <span role="alert" className={classes.error}>{dateError}</span>}
    <div
      ref={track}
      tabIndex={0}
      className={classes.track}
      role="group"
      aria-label="Timeframe selection"
      onKeyDown={onTrackKey}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={cancelDrag}
      onLostPointerCapture={cancelDrag}
    >
      <div className={classes.trackContents}>
        {mounted && (shown.start ?? overview.originMs) <= viewScale.nowMs && (shown.end ?? overview.nowMs) >= viewScale.originMs && <div
          data-band=""
          className={classNames(classes.band, {[classes.bandShiftable]: isClosed(value)})}
          style={{left: `${startFraction * 100}%`, width: `${Math.max(0, endFraction - startFraction) * 100}%`}}
        />}
        {ticks.map(({startMs, fraction, endFraction: tickEndFraction, alternate}) => <div
          key={startMs}
          className={classNames(classes.tick, {[classes.tickAlternate]: alternate})}
          style={{
            left: `${fraction * 100}%`,
            width: `${(tickEndFraction - fraction) * 100}%`,
            backgroundImage: mounted && alternate && fraction < endFraction && tickEndFraction > startFraction
              ? `linear-gradient(to right, transparent ${Math.max(0, (startFraction - fraction) * trackWidth)}px, var(--timeframe-green-alternate) ${Math.max(0, (startFraction - fraction) * trackWidth)}px, var(--timeframe-green-alternate) ${Math.max(0, (endFraction - fraction) * trackWidth)}px, transparent ${Math.max(0, (endFraction - fraction) * trackWidth)}px)`
              : undefined,
          }}
        />)}
        {ticks.filter(tick => tick.showLabel).map(({startMs, fraction, label}) => {
          const selectionStart = Math.max(0, ((startFraction - fraction) * trackWidth) - 8);
          const selectionEnd = Math.max(0, ((endFraction - fraction) * trackWidth) - 8);
          return <span
            key={startMs}
            className={classes.tickLabel}
            style={{
              left: `calc(${fraction * 100}% + 8px)`,
              // Clip the text color at the exact selection edges, including partial labels.
              backgroundImage: `linear-gradient(to right, var(--timeframe-label) ${selectionStart}px, var(--timeframe-selected-label) ${selectionStart}px, var(--timeframe-selected-label) ${selectionEnd}px, var(--timeframe-label) ${selectionEnd}px)`,
            }}
          >{label}</span>;
        })}
        {mounted && <>
          <span aria-hidden="true" className={classes.grip} style={{left: `clamp(0px, ${startFraction * 100}%, calc(100% - 3px))`}} />
          <span aria-hidden="true" className={classes.grip} style={{left: `clamp(0px, calc(${endFraction * 100}% - 3px), calc(100% - 3px))`}} />
          <button type="button" role="slider" aria-label="Start date" data-endpoint="start"
            aria-valuemin={overview.originMs} aria-valuemax={shown.end ?? overview.nowMs}
            aria-valuenow={shown.start ?? overview.originMs} aria-valuetext={toIsoDay(shown.start ?? overview.originMs)}
            className={classNames(classes.endpoint, classes.startEndpoint)} style={{left: `clamp(20px, ${startFraction * 100}%, calc(100% - 20px))`}}
            onKeyDown={event => onEndpointKey(event, "start")} />
          <button type="button" role="slider" aria-label="End date" data-endpoint="end"
            aria-valuemin={shown.start ?? overview.originMs} aria-valuemax={overview.nowMs}
            aria-valuenow={shown.end ?? overview.nowMs} aria-valuetext={toIsoDay(shown.end ?? overview.nowMs)}
            className={classNames(classes.endpoint, classes.endEndpoint)} style={{left: `clamp(20px, ${endFraction * 100}%, calc(100% - 20px))`}}
            onKeyDown={event => onEndpointKey(event, "end")} />
        </>}
      </div>
    </div>
  </div>;
};

export default SearchTimeframeBar;
