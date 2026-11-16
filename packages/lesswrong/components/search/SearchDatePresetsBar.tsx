import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { SearchDatePeriod, SearchDateRange, hasSearchDateRange } from '@/lib/search/searchFilters';
import SearchChip from './SearchChip';

const searchDatePresets: {label: string, period: SearchDatePeriod}[] = [
  {label: "Past day", period: "day"},
  {label: "Past week", period: "week"},
  {label: "Past month", period: "month"},
  {label: "Past year", period: "year"},
];

export function matchSearchDatePreset(range: SearchDateRange): string | undefined {
  return searchDatePresets.find(({period}) => range.past === period)?.label;
}

const styles = defineStyles("SearchDatePresetsBar", () => ({
  root: {display: "flex", gap: 4, flexWrap: "wrap"},
}));

const SearchDatePresetsBar = ({value, onChange}: {
  value: SearchDateRange,
  onChange: (value: SearchDateRange) => void,
}) => {
  const classes = useStyles(styles);
  const allTime = !hasSearchDateRange(value);
  return <div className={classes.root} role="group" aria-label="Timeframe">
    <SearchChip selected={allTime} onToggle={() => onChange({})}>All time</SearchChip>
    {searchDatePresets.map(({label, period}) => <SearchChip key={label} selected={value.past === period} onToggle={() => onChange({past: period})}>
      {label}
    </SearchChip>)}
  </div>;
};

export default SearchDatePresetsBar;
