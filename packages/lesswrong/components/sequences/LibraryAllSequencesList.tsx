import React, { useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { gql } from '@/lib/generated/gql-codegen';
import { useQueryWithLoadMore } from '../hooks/useQueryWithLoadMore';
import LibrarySequenceRow from './LibrarySequenceRow';
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
  const [expandedSequenceId, setExpandedSequenceId] = useState<string | null>(null);

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(LibraryAllSequencesQuery, {
    variables: { limit: LIST_ITEMS_PER_PAGE, enableTotal: true },
    itemsPerPage: LIST_ITEMS_PER_PAGE,
  });
  const results = data?.sequences?.results;
  const totalCount = data?.sequences?.totalCount ?? undefined;

  const toggleRow = (sequenceId: string) => {
    const nowExpanded = expandedSequenceId !== sequenceId;
    setExpandedSequenceId(nowExpanded ? sequenceId : null);
    captureEvent('librarySequenceRowToggled', { sequenceId, expanded: nowExpanded });
  };

  if (!results) {
    return loading ? <Loading /> : null;
  }

  return <div>
    <div className={classes.panel}>
      {results.map(sequence => <LibrarySequenceRow
        key={sequence._id}
        sequence={sequence}
        expanded={sequence._id === expandedSequenceId}
        onToggle={() => toggleRow(sequence._id)}
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
