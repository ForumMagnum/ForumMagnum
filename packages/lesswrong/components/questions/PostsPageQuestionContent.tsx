import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import withErrorBoundary from '../common/withErrorBoundary';
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { AnswersList } from "./AnswersList";
import { NewAnswerCommentQuestionForm } from "./NewAnswerCommentQuestionForm";
import { CantCommentExplanation } from "../comments/CantCommentExplanation";
import { RelatedQuestionsList } from "./RelatedQuestionsList";

const PostsPageQuestionContentInner = ({post, answersTree, refetch}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  answersTree: CommentTreeNode<CommentsList>[],
  refetch: () => void,
}) => {
  const currentUser = useCurrentUser();
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

export const PostsPageQuestionContent = registerComponent('PostsPageQuestionContent', PostsPageQuestionContentInner, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    PostsPageQuestionContent: typeof PostsPageQuestionContent
  }
}

