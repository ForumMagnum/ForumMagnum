import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import SectionTitle from "../common/SectionTitle";
import CommentsNode from "../comments/CommentsNode";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const BookmarksWithCommentFragmentMultiQuery = gql(`
  query multiBookmarkBookmarkedCommentsListQuery($selector: BookmarkSelector, $limit: Int, $enableTotal: Boolean) {
    bookmarks(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...BookmarksWithCommentFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles("BookmarkedCommentsList", () => ({
  root: {
    marginBottom: 20,
  },
}));

const BookmarkedCommentsList = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { data, loadMoreProps } = useQueryWithLoadMore(BookmarksWithCommentFragmentMultiQuery, {
    variables: {
      selector: { myBookmarkedComments: {} },
      limit: 10,
      enableTotal: false,
    },
    skip: !currentUser?._id,
    fetchPolicy: "cache-and-network",
    itemsPerPage: 20,
  });

  const bookmarkedComments = data?.bookmarks?.results
    ?.map(bookmark => bookmark.comment)
    .filter(comment => !!comment);

  if (!currentUser || !bookmarkedComments?.length) return null;

  return <AnalyticsContext pageSubSectionContext="bookmarkedCommentsList">
    <div className={classes.root}>
      <SectionTitle title="Bookmarked Comments"/>
      {bookmarkedComments.map(comment =>
        <CommentsNode
          key={comment._id}
          comment={comment}
          treeOptions={{
            condensed: true,
            forceSingleLine: true,
            singleLineCollapse: true,
            singleLinePostTitle: true,
            showPostTitle: true,
            post: comment.post ?? undefined,
            tag: comment.tag ?? undefined,
          }}
        />
      )}
      <LoadMore {...loadMoreProps} />
    </div>
  </AnalyticsContext>
}

export default BookmarkedCommentsList;
