import React from 'react';
import classNames from 'classnames';
import { useStyles } from '@/components/hooks/useStyles';
import { SearchDateRange, SearchEventFilter, SearchFilterState, defaultSearchFilters, defaultSearchPostTypes, hasSearchDateRange, isDefaultSearchPostTypes, searchPostTypeLabels } from '@/lib/search/searchFilters';
import { SearchPageState } from './searchPageUrl';
import { searchPageStyles } from './searchPageStyles';
import SearchFilterRow from './SearchFilterRow';
import SearchAuthorsBar from './SearchAuthorsBar';
import SearchWikitagsBar from './SearchWikitagsBar';
import SearchEventsBar from './SearchEventsBar';
import SearchPostTypeBar from './SearchPostTypeBar';
import SearchDatePresetsBar, { matchSearchDatePreset } from './SearchDatePresetsBar';

export const searchFilterPanels = ["time", "authors", "tags", "events", "types"] as const;
export type SearchFilterPanel = typeof searchFilterPanels[number];

interface SearchPageFiltersProps {
  state: SearchPageState;
  expandedFilters: SearchFilterPanel[];
  filtersOpen: boolean;
  setFilters: (patch: Partial<SearchFilterState>) => void;
  toggleFilter: (key: SearchFilterPanel) => void;
  clearFilters: () => void;
  filtersId: string;
}

const eventFilterSummaries: Record<SearchEventFilter, string> = {
  include: "Included",
  exclude: "Excluded (default)",
  only: "Only events",
};

function formatDateBound(ms: number | undefined, fallback: string): string {
  return ms === undefined ? fallback : new Date(ms).toISOString().slice(0, 10);
}

function summarizeDateRange(dateRange: SearchDateRange): string {
  const preset = matchSearchDatePreset(dateRange);
  if (preset) return preset;
  if (!hasSearchDateRange(dateRange)) return "All time";
  return `${formatDateBound(dateRange.start, "Beginning")} – ${formatDateBound(dateRange.end, "Today")}`;
}

export function summarizeSearchFilters(state: SearchPageState) {
  const {dateRange} = state.filters;
  const hasDateFilter = hasSearchDateRange(dateRange);
  const hasPostFilter = state.filters.postTypes.length > 0 && !isDefaultSearchPostTypes(state.filters.postTypes);
  const hasFilters = hasDateFilter || hasPostFilter || state.filters.events !== defaultSearchFilters.events || !!state.filters.tagIds.length || !!state.filters.authorIds.length || !!state.kinds.length;
  return {hasDateFilter, hasPostFilter, hasFilters, dateSummary: summarizeDateRange(dateRange)};
}

export default function SearchPageFilters({state, expandedFilters, filtersOpen, setFilters, toggleFilter, clearFilters, filtersId}: SearchPageFiltersProps) {
  const classes = useStyles(searchPageStyles);
  const {hasDateFilter, hasPostFilter, hasFilters, dateSummary} = summarizeSearchFilters(state);
  return (
    <aside id={filtersId} className={classes.sidebar} hidden={!filtersOpen} aria-label="Search options">
      <SearchFilterRow label="Timeframe" summary={dateSummary} active={hasDateFilter} expanded={expandedFilters.includes("time")} onToggle={() => toggleFilter("time")} onReset={() => setFilters({dateRange: {}})}>
        <SearchDatePresetsBar value={state.filters.dateRange} onChange={(dateRange) => setFilters({dateRange})} />
      </SearchFilterRow>
      <SearchFilterRow label="Author" summary={state.filters.authorIds.length ? `${state.filters.authorIds.length} selected` : "Anyone"} active={!!state.filters.authorIds.length} expanded={expandedFilters.includes("authors")} onToggle={() => toggleFilter("authors")} onReset={() => setFilters({authorIds: []})}>
        <SearchAuthorsBar authorIds={state.filters.authorIds} onChange={(authorIds) => setFilters({authorIds})} />
      </SearchFilterRow>

      <div className={classes.filters}>
        <SearchFilterRow label="Wikitags" summary={state.filters.tagIds.length ? `${state.filters.tagIds.length} selected · match ${state.filters.tagMatch}` : "Any wikitag"} active={!!state.filters.tagIds.length} expanded={expandedFilters.includes("tags")} onToggle={() => toggleFilter("tags")} onReset={() => setFilters({tagIds: [], tagMatch: "any"})}>
          <SearchWikitagsBar match={state.filters.tagMatch} onMatchChange={(tagMatch) => setFilters({tagMatch})} tagIds={state.filters.tagIds} onChange={(tagIds) => setFilters({tagIds})} />
        </SearchFilterRow>
        <SearchFilterRow label="Events" summary={eventFilterSummaries[state.filters.events]} active={state.filters.events !== defaultSearchFilters.events} expanded={expandedFilters.includes("events")} onToggle={() => toggleFilter("events")} onReset={() => setFilters({events: defaultSearchFilters.events})}>
          <SearchEventsBar value={state.filters.events} onChange={(events) => setFilters({events})} />
        </SearchFilterRow>
        <SearchFilterRow label="Post types" summary={hasPostFilter ? state.filters.postTypes.map(type => searchPostTypeLabels[type]).join(", ") : "All post types"} active={hasPostFilter} expanded={expandedFilters.includes("types")} onToggle={() => toggleFilter("types")} onReset={() => setFilters({postTypes: defaultSearchPostTypes})}>
          <SearchPostTypeBar className={classes.postTypes} selected={state.filters.postTypes} onChange={(postTypes) => setFilters({postTypes})} />
        </SearchFilterRow>
        {hasFilters && <button type="button" className={classNames(classes.clearFilters, classes.clearFiltersButton)} onClick={clearFilters}>Clear filters</button>}
      </div>
    </aside>
  );
}
