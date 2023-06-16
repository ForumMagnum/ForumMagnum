import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import withErrorBoundary from '../common/withErrorBoundary';

const PostsPageQuestionContent = ({post, answers, refetch}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  answers: CommentsList[],
  refetch: ()=>void,
}) => {
  const currentUser = useCurrentUser();
  const { AnswersList, NewAnswerCommentQuestionForm, CantCommentExplanation, RelatedQuestionsList } = Components
  const author = post.user;
  return (
    <div>
      {(!currentUser || userIsAllowedToComment(currentUser, post, author, false)) && !post.draft && <NewAnswerCommentQuestionForm post={post} refetch={refetch} />}
      {currentUser && !userIsAllowedToComment(currentUser, post, author, false) &&
        <CantCommentExplanation post={post}/>
      }
      <AnswersList post={post} answers={answers} />
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

