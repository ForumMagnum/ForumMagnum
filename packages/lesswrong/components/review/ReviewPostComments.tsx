import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from '../../lib/utils/unflatten';
import { useRecordPostView } from '../common/withRecordPostView';
import { singleLineStyles } from '../comments/SingleLineComment';
import { CONDENSED_MARGIN_BOTTOM } from '../comments/CommentFrame';

const styles = (theme: ThemeType): JssStyles => ({
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
    ...singleLineStyles(theme),
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    marginBottom: CONDENSED_MARGIN_BOTTOM,
    fontStyle: "italic",
    paddingTop: 4,
  }
})

const ReviewPostComments = ({ terms, classes, title, post, singleLine, placeholderCount, hideReviewVoteButtons, singleLineCollapse }: {
  terms: CommentsViewTerms,
  classes: ClassesType,
  title?: string,
  post: PostsList,
  singleLine?: boolean,
  placeholderCount?: number,
  hideReviewVoteButtons?: boolean
  singleLineCollapse?: boolean
}) => {
  const [markedVisitedAt, setMarkedVisitedAt] = React.useState<Date|null>(null);
  const { recordPostView } = useRecordPostView(post)
  const { loading, results, loadMoreProps } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    limit: 5
  });
  
  const { Loading, CommentsList, SubSection, CommentOnPostWithReplies, LoadMore, ContentStyles } = Components
  
  // TODO: This doesn't quite work yet. Not sure why - Ray
  const markAsRead = () => {
    recordPostView({post, extraEventProperties: {type: "markAsRead"}})
    setMarkedVisitedAt(new Date())
  }
  
  const lastCommentId = results && results[0]?._id
  const nestedComments = results ? unflattenComments(results) : [];
  const placeholderArray = new Array(placeholderCount).fill(1)

  return (
    <div>
      {title && <div className={classes.title}>
        {loading && <Loading/>}
        {results && results.length}{" "}
        {title}
        {(!results || results.length > 1) && "s"}
      </div>}
      <SubSection>
        {loading && <div>
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
            highlightDate: markedVisitedAt || post.lastVisitedAt,
            hideSingleLineMeta: true,
            hideReviewVoteButtons: hideReviewVoteButtons,
            singleLineCollapse: singleLineCollapse,
            enableHoverPreview: false,
            markAsRead: markAsRead,
            post: post,
          }}
          comments={nestedComments}
          startThreadTruncated={true}
          forceSingleLine
        />
        : <div>
          {results && results.map((comment) => <CommentOnPostWithReplies key={comment._id} comment={comment} post={post}/>)}
          <LoadMore {...loadMoreProps} />
        </div>}
      </SubSection>
    </div>
  );
};

const ReviewPostCommentsComponent = registerComponent('ReviewPostComments', ReviewPostComments, {styles});

declare global {
  interface ComponentTypes {
    ReviewPostComments: typeof ReviewPostCommentsComponent
  }
}
