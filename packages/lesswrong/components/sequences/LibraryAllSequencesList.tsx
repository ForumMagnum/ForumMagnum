import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import { useTracking } from '../../lib/analyticsEvents';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useQueryWithLoadMore } from '../hooks/useQueryWithLoadMore';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { LIBRARY_TOPICS } from '@/lib/collections/sequences/libraryTopics';
import LibrarySequenceRow from './LibrarySequenceRow';
import LibraryCollectionRow from './LibraryCollectionRow';
import LibraryFilterPopover, { LibraryFilterSettings, defaultLibraryFilterSettings } from './LibraryFilterPopover';
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
      ...LibrarySequenceRowFragment
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  const allTagsChipRef = useRef<HTMLSpanElement | null>(null);

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

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(LibraryAllSequencesQuery, {
    variables: {
      selector: { librarySequences: {
        ...(topics.length > 0 && { libraryTopics: topics }),
        ...(curatedOnly && { curatedOnly: true }),
        sortBy,
      } },
      limit: LIST_ITEMS_PER_PAGE,
      enableTotal: true,
    },
    itemsPerPage: LIST_ITEMS_PER_PAGE,
    skip: searchActive,
  });
  const { data: searchData, loading: searchLoading } = useQuery(LibrarySequencesSearchQuery, {
    variables: {
      query: searchQueryText,
      libraryTopics: topics.length > 0 ? topics : null,
      curatedOnly,
      sortBy,
      limit: SEARCH_RESULTS_LIMIT,
    },
    skip: !searchActive,
  });
  const { data: collectionsData } = useQuery(LibraryCollectionsQuery);

  const results = searchActive ? searchData?.librarySequencesSearch : data?.sequences?.results;
  const resultsLoading = searchActive ? searchLoading : loading;
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

  const toggleTopicChip = (topic: string) => {
    const newTopics = topics.includes(topic)
      ? topics.filter(t => t !== topic)
      : [...topics, topic];
    applyFilterSettings({ ...filterSettings, topics: newTopics }, 'chip');
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

  const popoverFiltersActive = topics.length > 0 || curatedOnly || sortBy !== 'recommended';
  const listEmpty = !resultsLoading && !results?.length && !collectionResults?.length;

  // Selected topics first, so active filters (e.g. picked in the popover) are
  // never hidden in the chip row's clipped tail.
  const orderedTopicChips = [...LIBRARY_TOPICS].sort((a, b) =>
    Number(topics.includes(b)) - Number(topics.includes(a)));

  return <div>
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
    <div className={classes.filterRow}>
      <div className={classes.chipRow}>
        <span
          className={classNames(classes.chip, topics.length === 0 && classes.chipSelected)}
          onClick={() => applyFilterSettings({ ...filterSettings, topics: [] }, 'chip')}
        >
          All
        </span>
        {orderedTopicChips.map(topic => <span
          key={topic}
          className={classNames(classes.chip, topics.includes(topic) && classes.chipSelected)}
          onClick={() => toggleTopicChip(topic)}
        >
          {topic}
        </span>)}
      </div>
      <span
        ref={allTagsChipRef}
        className={classNames(classes.chip, classes.allTagsChip, popoverFiltersActive && classes.allTagsChipActive)}
        onClick={() => setPopoverOpen(!popoverOpen)}
      >
        All tags
        <ExpandMoreIcon className={classes.allTagsChevron} />
      </span>
      {popoverOpen && <LibraryFilterPopover
        anchorEl={allTagsChipRef.current}
        settings={filterSettings}
        onApply={settings => applyFilterSettings(settings, 'popover')}
        onClose={() => setPopoverOpen(false)}
      />}
    </div>
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
    {!searchActive && totalCount !== undefined && loadMoreProps.count < totalCount && <a
      className={classes.loadMore}
      onClick={() => loadMoreProps.loadMore()}
    >
      Load More ({loadMoreProps.count}/{totalCount})
    </a>}
  </div>;
};

export default LibraryAllSequencesList;
