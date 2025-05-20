import React, {  } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Typography } from '../common/Typography';
import Loading from '../vulcan-core/Loading';
import LoadMore from '../common/LoadMore';
import CommentsNode, { COMMENT_DRAFT_TREE_OPTIONS } from './CommentsNode';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useCommentLinkState } from './CommentsItem/useCommentLink';
import { useSingle } from '@/lib/crud/withSingle';

const styles = (theme: ThemeType) => ({
  heading: {
    display: 'flex',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 600,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  noResults: {
    marginLeft: 8,
    color: theme.palette.text.dim4,
  }
});

const CommentsDraftList = ({userId, postId, initialLimit, itemsPerPage, showTotal, silentIfEmpty, classes}: {
  userId: string,
  postId?: string,
  initialLimit?: number,
  itemsPerPage?: number,
  showTotal?: boolean,
  silentIfEmpty?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { linkedCommentId } = useCommentLinkState();

  const { document: linkedComment, loading: linkedCommentLoading } = useSingle({
    documentId: linkedCommentId,
    collectionName: "Comments",
    fragmentName: 'DraftComments',
    skip: !linkedCommentId
  });

  const { results: rawResults, loading: rawResultsLoading, totalCount, loadMoreProps } = useMulti({
    terms: {
      view: "draftComments",
      userId,
      postId,
      drafts: "drafts-only",
    },
    limit: initialLimit,
    itemsPerPage,
    enableTotal: true,
    collectionName: "Comments",
    fragmentName: 'DraftComments',
  });

  // Move the linked comment up to the top if given
  const results = ([linkedComment, ...(rawResults ?? [])]
    .filter(v => v) as DraftComments[])
    .reduce((acc, comment) => {
      if (!acc.some(existingComment => existingComment._id === comment._id)) {
        acc.push(comment);
      }
      return acc;
    }, [] as DraftComments[]);
  const loading = rawResultsLoading || (!linkedComment && linkedCommentLoading);
  const count = results.length;

  if (loading && !results?.length) {
    return !silentIfEmpty ? <Loading/> : null;
  }

  const showLoadMore = !loading && (count === undefined || totalCount === undefined || count < totalCount)

  return <AnalyticsContext pageElementContext="commentsDraftList">
    {(!silentIfEmpty || !!results?.length) && <Typography variant="headline" className={classes.heading}>Draft comments</Typography>}
    {(!silentIfEmpty && !loading && results?.length === 0) && (
      <Typography variant="body2" className={classes.noResults}>
        No comments to display.
      </Typography>
    )}
    {!!results && results.map((comment) => (
      <CommentsNode
        comment={comment}
        key={comment._id}
        // Don't auto-scroll to this comment if it appear elsewhere in the page, prefer showing it properly in context
        noAutoScroll={!!(postId && comment.parentCommentId)}
        treeOptions={{
          ...COMMENT_DRAFT_TREE_OPTIONS,
          singleLinePostTitle: !postId,
          showPostTitle: !postId,
          post: comment.post || undefined,
          showEditInContext: !postId,
        }}
      />
    ))}
    {loading && <Loading/>}
    {showLoadMore && <LoadMore {...{
      ...loadMoreProps,
      count,
      totalCount: showTotal ? totalCount : undefined,
    }} />}
  </AnalyticsContext>;
}

export default registerComponent(
  'CommentsDraftList',
  CommentsDraftList,
  {styles, stylePriority: 1},
);
