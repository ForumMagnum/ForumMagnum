import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import withErrorBoundary from '../common/withErrorBoundary';
import { CommentTreeNode } from '../../lib/utils/unflatten';
import AnswersList from "./AnswersList";
import NewAnswerCommentQuestionForm from "./NewAnswerCommentQuestionForm";
import CantCommentExplanation from "../comments/CantCommentExplanation";
import RelatedQuestionsList, { PostWithRelations } from "./RelatedQuestionsList";

const hasRelatedQuestionsFields = (
  post: PostsListWithVotes | PostsWithNavigation | PostsWithNavigationAndRevision
): post is (PostsListWithVotes | PostsWithNavigation | PostsWithNavigationAndRevision) & PostWithRelations => {
  return 'sourcePostRelations' in post && 'targetPostRelations' in post;
}

const PostsPageQuestionContent = ({post, answersTree, refetch}: {
  post: PostsListWithVotes|PostsWithNavigation|PostsWithNavigationAndRevision,
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
      {hasRelatedQuestionsFields(post) && <RelatedQuestionsList post={post} />}
    </div>
  )

};

export default registerComponent('PostsPageQuestionContent', PostsPageQuestionContent, {
  hocs: [withErrorBoundary]
});



