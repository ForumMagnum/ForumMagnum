import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import withErrorBoundary from '../common/withErrorBoundary';

const PostsPageQuestionContent = ({post, refetch}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  refetch: any,
}) => {
  const currentUser = useCurrentUser();
  const { AnswersList, NewAnswerCommentQuestionForm, CantCommentExplanation, RelatedQuestionsList } = Components
  return (
    <div>
      {(!currentUser || userIsAllowedToComment(currentUser, post)) && !post.draft && <NewAnswerCommentQuestionForm post={post} refetch={refetch} />}
      {currentUser && !userIsAllowedToComment(currentUser, post) &&
        <CantCommentExplanation post={post}/>
      }
      <AnswersList post={post}/>
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

