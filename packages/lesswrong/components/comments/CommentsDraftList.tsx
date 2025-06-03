import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Typography } from '../common/Typography';
import Loading from '../vulcan-core/Loading';
import LoadMore from '../common/LoadMore';
import CommentsNode, { COMMENT_DRAFT_TREE_OPTIONS } from './CommentsNode';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useCommentLinkState } from './CommentsItem/useCommentLink';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@apollo/client';
import { useQueryWithLoadMore } from '../hooks/useQueryWithLoadMore';

const LinkedDraftCommentQuery = gql(`
  query LinkedDraftCommentQuery($documentId: String!) {
    comment(selector: { _id: $documentId }) {
      result {
        ...DraftComments
      }
    }
  }
`);

const DraftCommentsQuery = gql(`
  query DraftCommentsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...DraftComments
      }
      totalCount
    }
  }
`);

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

  // Usually, there will be no linked comment (`?commentId=...` in the url), and the rawResults below
  // will be displayed directly. If there is a linked comment, bump it to the top of the list so
  // we know we can scroll to it.
  const { data: linkedCommentData, loading: linkedCommentLoading } = useQuery(LinkedDraftCommentQuery, {
    variables: {
      documentId: linkedCommentId,
    },
    skip: !linkedCommentId,
  });

  const linkedComment = linkedCommentData?.comment?.result;

  const { data: draftCommentsData, loading: draftCommentsLoading, loadMoreProps } = useQueryWithLoadMore(DraftCommentsQuery, {
    variables: {
      selector: {
        draftComments: {
          userId,
          postId,
          drafts: "drafts-only",  
        },
      },
      limit: initialLimit,
      enableTotal: true,
    },
    itemsPerPage,
  });

  const rawResults = draftCommentsData?.comments?.results;
  const totalCount = draftCommentsData?.comments?.totalCount ?? undefined;

  // Move the linked comment up to the top if given
  const results = ([linkedComment, ...(rawResults ?? [])]
    .filter(v => v?.draft) as DraftComments[])
    .reduce((acc, comment) => {
      if (!acc.some(existingComment => existingComment._id === comment._id)) {
        acc.push(comment);
      }
      return acc;
    }, [] as DraftComments[]);
  const loading = draftCommentsLoading || (!linkedComment && linkedCommentLoading);
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
        // Don't auto-scroll to this comment if it probably appears as a reply elsewhere in the page, prefer showing it properly in context
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
