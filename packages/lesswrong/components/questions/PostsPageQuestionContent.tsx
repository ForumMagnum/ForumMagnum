import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import Users from '../../lib/collections/users/collection';
import withErrorBoundary from '../common/withErrorBoundary';

const MAX_ANSWERS_QUERIED = 100

const PostsPageQuestionContent = ({post, refetch}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  refetch: any,
}) => {
  const currentUser = useCurrentUser();
  const { AnswersList, NewAnswerCommentQuestionForm, CantCommentExplanation, RelatedQuestionsList } = Components
  return (
    <div>
      {(!currentUser || Users.isAllowedToComment(currentUser, post)) && !post.draft && <NewAnswerCommentQuestionForm post={post} refetch={refetch} />}
      {currentUser && !Users.isAllowedToComment(currentUser, post) &&
        <CantCommentExplanation post={post}/>
      }
      <AnswersList terms={{view: "questionAnswers", postId: post._id, limit: MAX_ANSWERS_QUERIED}} post={post}/>
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

