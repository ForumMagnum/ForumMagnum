import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from '../../lib/utils/unflatten';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    fontSize: "1rem",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginTop: 20,
    marginBottom: 12
  }
})

const PostReviewsAndNominations = ({ terms, classes, title, post, singleLine }: {
  terms: CommentsViewTerms,
  classes: ClassesType,
  title?: string,
  post: PostsList,
  singleLine?: boolean,
}) => {

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
            hideSingleLineMeta: true,
            enableHoverPreview: false,
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

const PostReviewsAndNominationsComponent = registerComponent('PostReviewsAndNominations', PostReviewsAndNominations, {styles});

declare global {
  interface ComponentTypes {
    PostReviewsAndNominations: typeof PostReviewsAndNominationsComponent
  }
}

