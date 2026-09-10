import React, { useEffect, useRef, useState } from 'react';
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
  yearTicks,
  parseIsoDay,
  keyboardRange,
  resizeRange,
  positionToMs,
  overviewScale,
  zoomToRange,
} from './timeframeSlider';

const trackHeight = 80;

const styles = defineStyles("SearchTimeframeBar", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
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
    margin: 0,
  },
  dateInput: {
    ...theme.typography.body2,
    fontSize: 13,
    padding: "2px 4px",
    minHeight: 40,
    border: theme.palette.border.slightlyIntense2,
    borderRadius: 3,
    background: "transparent",
    color: theme.palette.text.normal,
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
  tick: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderLeft: theme.palette.greyBorder("1px", 0.15),
    pointerEvents: "none",
  },
  tickLabel: {
    ...theme.typography.body2,
    position: "absolute",
    bottom: 2,
    left: 3,
    fontSize: 10,
    color: theme.palette.grey[600],
    whiteSpace: "nowrap",
  },
  tickLabelHidden: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  band: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: theme.palette.primaryAlpha(0.25),
    borderLeft: `2px solid ${theme.palette.primary.main}`,
    borderRight: `2px solid ${theme.palette.primary.main}`,
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
    color: theme.palette.primary.main,
    cursor: "ew-resize",
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2},
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
  return rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
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

/**
 * A track over all years since the search origin. Drag on it to select any
 * range of days, drag the selection to move it, or use the presets and the
 * date inputs.
 */
