import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from '../../lib/utils/unflatten';
import { singleLineStyles } from '../comments/SingleLineComment';
import { CONDENSED_MARGIN_BOTTOM } from '../comments/CommentFrame';

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

const ReviewPostCommentsInner = ({ terms, classes, title, post, singleLine, placeholderCount, hideReviewVoteButtons, singleLineCollapse }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
  title?: string,
  post: PostsList,
  singleLine?: boolean,
  placeholderCount?: number,
  hideReviewVoteButtons?: boolean
  singleLineCollapse?: boolean
}) => {
  const { loading, results, loadMoreProps } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    limit: 5
  });
  
  const { Loading, CommentsList, SubSection, CommentOnPostWithReplies, LoadMore, ContentStyles } = Components
  
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
            highlightDate: post.lastVisitedAt ?? undefined,
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

export const ReviewPostComments = registerComponent('ReviewPostComments', ReviewPostCommentsInner, {styles});

declare global {
  interface ComponentTypes {
    ReviewPostComments: typeof ReviewPostComments
  }
}
