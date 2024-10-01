import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import withErrorBoundary from '../common/withErrorBoundary';
import { CommentTreeNode } from '../../lib/utils/unflatten';

const PostsPageQuestionContent = ({post, answersTree, refetch}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  answersTree: CommentTreeNode<CommentsList>[],
  refetch: () => void,
}) => {
  const currentUser = useCurrentUser();
  const { AnswersList, NewAnswerCommentQuestionForm, CantCommentExplanation, RelatedQuestionsList } = Components
  const author = post.user;
  return (
    <div>
      {(!currentUser || userIsAllowedToComment(currentUser, post, author, false)) && !post.draft && <NewAnswerCommentQuestionForm post={post} />}
      {currentUser && !userIsAllowedToComment(currentUser, post, author, false) &&
        <CantCommentExplanation post={post}/>
      }
      <AnswersList post={post} answersTree={answersTree} />
      <RelatedQuestionsList post={post} />
    </div>
  )

};

const PostsPageQuestionContentComponent = registerComponent('PostsPageQuestionContent', PostsPageQuestionContent, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    PostsPageQuestionContent: typeof PostsPageQuestionContentComponent
  }
}

