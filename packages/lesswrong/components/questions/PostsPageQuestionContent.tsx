import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { useCurrentUser } from '../common/withUser'
import Users from 'meteor/vulcan:users';
import withErrorBoundary from '../common/withErrorBoundary';

const MAX_ANSWERS_QUERIED = 100

const PostsPageQuestionContent = ({post, refetch}) => {
  const currentUser = useCurrentUser();
  const { AnswersList, NewAnswerCommentQuestionForm, CantCommentExplanation, RelatedQuestionsList } = Components
  return (
    <div>
      {(!currentUser || Users.isAllowedToComment(currentUser, post)) && <NewAnswerCommentQuestionForm post={post} refetch={refetch} />}
      {currentUser && !Users.isAllowedToComment(currentUser, post) &&
        <CantCommentExplanation post={post}/>
      }
      <RelatedQuestionsList post={post} />
      <AnswersList terms={{view: "questionAnswers", postId: post._id, limit: MAX_ANSWERS_QUERIED}} post={post}/>
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