const SearchTimeframeBar = ({value, onChange, scale}: {
  value: SearchDateRange,
  onChange: (range: SearchDateRange) => void,
  scale: TimeframeScale,
}) => {
  const classes = useStyles(styles);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [draft, setDraft] = useState<SearchDateRange | null>(null);
  // The scale depends on settings and the clock, which can differ between the
  // server render and the client. The track contents are drawn after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [zoom, setZoom] = useState<TimeframeScale | null>(null);
  const [dateError, setDateError] = useState("");
  const overview = overviewScale(scale, value);
  const viewScale = zoom ? overviewScale(zoom, value) : overview;
  const shown = draft ?? value;
  const ticks = mounted ? yearTicks(viewScale) : [];
  const draftRef = useRef<SearchDateRange | null>(null);
  const updateDraft = (range: SearchDateRange) => {
    draftRef.current = range;
    setDraft(range);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !track.current) return;
    const fraction = trackFraction(track.current, event.clientX);
    const onBand = event.target instanceof HTMLElement && event.target.dataset.band !== undefined;
    const endpoint = event.target instanceof HTMLElement ? event.target.closest("[data-endpoint]")?.getAttribute("data-endpoint") : null;
    drag.current = endpoint === "start" || endpoint === "end" ? {mode: endpoint} : onBand && isClosed(value)
      ? {mode: "shift", from: fraction, original: value}
      : {mode: "select", anchor: fraction};
    track.current.focus();
    track.current.setPointerCapture(event.pointerId);
    updateDraft(drag.current.mode === "select" ? dragToRange(fraction, fraction, viewScale) : value);
    event.preventDefault();
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !track.current) return;
    const fraction = trackFraction(track.current, event.clientX);
    updateDraft(drag.current.mode === "select"
      ? dragToRange(drag.current.anchor, fraction, viewScale)
      : drag.current.mode === "shift" ? shiftRange(drag.current.original, fraction - drag.current.from, viewScale)
      : resizeRange(value, drag.current.mode, positionToMs(fraction, viewScale), viewScale));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (draftRef.current) onChange(draftRef.current);
    draftRef.current = null;
    setDraft(null);
  };

  const cancelDrag = () => {
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
    const bound = day === undefined ? undefined : day + (endpoint === "end" ? dayMs - 1 : 0);
    const next = {...value, [endpoint]: bound};
    if (next.start !== undefined && next.end !== undefined && next.start > next.end) {
      setDateError("The from date must be on or before the to date.");
      return;
    }
    setDateError("");
    setZoom(null);
    onChange(next);
  };
  const onEndpointKey = (event: React.KeyboardEvent<HTMLButtonElement>, endpoint: "start" | "end") => {
    const next = keyboardRange(value, endpoint, event.key, viewScale);
    if (next) {
      event.preventDefault();
      onChange(next);
    }
  };

  const startFraction = shown.start === undefined ? 0 : msToFraction(shown.start, viewScale);
  const endFraction = shown.end === undefined ? 1 : msToFraction(shown.end, viewScale);

  return <div className={classes.root}>
    <div className={classes.controls}>
      <SearchChip selected={isEmpty(value)} onToggle={() => {setZoom(null); setDateError(""); onChange({});}}>All time</SearchChip>
      {presets.map(({preset, label}) => {
        const range = presetDateRange(preset, scale.nowMs);
        const selected = value.start === range.start && value.end === undefined;
        return <SearchChip key={preset} selected={selected} onToggle={() => onChange(selected ? {} : range)}>{label}</SearchChip>;
      })}
      <input type="date" aria-label="From date" className={classes.dateInput} value={toIsoDay(value.start)} onChange={event => setDate(event, "start")} aria-invalid={!!dateError} />
      <input type="date" aria-label="To date" className={classes.dateInput} value={toIsoDay(value.end)} onChange={event => setDate(event, "end")} aria-invalid={!!dateError} />
      <span className={classes.label} aria-live="polite">{formatDateRange(shown)}</span>
    </div>
    {dateError && <span role="alert" className={classes.error}>{dateError}</span>}
    <div className={classes.controls}>
      <button type="button" className={classes.dateInput} disabled={isEmpty(value)} onClick={() => setZoom(zoomToRange(value, viewScale))}>Zoom to selection</button>
      {zoom && <button type="button" className={classes.dateInput} onClick={() => setZoom(null)}>All years</button>}
      {mounted && <span className={classes.label}>{formatDay(viewScale.originMs)} – {formatDay(viewScale.nowMs)}</span>}
    </div>
    <p className={classes.hint}>Drag to select a range, move the middle, or resize with the endpoints. Arrow keys adjust a focused endpoint by one day.</p>
    <div
      ref={track}
      tabIndex={-1}
      className={classes.track}
      role="group"
      aria-label="Timeframe selection"
      onKeyDown={event => {if (event.key === "Escape") cancelDrag();}}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={cancelDrag}
      onLostPointerCapture={cancelDrag}
    >
      {ticks.map(({year, fraction}, index) => <div key={year} className={classes.tick} style={{left: `${fraction * 100}%`}}>
        <span className={classNames(classes.tickLabel, {[classes.tickLabelHidden]: index % 2 === 1})}>{year}</span>
      </div>)}
      {mounted && !isEmpty(shown) && <div
        data-band=""
        className={classNames(classes.band, {[classes.bandShiftable]: isClosed(value)})}
        style={{left: `${startFraction * 100}%`, width: `${Math.max(0, endFraction - startFraction) * 100}%`}}
      />}
      {mounted && <>
        <button type="button" role="slider" aria-label="Start date" data-endpoint="start"
          aria-valuemin={viewScale.originMs} aria-valuemax={shown.end ?? viewScale.nowMs}
          aria-valuenow={shown.start ?? viewScale.originMs} aria-valuetext={toIsoDay(shown.start ?? viewScale.originMs)}
          className={classNames(classes.endpoint, classes.startEndpoint)} style={{left: `clamp(20px, ${startFraction * 100}%, calc(100% - 20px))`}}
          onKeyDown={event => onEndpointKey(event, "start")}>◀</button>
        <button type="button" role="slider" aria-label="End date" data-endpoint="end"
          aria-valuemin={shown.start ?? viewScale.originMs} aria-valuemax={viewScale.nowMs}
          aria-valuenow={shown.end ?? viewScale.nowMs} aria-valuetext={toIsoDay(shown.end ?? viewScale.nowMs)}
          className={classNames(classes.endpoint, classes.endEndpoint)} style={{left: `clamp(20px, ${endFraction * 100}%, calc(100% - 20px))`}}
          onKeyDown={event => onEndpointKey(event, "end")}>▶</button>
      </>}
    </div>
  </div>;
};

export default SearchTimeframeBar;
