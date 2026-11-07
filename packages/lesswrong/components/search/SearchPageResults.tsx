import React from 'react';
import classNames from 'classnames';
import { useStyles } from '@/components/hooks/useStyles';
import { SearchIndexCollectionName } from '@/lib/search/searchUtil';
import { SearchBarHit } from './useSearchResults';
import { searchKinds } from './SearchKindBar';
import { searchPageStyles } from './searchPageStyles';
import ErrorBoundary from '../common/ErrorBoundary';
import ExpandedUsersSearchHit from './ExpandedUsersSearchHit';
import ExpandedPostsSearchHit from './ExpandedPostsSearchHit';
import ExpandedCommentsSearchHit from './ExpandedCommentsSearchHit';
import ExpandedTagsSearchHit from './ExpandedTagsSearchHit';
import ExpandedSequencesSearchHit from './ExpandedSequencesSearchHit';

const hitComponents: Record<SearchIndexCollectionName, React.ComponentType<{hit: SearchBarHit, icon?: React.ReactNode, compact?: boolean}>> = {
  Users: ExpandedUsersSearchHit,
  Posts: ExpandedPostsSearchHit,
  Comments: ExpandedCommentsSearchHit,
  Tags: ExpandedTagsSearchHit,
  Sequences: ExpandedSequencesSearchHit,
};

interface SearchPageResultsProps {
  presentation: 'page' | 'modal';
  hits: SearchBarHit[];
  total: number | null;
  loading: boolean;
  error: boolean;
  loadMore: () => Promise<void>;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  sentinel: React.RefObject<HTMLDivElement | null>;
  selectHit: (type: SearchIndexCollectionName, hit: SearchBarHit, position: number) => void;
  hasDateFilter: boolean;
  hasFilters: boolean;
  clearDateFilter: () => void;
  clearFilters: () => void;
}

export default function SearchPageResults({presentation, hits, total, loading, error, loadMore, resultsRef, sentinel, selectHit, hasDateFilter, hasFilters, clearDateFilter, clearFilters}: SearchPageResultsProps) {
  const classes = useStyles(searchPageStyles);
  return (
    <div className={classes.resultsContent}>
      <ErrorBoundary>
        {total !== null && <div className={classes.resultCount} aria-live="polite">
          <span><strong>{total.toLocaleString()}</strong> result{total === 1 ? '' : 's'}</span>
        </div>}
        <div ref={resultsRef} role="group" aria-label="Search results" aria-busy={loading}>
          {hits.map((hit, position) => {
            const kind = searchKinds.find(({type}) => type.toLowerCase() === hit._index);
            if (!kind) return null;
            const Component = hitComponents[kind.type];
            return <ErrorBoundary key={`${hit._index}:${hit._id}`}>
              <div className={classes.result} data-search-result onClickCapture={(event) => {
                if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                if (event.target instanceof Element && event.target.closest('button')) return;
                selectHit(kind.type, hit, position);
              }}>
                <Component hit={hit} compact={presentation === "modal"} icon={
                  <span className={classes.resultIcon} role="img" aria-label={kind.label}><kind.Icon /></span>
                } />
              </div>
            </ErrorBoundary>;
          })}
        </div>
        <div ref={sentinel} />
        {loading && <div className={classes.status} role="status">Loading results…</div>}
        {error && <div className={classes.status} role="status">
          Could not load results. <button type="button" onClick={() => { void loadMore(); }}>Try again</button>
        </div>}
        {!loading && !error && total !== null && !hits.length && <div className={classes.status}>
          <div>No results found. Try a broader query or remove a filter.</div>
          {hasDateFilter && <button type="button" className={classes.clearFilters} onClick={clearDateFilter}>Remove timeframe</button>}
          {hasFilters && <button type="button" className={classNames(classes.clearFilters, classes.clearFiltersButton)} onClick={clearFilters}>Clear filters</button>}
        </div>}
      </ErrorBoundary>
    </div>
  );
}
