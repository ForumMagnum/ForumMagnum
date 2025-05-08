import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { CommentTreeOptions } from '../comments/commentTree';

const styles = (theme: ThemeType) => ({})

const PostsDialogItemNewCommentsListInner = ({ terms, post, treeOptions }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
  post: PostsList & { debate: true },
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
  });

  const { NoContent, PostsItemNewCommentsListNode } = Components

  const noCommentsFound = !loading && results && !results.length;
  const noDebateResponsesFound = !debateResponsesLoading && debateResponses && !debateResponses.length;

  if (noCommentsFound && noDebateResponsesFound) {
    return <NoContent>No comments found</NoContent>
  } 
  
  else {
    const commentsNodeProps: React.ComponentProps<typeof PostsItemNewCommentsListNode> = {
      commentsList: results,
      loadingState: loading,
      post,
      treeOptions,
      title: 'User Comments'
    };

    const dialogResponsesNodeProps: React.ComponentProps<typeof PostsItemNewCommentsListNode> = {
      commentsList: debateResponses,
      loadingState: debateResponsesLoading,
      post,
      treeOptions,
      title: 'Dialog Responses',
      reverseOrder: true
    };

    return <div>
      <PostsItemNewCommentsListNode {...dialogResponsesNodeProps} />
      <PostsItemNewCommentsListNode {...commentsNodeProps} />
    </div>;
  }
};

export const PostsDialogItemNewCommentsList = registerComponent(
  'PostsDialogItemNewCommentsList', PostsDialogItemNewCommentsListInner, {
    styles,
  }
);

declare global {
  interface ComponentTypes {
    PostsDialogItemNewCommentsList: typeof PostsDialogItemNewCommentsList
  }
}
