import React from 'react';
import { SearchDatePeriod, SearchDateRange, hasSearchDateRange } from '@/lib/search/searchFilters';
import SearchSegmentedControl, { SearchSegment } from './SearchSegmentedControl';

const searchDatePresets: {label: string, shortLabel: string, period: SearchDatePeriod}[] = [
  {label: "Past day", shortLabel: "Day", period: "day"},
  {label: "Past week", shortLabel: "Week", period: "week"},
  {label: "Past month", shortLabel: "Month", period: "month"},
  {label: "Past year", shortLabel: "Year", period: "year"},
];

export function matchSearchDatePreset(range: SearchDateRange): string | undefined {
  return searchDatePresets.find(({period}) => range.past === period)?.label;
}

type SearchDateChoice = SearchDatePeriod | "all";

const dateSegments: SearchSegment<SearchDateChoice>[] = [
  {value: "all", label: "All time"},
  ...searchDatePresets.map(({label, shortLabel, period}) => ({value: period, label: shortLabel, ariaLabel: label})),
];

const SearchDatePresetsBar = ({value, onChange}: {
  value: SearchDateRange,
  onChange: (value: SearchDateRange) => void,
}) => {
  // An explicit from/to range matches no segment, so none is checked.
  const choice: SearchDateChoice | undefined = !hasSearchDateRange(value) ? "all" : value.past;
  return <SearchSegmentedControl
    label="Timeframe"
    segments={dateSegments}
    value={choice}
    onChange={(next) => onChange(next === "all" ? {} : {past: next})}
    fullWidth
  />;
};

export default SearchDatePresetsBar;
