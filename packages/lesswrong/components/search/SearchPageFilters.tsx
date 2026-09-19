import React from 'react';
import classNames from 'classnames';
import { useStyles } from '@/components/hooks/useStyles';
import { SearchFilterState, defaultSearchPostTypes, searchPostTypeLabels } from '@/lib/search/searchFilters';
import { SearchPageState, defaultSearchPageState } from './searchPageUrl';
import { searchPageStyles } from './searchPageStyles';
import SearchFilterRow from './SearchFilterRow';
import SearchAuthorsBar from './SearchAuthorsBar';
import SearchWikitagsBar from './SearchWikitagsBar';
import SearchEventsBar from './SearchEventsBar';
import SearchPostTypeBar from './SearchPostTypeBar';
import SearchKarmaBar from './SearchKarmaBar';

interface SearchPageFiltersProps {
  state: SearchPageState;
  setFilters: (patch: Partial<SearchFilterState>) => void;
  toggleFilter: (key: string) => void;
  clearFilters: () => void;
  filtersId: string;
  timeframeId: string;
  isDesktop: boolean;
  timeframePanel: React.ReactNode;
  children?: React.ReactNode;
}

export function summarizeSearchFilters(state: SearchPageState) {
  const {dateRange, karmaRange} = state.filters;
  const hasDateFilter = dateRange.start !== undefined || dateRange.end !== undefined;
  const hasKarmaFilter = karmaRange.min !== undefined || karmaRange.max !== undefined;
  const hasPostFilter = state.filters.postTypes.length > 0 && state.filters.postTypes.length !== defaultSearchPostTypes.length;
  const hasFilters = hasDateFilter || hasKarmaFilter || hasPostFilter || state.filters.events !== defaultSearchPageState.filters.events || !!state.filters.tagIds.length || !!state.filters.authorIds.length || !!state.kinds.length;
  const dateSummary = hasDateFilter ? `${dateRange.start === undefined ? "Beginning" : new Date(dateRange.start).toISOString().slice(0, 10)} – ${dateRange.end === undefined ? "Today" : new Date(dateRange.end).toISOString().slice(0, 10)}` : "All time";
  return {hasDateFilter, hasKarmaFilter, hasPostFilter, hasFilters, dateSummary};
}

export default function SearchPageFilters({state, setFilters, toggleFilter, clearFilters, filtersId, timeframeId, isDesktop, timeframePanel, children}: SearchPageFiltersProps) {
  const classes = useStyles(searchPageStyles);
  const {expandedFilters, mobileFiltersOpen: filtersOpen} = state;
  const timeframeOpen = filtersOpen && expandedFilters.includes('time');
  const {hasDateFilter, hasKarmaFilter, hasPostFilter, hasFilters, dateSummary} = summarizeSearchFilters(state);
  return (
    <aside id={filtersId} className={classes.sidebar} hidden={!filtersOpen} aria-label="Search options">
      <SearchFilterRow label="Timeframe" expandDirection={isDesktop ? "up" : "down"} summary={dateSummary} active={hasDateFilter} expanded={timeframeOpen}
        controlsId={timeframeId} onToggle={() => toggleFilter('time')} onReset={() => setFilters({dateRange: {}})} />
      {!isDesktop && timeframePanel}
      <SearchFilterRow label="Author" summary={state.filters.authorIds.length ? `${state.filters.authorIds.length} selected` : "Anyone"} active={!!state.filters.authorIds.length} expanded={expandedFilters.includes("authors")} onToggle={() => toggleFilter("authors")} onReset={() => setFilters({authorIds: []})}>
        <SearchAuthorsBar authorIds={state.filters.authorIds} onChange={(authorIds) => setFilters({authorIds})} />
      </SearchFilterRow>

      <div className={classes.filters}>
        <SearchFilterRow label="Wikitags" summary={state.filters.tagIds.length ? `${state.filters.tagIds.length} selected · match ${state.filters.tagMatch}` : "Any wikitag"} active={!!state.filters.tagIds.length} expanded={expandedFilters.includes("tags")} onToggle={() => toggleFilter("tags")} onReset={() => setFilters({tagIds: [], tagMatch: "any"})}>
          <SearchWikitagsBar match={state.filters.tagMatch} onMatchChange={(tagMatch) => setFilters({tagMatch})} tagIds={state.filters.tagIds} onChange={(tagIds) => setFilters({tagIds})} />
        </SearchFilterRow>
        <SearchFilterRow label="Events" summary={state.filters.events === "include" ? "Included" : state.filters.events === "exclude" ? "Excluded (default)" : "Only events"} active={state.filters.events !== defaultSearchPageState.filters.events} expanded={expandedFilters.includes("events")} onToggle={() => toggleFilter("events")} onReset={() => setFilters({events: defaultSearchPageState.filters.events})}>
          <SearchEventsBar value={state.filters.events} onChange={(events) => setFilters({events})} />
        </SearchFilterRow>
        <SearchFilterRow label="Post types" summary={hasPostFilter ? state.filters.postTypes.map(type => searchPostTypeLabels[type]).join(", ") : "All post types"} active={hasPostFilter} expanded={expandedFilters.includes("types")} onToggle={() => toggleFilter("types")} onReset={() => setFilters({postTypes: defaultSearchPostTypes})}>
          <SearchPostTypeBar className={classes.postTypes} selected={state.filters.postTypes} onChange={(postTypes) => setFilters({postTypes})} />
        </SearchFilterRow>
        <SearchFilterRow label="Karma" summary={hasKarmaFilter ? `${state.filters.karmaRange.min ?? "Any"} to ${state.filters.karmaRange.max ?? "any"}` : "Any karma"} active={hasKarmaFilter} expanded={expandedFilters.includes("karma")} onToggle={() => toggleFilter("karma")} onReset={() => setFilters({karmaRange: {}})}>
          <SearchKarmaBar value={state.filters.karmaRange} onChange={(karmaRange) => setFilters({karmaRange})} />
        </SearchFilterRow>
        {hasFilters && <button type="button" className={classNames(classes.clearFilters, classes.clearFiltersButton)} onClick={clearFilters}>Clear filters</button>}
      </div>
      {children}
    </aside>
  );
}
