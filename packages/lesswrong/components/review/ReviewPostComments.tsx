import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { unflattenComments } from '../../lib/utils/unflatten';
import { singleLineStyles } from '../comments/SingleLineComment';
import { CONDENSED_MARGIN_BOTTOM } from '../comments/CommentFrame';
import Loading from "../vulcan-core/Loading";
import CommentsList from "../comments/CommentsList";
import SubSection from "../common/SubSection";
import CommentOnPostWithReplies from "../comments/CommentOnPostWithReplies";
import LoadMore from "../common/LoadMore";
import ContentStyles from "../common/ContentStyles";
import { maybeDate } from '@/lib/utils/dateUtils';
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const CommentWithRepliesFragmentMultiQuery = gql(`
  query multiCommentReviewPostCommentsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentWithRepliesFragment
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  title: {
    fontSize: "1rem",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginTop: 20,
    marginBottom: 12
  },
  singleLinePlaceholder: {
    height: 30,
    width: "100%",
    display: "flex",
    ...singleLineStyles(theme),
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    marginBottom: CONDENSED_MARGIN_BOTTOM,
    ...theme.typography.italic,
    paddingTop: 4,
  }
})

const ReviewPostComments = ({ terms, classes, title, post, singleLine, placeholderCount, hideReviewVoteButtons, singleLineCollapse }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
  title?: string,
  post: PostsList,
  singleLine?: boolean,
  placeholderCount?: number,
  hideReviewVoteButtons?: boolean
  singleLineCollapse?: boolean
}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(CommentWithRepliesFragmentMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 5,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
  });

  const results = data?.comments?.results;

  const lastCommentId = results && results[0]?._id
  const nestedComments = results ? unflattenComments(results) : [];
  const placeholderArray = new Array(placeholderCount).fill(1)

  if (!results?.length && !placeholderCount) return null

  return (
    <div>
      {title && <div className={classes.title}>
        {loading && <Loading/>}
        {results && results.length}{" "}
        {title}
        {(!results || results.length !== 1) && "s"}
      </div>}
      <SubSection>
        {loading && !results && <div>
          {placeholderArray.map((pl,i) =>
            <ContentStyles contentType="comment"
              className={classes.singleLinePlaceholder}
              key={`placeholder${post._id}${new Date()}${i}`}
            >
              Loading...
            </ContentStyles>
          )}
        </div>}
        {singleLine ? <CommentsList
          treeOptions={{
            lastCommentId: lastCommentId,
            highlightDate: maybeDate(post.lastVisitedAt ?? undefined),
            hideSingleLineMeta: true,
            hideReviewVoteButtons: hideReviewVoteButtons,
            singleLineCollapse: singleLineCollapse,
            enableHoverPreview: false,
            post: post,
            forceSingleLine: true
          }}
          comments={nestedComments}
          startThreadTruncated={true}
        />
        : <div>
          {results && results.map((comment) => <CommentOnPostWithReplies key={comment._id} comment={comment} post={post}/>)}
          <LoadMore {...loadMoreProps} />
        </div>}
      </SubSection>
    </div>
  );
};

export default registerComponent('ReviewPostComments', ReviewPostComments, {styles});


