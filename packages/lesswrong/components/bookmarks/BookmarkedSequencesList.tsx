import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { gql } from '@/lib/generated/gql-codegen';
import { useQueryWithLoadMore } from '@/components/hooks/useQueryWithLoadMore';
import SectionTitle from '../common/SectionTitle';
import LoadMore from '../common/LoadMore';
import LibrarySequenceRow from '../sequences/LibrarySequenceRow';
import LibraryCollectionRow from '../sequences/LibraryCollectionRow';
import { defineStyles, useStyles } from '../hooks/useStyles';

const BookmarksLibraryItemMultiQuery = gql(`
  query multiBookmarkBookmarkedSequencesListQuery($selector: BookmarkSelector, $limit: Int, $enableTotal: Boolean) {
    bookmarks(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...BookmarksLibraryItemFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles('BookmarkedSequencesList', (theme: ThemeType) => ({
  panel: {
    background: theme.palette.panelBackground.default,
    boxShadow: `0 1px 5px ${theme.palette.boxShadowColor(0.025)}`,
    marginBottom: 24,
  },
}));

/**
 * The "Bookmarked Sequences" section of the /bookmarks page. Renders the
 * current user's bookmarked sequences and collections (merged, most recently
 * saved first) as library-style expandable rows. Hidden entirely when the
 * user has no sequence/collection bookmarks.
 */
const BookmarkedSequencesList = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const { data, loadMoreProps } = useQueryWithLoadMore(BookmarksLibraryItemMultiQuery, {
    variables: {
      selector: { myBookmarks: { collectionNames: ["Sequences", "Collections"] } },
      limit: 10,
      enableTotal: true,
    },
    skip: !currentUser?._id,
    fetchPolicy: "cache-and-network",
    itemsPerPage: 10,
  });

  const bookmarks = data?.bookmarks?.results;

  if (!currentUser || !bookmarks?.length) {
    return null;
  }

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

  return <AnalyticsContext pageSubSectionContext="bookmarkedSequencesList">
    <div>
      <SectionTitle title="Bookmarked Sequences" />
      <div className={classes.panel}>
        {bookmarks.map(bookmark => {
          if (bookmark.sequence) {
            const sequence = bookmark.sequence;
            return <LibrarySequenceRow
              key={bookmark._id}
              sequence={sequence}
              expanded={sequence._id === expandedRowId}
              onToggle={() => toggleSequenceRow(sequence._id)}
            />;
          }
          if (bookmark.collection) {
            const collection = bookmark.collection;
            return <LibraryCollectionRow
              key={bookmark._id}
              collection={collection}
              expanded={collection._id === expandedRowId}
              onToggle={() => toggleCollectionRow(collection._id)}
            />;
          }
          return null;
        })}
      </div>
      <LoadMore {...loadMoreProps} />
    </div>
  </AnalyticsContext>;
};

export default registerComponent('BookmarkedSequencesList', BookmarkedSequencesList, {
  hocs: [withErrorBoundary],
});
