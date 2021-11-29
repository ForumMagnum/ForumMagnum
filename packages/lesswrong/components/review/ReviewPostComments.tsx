import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from '../../lib/utils/unflatten';
import { useRecordPostView } from '../common/withRecordPostView';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    fontSize: "1rem",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginTop: 20,
    marginBottom: 12
  }
})

const ReviewPostComments = ({ terms, classes, title, post, singleLine }: {
  terms: CommentsViewTerms,
  classes: ClassesType,
  title?: string,
  post: PostsList,
  singleLine?: boolean
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
  
  const { Loading, CommentsList, SubSection, CommentWithReplies, LoadMore } = Components

  if (!loading && results && !results.length) {
    return null
  }

  // TODO: This doesn't quite work yet. Not sure why – Ray
  const markAsRead = () => {
    recordPostView({post, extraEventProperties: {type: "markAsRead"}})
    setMarkedVisitedAt(new Date()) 
  }
  
  const lastCommentId = results && results[0]?._id
  const nestedComments = unflattenComments(results);
  return (
    <div>
      {title && <div className={classes.title}>
        {loading && <Loading/>}
        {results && results.length}{" "}
        {title}
        {(results && results.length > 1) && "s"}
      </div>}
      <SubSection>
        {singleLine ? <CommentsList
          treeOptions={{
            lastCommentId: lastCommentId,
            highlightDate: markedVisitedAt || post.lastVisitedAt,
            hideSingleLineMeta: true,
            enableHoverPreview: false,
            markAsRead: markAsRead,
            post: post,
          }}
          comments={nestedComments}
          startThreadTruncated={true}
          forceSingleLine
        />
        : <div>
          {results && results.map((comment) => <CommentWithReplies key={comment._id} comment={comment} post={post}/>)}
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
