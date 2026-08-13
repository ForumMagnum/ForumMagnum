import React, { useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useQueryWithLoadMore } from '../hooks/useQueryWithLoadMore';
import LibrarySequenceRow from './LibrarySequenceRow';
import LibraryCollectionRow from './LibraryCollectionRow';
import Loading from '../vulcan-core/Loading';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const LIST_ITEMS_PER_PAGE = 12;

const LibraryAllSequencesQuery = gql(`
  query LibraryAllSequences($limit: Int, $enableTotal: Boolean) {
    sequences(selector: { librarySequences: {} }, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...LibrarySequenceRowFragment
      }
      totalCount
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
  panel: {
    background: theme.palette.panelBackground.default,
    boxShadow: `0 1px 5px ${theme.palette.boxShadowColor(0.025)}`,
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

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(LibraryAllSequencesQuery, {
    variables: { limit: LIST_ITEMS_PER_PAGE, enableTotal: true },
    itemsPerPage: LIST_ITEMS_PER_PAGE,
  });
  const { data: collectionsData } = useQuery(LibraryCollectionsQuery);
  const results = data?.sequences?.results;
  const totalCount = data?.sequences?.totalCount ?? undefined;
  const collectionResults = collectionsData?.collections?.results;

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

  if (!results) {
    return loading ? <Loading /> : null;
  }

  return <div>
    <div className={classes.panel}>
      {collectionResults?.map(collection => <LibraryCollectionRow
        key={collection._id}
        collection={collection}
        expanded={collection._id === expandedRowId}
        onToggle={() => toggleCollectionRow(collection._id)}
      />)}
      {results.map(sequence => <LibrarySequenceRow
        key={sequence._id}
        sequence={sequence}
        expanded={sequence._id === expandedRowId}
        onToggle={() => toggleSequenceRow(sequence._id)}
      />)}
    </div>
    {totalCount !== undefined && loadMoreProps.count < totalCount && <a
      className={classes.loadMore}
      onClick={() => loadMoreProps.loadMore()}
    >
      Load More ({loadMoreProps.count}/{totalCount})
    </a>}
  </div>;
};

export default LibraryAllSequencesList;
