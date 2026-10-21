import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { SearchDateRange } from '@/lib/search/searchFilters';
import SearchChip from './SearchChip';

const dayMs = 24 * 60 * 60 * 1000;

export const searchDatePresets = [
  {label: "Past day", days: 1},
  {label: "Past week", days: 7},
  {label: "Past month", days: 30},
  {label: "Past year", days: 365},
];

export function searchDatePresetRange(days: number, nowMs: number): SearchDateRange {
  const start = nowMs - days * dayMs;
  return {start: start - start % dayMs};
}

export function matchSearchDatePreset(range: SearchDateRange, nowMs: number): string | undefined {
  if (range.end !== undefined) return undefined;
  return searchDatePresets.find(({days}) => searchDatePresetRange(days, nowMs).start === range.start)?.label;
}

const styles = defineStyles("SearchDatePresetsBar", () => ({
  root: {display: "flex", gap: 4, flexWrap: "wrap"},
}));

const SearchDatePresetsBar = ({value, onChange}: {
  value: SearchDateRange,
  onChange: (value: SearchDateRange) => void,
}) => {
  const classes = useStyles(styles);
  const nowMs = Date.now();
  const allTime = value.start === undefined && value.end === undefined;
  const preset = matchSearchDatePreset(value, nowMs);
  return <div className={classes.root} role="group" aria-label="Timeframe">
    <SearchChip selected={allTime} onToggle={() => onChange({})}>All time</SearchChip>
    {searchDatePresets.map(({label, days}) => <SearchChip key={label} selected={preset === label} onToggle={() => onChange(searchDatePresetRange(days, nowMs))}>
      {label}
    </SearchChip>)}
  </div>;
};

export default SearchDatePresetsBar;
