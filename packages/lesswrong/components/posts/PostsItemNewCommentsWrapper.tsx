import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from '../../lib/utils/unflatten';
import { CommentTreeOptions } from '../comments/commentTree';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.text.dim700,
    marginBottom: 4
  }
})

const PostsItemNewCommentsWrapper = ({ terms, classes, title, post, treeOptions, forceSingleLine }: {
  terms: CommentsViewTerms,
  classes: ClassesType,
  title?: string,
  post: PostsList,
  treeOptions: CommentTreeOptions,
  forceSingleLine?: any,
}) => {
  const { loading, results, refetch } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-first',
    limit: 5,
  });

  const topLevelCommentIds = results?.map(result => result.topLevelCommentId) ?? [];

  const skipTopLevelComments = loading || !results;

  const { results: topLevelComments, refetch: refetchTopLevelComments } = useMulti({
    skip: skipTopLevelComments,
    collectionName: 'Comments',
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-first',
    terms: { view: 'commentsByIds', commentIds: topLevelCommentIds }
  });

  const refetchComments = async () => {
    await Promise.all([
      refetchTopLevelComments(),
      refetch()
    ]);
  };

  const { Loading, CommentsList, NoContent } = Components

  if (!loading && results && !results.length) {
    return <NoContent>No comments found</NoContent>
  } 
  
  else {
    const lastCommentId = results && results[0]?._id
    const nestedComments = results && unflattenComments(results);
    return (
      <div>
        {title && <div className={classes.title}>{title}</div>}
        {nestedComments && (skipTopLevelComments || topLevelComments) && <CommentsList
          treeOptions={{
            ...treeOptions,
            lastCommentId: lastCommentId,
            post: post,
            refetchAfterApproval: refetchComments
          }}
          comments={nestedComments}
          startThreadTruncated={true}
          forceSingleLine={forceSingleLine}
          topLevelComments={topLevelComments}
        />}
        {loading && <Loading/>}
      </div>
    );
  }
};

const PostsItemNewCommentsWrapperComponent = registerComponent(
  'PostsItemNewCommentsWrapper', PostsItemNewCommentsWrapper, {
    styles,
  }
);

declare global {
  interface ComponentTypes {
    PostsItemNewCommentsWrapper: typeof PostsItemNewCommentsWrapperComponent
  }
}
