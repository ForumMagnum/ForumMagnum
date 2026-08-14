import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import { useTracking } from '../../lib/analyticsEvents';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useQueryWithLoadMore } from '../hooks/useQueryWithLoadMore';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { LIBRARY_TOPICS } from '@/lib/collections/sequences/libraryTopics';
import { isLibraryRankingSort } from '@/lib/collections/sequences/librarySortOptions';
import LibrarySequenceRow from './LibrarySequenceRow';
import LibraryCollectionRow from './LibraryCollectionRow';
import LibraryFilterPopover, { LibraryFilterSettings, defaultLibraryFilterSettings } from './LibraryFilterPopover';
import SequencesNewButton from './SequencesNewButton';
import SettingsButton from '../icons/SettingsButton';
import Loading from '../vulcan-core/Loading';
import SearchIcon from '@/lib/vendor/@material-ui/icons/src/Search';
import ExpandMoreIcon from '@/lib/vendor/@material-ui/icons/src/ExpandMore';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const LIST_ITEMS_PER_PAGE = 12;
const SEARCH_RESULTS_LIMIT = 50;

const LibraryAllSequencesQuery = gql(`
  query LibraryAllSequences($selector: SequenceSelector, $limit: Int, $enableTotal: Boolean) {
    sequences(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...LibrarySequenceRowFragment
      }
      totalCount
    }
  }
`);

const LibrarySequencesSearchQuery = gql(`
  query LibrarySequencesSearch($query: String!, $libraryTopics: [String!], $curatedOnly: Boolean, $sortBy: String, $limit: Int) {
    librarySequencesSearch(query: $query, libraryTopics: $libraryTopics, curatedOnly: $curatedOnly, sortBy: $sortBy, limit: $limit) {
      results {
        ...LibrarySequenceRowFragment
      }
    }
  }
`);

const LibraryCollectionsQuery = gql(`
  query LibraryCollections {
    collections(selector: { libraryCollections: {} }, limit: 10) {
      results {
        ...LibraryCollectionRowFragment
      }
    }
  }
`);

const styles = defineStyles('LibraryAllSequencesList', (theme: ThemeType) => ({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  headerLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: '.6px',
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  // Flags filters that are only visible inside the popover (curated-only,
  // non-default sort), which otherwise silently filter/reorder the list.
  settingsButtonActive: {
    '&&': {
      color: theme.palette.primary.main,
    },
  },
  searchField: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.faint,
    borderRadius: 3,
    padding: '8px 12px',
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 18,
    color: theme.palette.text.dim,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13.5,
    color: theme.palette.text.normal,
    '&::placeholder': {
      color: theme.palette.text.dim,
    },
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: 10,
  },
  // Keep the "All tags" chip on the first line when the chip row wraps
  filterRowExpanded: {
    alignItems: 'flex-start',
  },
  chipRow: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexWrap: 'nowrap',
    gap: '6px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  chipRowExpanded: {
    flexWrap: 'wrap',
  },
  chip: {
    flex: 'none',
    background: theme.palette.grey[200],
    borderRadius: 3,
    padding: '4px 10px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.normal,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': {
      background: theme.palette.grey[300],
    },
  },
  chipSelected: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      background: theme.palette.primary.dark,
    },
  },
  allTagsChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  allTagsChipActive: {
    background: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
    padding: '3px 9px',
    '&:hover': {
      background: theme.palette.panelBackground.default,
    },
  },
  allTagsChevron: {
    fontSize: 15,
    marginRight: -3,
  },
  allTagsChevronExpanded: {
    transform: 'rotate(180deg)',
  },
  // Reserve a viewport's worth of height below the search bar so the document
  // can't get shorter than the scroll position while typing a search (which
  // would clamp the scroll and make the search bar jump around on screen).
  results: {
    minHeight: '100vh',
  },
  panel: {
    background: theme.palette.panelBackground.default,
    boxShadow: `0 1px 5px ${theme.palette.boxShadowColor(0.025)}`,
  },
  emptyMessage: {
    padding: '18px 16px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13.5,
    color: theme.palette.text.dim,
  },
  loadMore: {
    display: 'inline-block',
    marginTop: 10,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    fontWeight: 500,
    color: theme.palette.primary.main,
    cursor: 'pointer',
  },
}));

