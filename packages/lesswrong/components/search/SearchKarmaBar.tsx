import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import type { SearchKarmaRange } from '@/lib/search/searchFilters';
import { formatKarmaRange, karmaRangeWithBound, karmaRangeFromStops, karmaStops, stopsFromKarmaRange } from './karmaSlider';

const thumbStyle = {
  pointerEvents: "auto",
  width: 16,
  height: 16,
  borderRadius: "50%",
  border: "none",
  cursor: "grab",
};

const styles = defineStyles("SearchKarmaBar", (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  slider: {
    gridColumn: "1 / -1",
    position: "relative",
    flex: 1,
    minWidth: 160,
    maxWidth: 420,
    height: 32,
  },
  rail: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.palette.greyAlpha(0.15),
  },
  selectedRail: {
    position: "absolute",
    top: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.palette.primary.main,
  },
  input: {
    position: "absolute",
    inset: 0,
    width: "100%",
    margin: 0,
    background: "transparent",
    pointerEvents: "none",
    "-webkit-appearance": "none",
    appearance: "none",
    "&::-webkit-slider-thumb": {
      "-webkit-appearance": "none",
      ...thumbStyle,
      backgroundColor: theme.palette.primary.main,
    },
    "&::-moz-range-thumb": {
      ...thumbStyle,
      backgroundColor: theme.palette.primary.main,
    },
    "&::-webkit-slider-runnable-track": {
      background: "transparent",
    },
    "&::-moz-range-track": {
      background: "transparent",
    },
    "&:focus-visible::-webkit-slider-thumb": {
      outline: `2px solid ${theme.palette.primary.dark}`,
    },
  },
  numberInput: {
    ...theme.typography.body2,
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    minHeight: 32,
    padding: "2px 10px",
    "@media (pointer: coarse)": {minHeight: 40},
    border: theme.palette.greyBorder("1px", 0.2),
    borderRadius: 4,
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontVariantNumeric: "tabular-nums",
  },
  label: {
    gridColumn: "1 / -1",
    ...theme.typography.body2,
    fontSize: 13,
    color: theme.palette.grey[700],
    whiteSpace: "nowrap",
    minWidth: 120,
  },
}));

const lastStop = karmaStops.length - 1;

/** Two thumbs over the karma stops. The outer stops mean no bound. */
const SearchKarmaBar = ({value, onChange}: {
  value: SearchKarmaRange,
  onChange: (range: SearchKarmaRange) => void,
}) => {
  const classes = useStyles(styles);
  const [minStop, maxStop] = stopsFromKarmaRange(value);
  const setMin = (event: React.ChangeEvent<HTMLInputElement>) => {
    const stop = Math.min(Number(event.target.value), maxStop);
    const min = karmaRangeFromStops(stop, lastStop).min;
    onChange({...value, min: min === undefined ? undefined : Math.min(min, value.max ?? Infinity)});
  };
  const setMax = (event: React.ChangeEvent<HTMLInputElement>) => {
    const stop = Math.max(Number(event.target.value), minStop);
    const max = karmaRangeFromStops(0, stop).max;
    onChange({...value, max: max === undefined ? undefined : Math.max(max, value.min ?? -Infinity)});
  };
  const setNumericBound = (bound: "min" | "max", event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(karmaRangeWithBound(value, bound, event.target.value));
  };
  const left = `${(minStop / lastStop) * 100}%`;
  const width = `${((maxStop - minStop) / lastStop) * 100}%`;
  return <div className={classes.root} role="group" aria-label="Karma">
    <div className={classes.slider}>
      <div className={classes.rail} />
      <div className={classes.selectedRail} style={{left, width}} />
      <input type="range" className={classes.input} min={0} max={lastStop} step={1} value={minStop}
        aria-label="Minimum karma" aria-valuetext={value.min === undefined ? "No minimum" : String(value.min)} onChange={setMin} />
      <input type="range" className={classes.input} min={0} max={lastStop} step={1} value={maxStop}
        aria-label="Maximum karma" aria-valuetext={value.max === undefined ? "No maximum" : String(value.max)} onChange={setMax} />
    </div>
    <input type="number" step={1} className={classes.numberInput} value={value.min ?? ""} placeholder="No min"
      aria-label="Exact minimum karma" onChange={(event) => setNumericBound("min", event)} />
    <span>to</span>
    <input type="number" step={1} className={classes.numberInput} value={value.max ?? ""} placeholder="No max"
      aria-label="Exact maximum karma" onChange={(event) => setNumericBound("max", event)} />
    <span className={classes.label} aria-live="polite">{formatKarmaRange(value)}</span>
  </div>;
};

export default SearchKarmaBar;
