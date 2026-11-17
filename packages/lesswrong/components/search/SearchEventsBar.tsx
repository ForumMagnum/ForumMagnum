import React from 'react';
import { SearchEventFilter } from '@/lib/search/searchFilters';
import SearchSegmentedControl, { SearchSegment } from './SearchSegmentedControl';

const eventSegments: SearchSegment<SearchEventFilter>[] = [
  {value: "exclude", label: "Exclude", ariaLabel: "Exclude events"},
  {value: "include", label: "Include", ariaLabel: "Include events"},
  {value: "only", label: "Only events"},
];

const SearchEventsBar = ({value, onChange}: {
  value: SearchEventFilter,
  onChange: (value: SearchEventFilter) => void,
}) => <SearchSegmentedControl label="Events" segments={eventSegments} value={value} onChange={onChange} fullWidth />;

export default SearchEventsBar;