const LibraryAllSequencesList = () => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [filterSettings, setFilterSettings] = useState<LibraryFilterSettings>(defaultLibraryFilterSettings);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const settingsAnchorRef = useRef<HTMLSpanElement | null>(null);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const updateDebouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchText(value);
    if (value) {
      captureEvent('librarySequencesSearched', { queryLength: value.length });
    }
  }, {
    rateLimitMs: 300,
    callOnLeadingEdge: false,
    onUnmount: 'cancelPending',
    allowExplicitCallAfterUnmount: false,
  });

  const searchQueryText = debouncedSearchText.trim();
  const searchActive = searchQueryText.length > 0;
  const { topics, curatedOnly, sortBy } = filterSettings;
  // Sequence topics are derived from post tags via SQL joins the view
  // selector can't express, so a topic filter routes through the search
  // resolver too (with an empty query when the user isn't searching), as do
  // the bake-off ranking sorts (computed scores, not sortable view columns).
  const useSearchResolver = searchActive || topics.length > 0 || isLibraryRankingSort(sortBy);
  const popoverFiltersActive = curatedOnly || sortBy !== 'recommended';

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(LibraryAllSequencesQuery, {
    variables: {
      selector: { librarySequences: {
        ...(curatedOnly && { curatedOnly: true }),
        sortBy,
      } },
      limit: LIST_ITEMS_PER_PAGE,
      enableTotal: true,
    },
    itemsPerPage: LIST_ITEMS_PER_PAGE,
    skip: useSearchResolver,
  });
  const {
    data: searchData,
    previousData: previousSearchData,
    loading: searchLoading,
    loadMoreProps: searchLoadMoreProps,
  } = useQueryWithLoadMore(LibrarySequencesSearchQuery, {
    variables: {
      query: searchQueryText,
      libraryTopics: topics.length > 0 ? topics : null,
      curatedOnly,
      sortBy,
      limit: SEARCH_RESULTS_LIMIT,
    },
    itemsPerPage: SEARCH_RESULTS_LIMIT,
    skip: !useSearchResolver,
  });
  const { data: collectionsData } = useQuery(LibraryCollectionsQuery);

  // While a new search is in flight, keep showing the previous results so the
  // list doesn't collapse to a spinner on every debounced keystroke.
  const searchResults = searchData?.librarySequencesSearch?.results ?? previousSearchData?.librarySequencesSearch?.results;
  const results = useSearchResolver ? searchResults : data?.sequences?.results;
  const resultsLoading = useSearchResolver ? searchLoading : loading;
  const totalCount = data?.sequences?.totalCount ?? undefined;

  // Collections are a handful of rows fetched unfiltered; apply the search
  // text and topic filter to them client-side. "Curated only" intentionally
  // keeps them visible: they're all editorially curated (the mock stars them).
  const collectionResults = collectionsData?.collections?.results?.filter(collection =>
    (!searchActive || (collection.title ?? '').toLowerCase().includes(searchQueryText.toLowerCase())) &&
    (topics.length === 0 || (!!collection.libraryTopic && topics.includes(collection.libraryTopic)))
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    updateDebouncedSearch(event.target.value);
  };

  const applyFilterSettings = (settings: LibraryFilterSettings, source: string) => {
    setFilterSettings(settings);
    setPopoverOpen(false);
    captureEvent('libraryFilterChanged', { ...settings, source });
  };

  // Chips are single-select: clicking a chip replaces the selection, and
  // clicking the selected chip deselects it (equivalent to "All").
  const selectTopicChip = (topic: string) => {
    const newTopics = topics.includes(topic) ? [] : [topic];
    applyFilterSettings({ ...filterSettings, topics: newTopics }, 'chip');
  };

  const toggleTagsExpanded = () => {
    setTagsExpanded(!tagsExpanded);
    captureEvent('libraryAllTagsToggled', { expanded: !tagsExpanded });
  };

  const toggleSequenceRow = (sequenceId: string) => {
    const nowExpanded = expandedRowId !== sequenceId;
    setExpandedRowId(nowExpanded ? sequenceId : null);
    captureEvent('librarySequenceRowToggled', { sequenceId, expanded: nowExpanded });
  };

  const toggleCollectionRow = (collectionId: string) => {
    const nowExpanded = expandedRowId !== collectionId;
    setExpandedRowId(nowExpanded ? collectionId : null);
    captureEvent('libraryCollectionRowToggled', { collectionId, expanded: nowExpanded });
  };

  const listEmpty = !resultsLoading && !results?.length && !collectionResults?.length;

  // Selected topics first, so active filters are never hidden in the collapsed
  // chip row's clipped tail.
  const orderedTopicChips = [...LIBRARY_TOPICS].sort((a, b) =>
    Number(topics.includes(b)) - Number(topics.includes(a)));

  return <div>
    <div className={classes.header}>
      <span className={classes.headerLabel}>All Sequences</span>
      <div className={classes.headerActions}>
        <span ref={settingsAnchorRef}>
          <SettingsButton
            className={classNames(popoverFiltersActive && classes.settingsButtonActive)}
            onClick={() => setPopoverOpen(!popoverOpen)}
          />
        </span>
        <SequencesNewButton />
      </div>
    </div>
    {popoverOpen && <LibraryFilterPopover
      anchorEl={settingsAnchorRef.current}
      settings={filterSettings}
      onApply={settings => applyFilterSettings(settings, 'popover')}
      onClose={() => setPopoverOpen(false)}
    />}
    <div className={classes.searchField}>
      <SearchIcon className={classes.searchIcon} />
      <input
        type="text"
        className={classes.searchInput}
        placeholder="Search sequences…"
        value={searchText}
        onChange={handleSearchChange}
      />
    </div>
    <div className={classNames(classes.filterRow, tagsExpanded && classes.filterRowExpanded)}>
      <div className={classNames(classes.chipRow, tagsExpanded && classes.chipRowExpanded)}>
        <span
          className={classNames(classes.chip, topics.length === 0 && classes.chipSelected)}
          onClick={() => applyFilterSettings({ ...filterSettings, topics: [] }, 'chip')}
        >
          All
        </span>
        {orderedTopicChips.map(topic => <span
          key={topic}
          className={classNames(classes.chip, topics.includes(topic) && classes.chipSelected)}
          onClick={() => selectTopicChip(topic)}
        >
          {topic}
        </span>)}
      </div>
      <span
        className={classNames(classes.chip, classes.allTagsChip, tagsExpanded && classes.allTagsChipActive)}
        onClick={toggleTagsExpanded}
      >
        All tags
        <ExpandMoreIcon className={classNames(classes.allTagsChevron, tagsExpanded && classes.allTagsChevronExpanded)} />
      </span>
    </div>
    <div className={classes.results}>
      <div className={classes.panel}>
        {collectionResults?.map(collection => <LibraryCollectionRow
          key={collection._id}
          collection={collection}
          expanded={collection._id === expandedRowId}
          onToggle={() => toggleCollectionRow(collection._id)}
        />)}
        {results?.map(sequence => <LibrarySequenceRow
          key={sequence._id}
          sequence={sequence}
          expanded={sequence._id === expandedRowId}
          onToggle={() => toggleSequenceRow(sequence._id)}
        />)}
        {resultsLoading && !results && <Loading />}
        {listEmpty && <div className={classes.emptyMessage}>
          {searchActive ? 'No sequences match your search.' : 'No sequences match the selected filters.'}
        </div>}
      </div>
      {!useSearchResolver && totalCount !== undefined && loadMoreProps.count < totalCount && <a
        className={classes.loadMore}
        onClick={() => loadMoreProps.loadMore()}
      >
        Load More ({loadMoreProps.count}/{totalCount})
      </a>}
      {useSearchResolver && !searchLoadMoreProps.hidden && <a
        className={classes.loadMore}
        onClick={() => searchLoadMoreProps.loadMore()}
      >
        Load More
      </a>}
    </div>
  </div>;
};

export default LibraryAllSequencesList;
