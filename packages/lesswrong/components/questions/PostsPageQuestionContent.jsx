import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import withUser from '../common/withUser'
import Users from 'meteor/vulcan:users';
import withErrorBoundary from '../common/withErrorBoundary';

const PostsPageQuestionContent = ({post, currentUser}) => {
  const { AnswersList, NewAnswerCommentQuestionForm, CantCommentExplanation } = Components
  return (

    <div>
      <NewAnswerCommentQuestionForm post={post} alignmentForumPost={post.af}/>
      {currentUser && !Users.isAllowedToComment(currentUser, post) &&
        <CantCommentExplanation post={post}/>
      }
      <AnswersList terms={{view: "questionAnswers", postId: post._id}} post={post}/>
    </div>
  )

};

PostsPageQuestionContent.propTypes = {
  post: PropTypes.object.isRequired,
};

registerComponent('PostsPageQuestionContent', PostsPageQuestionContent, withUser, withErrorBoundary);
