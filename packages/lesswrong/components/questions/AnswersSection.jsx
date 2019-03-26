import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import withUser from '../common/withUser'
import Users from 'meteor/vulcan:users';
import withErrorBoundary from '../common/withErrorBoundary';

const AnswersSection = ({post, currentUser}) => {
  const { AnswersList, NewAnswerForm, CantCommentExplanation } = Components
  return (

    <div>
      {currentUser && Users.isAllowedToComment(currentUser, post) && <NewAnswerForm post={post} alignmentForumPost={post.af}/>}
      {currentUser && !Users.isAllowedToComment(currentUser, post) &&
        <CantCommentExplanation post={post}/>
      }
      <AnswersList terms={{view: "questionAnswers", postId: post._id}} post={post}/>
    </div>
  )

};

AnswersSection.propTypes = {
  post: PropTypes.object.isRequired,
};

registerComponent('AnswersSection', AnswersSection, withUser, withErrorBoundary);
