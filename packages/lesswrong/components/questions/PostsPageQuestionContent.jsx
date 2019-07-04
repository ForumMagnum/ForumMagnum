import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import withUser from '../common/withUser'
import Users from 'meteor/vulcan:users';
import withErrorBoundary from '../common/withErrorBoundary';

const MAX_ANSWERS_QUERIED = 100

const PostsPageQuestionContent = ({post, currentUser, refetch}) => {
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

PostsPageQuestionContent.propTypes = {
  post: PropTypes.object.isRequired,
};

registerComponent('PostsPageQuestionContent', PostsPageQuestionContent, withUser, withErrorBoundary);
