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

const PostsItemNewCommentsWrapper = ({ terms, classes, post, treeOptions }: {
  terms: CommentsViewTerms,
  classes: ClassesType,
  post: PostsList,
  treeOptions: CommentTreeOptions,
}) => {
  const { loading, results } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-first',
    limit: 5,
  });

  const { loading: debateResponsesLoading, results: debateResponses } = useMulti({
    collectionName: "Comments",
    fragmentName: "CommentsList",
    terms: {
      view: 'recentDebateResponses',
      postId: post._id,
      limit: 2,
    },
    skip: !post.debate
  });

  const { Loading, CommentsList, NoContent } = Components

  const getCommentsListNode = (commentsList: CommentsList[] | undefined, loadingState: boolean, title: string, reverseOrder?: boolean) => {
    const lastCommentId = commentsList && commentsList[0]?._id
    const nestedComments = commentsList && unflattenComments(commentsList);

    if (reverseOrder) {
      nestedComments?.sort((a, b) => new Date(a.item.postedAt).getTime() - new Date(b.item.postedAt).getTime());
    }

    return (
      <div>
        {post.debate && <div className={classes.title}>{title}</div>}
        {nestedComments && <CommentsList
          treeOptions={{
            ...treeOptions,
            lastCommentId: lastCommentId,
            post: post,
          }}
          comments={nestedComments}
          startThreadTruncated={true}
        />}
        {loadingState && <Loading/>}
      </div>
    );
  };

  const noCommentsFound = !loading && results && !results.length;
  // If it's not a dialog, we want to return NoContent strictly based on noCommentsFound
  const noDebateResponsesFound = !post.debate
    ? true
    : !debateResponsesLoading && debateResponses && !debateResponses.length;

  if (noCommentsFound && noDebateResponsesFound) {
    return <NoContent>No comments found</NoContent>
  } 
  
  else {
    const commentsNode = getCommentsListNode(results, loading, 'User Comments');

    if (post.debate) {
      const debateResponsesNode = getCommentsListNode(debateResponses, debateResponsesLoading, 'Dialog Responses', true);

      return <div>
        {debateResponsesNode}
        {commentsNode}
      </div>;
    }

    return commentsNode;
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
