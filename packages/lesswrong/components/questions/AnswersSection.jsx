import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import withUser from '../common/withUser'
import Users from 'meteor/vulcan:users';
import withErrorBoundary from '../common/withErrorBoundary';

const AnswersSection = ({post, currentUser}) => {
  const { AnswersList, NewAnswerForm } = Components
  return (

    <div>
      {currentUser && Users.isAllowedToComment(currentUser, post) && <NewAnswerForm post={post} alignmentForumPost={post.af}/>}
      {currentUser && !Users.isAllowedToComment(currentUser, post) && (
          <div className="i18n-message author_has_banned_you">
            { Users.blockedCommentingReason(currentUser, post)}
          { !(getSetting('AlignmentForum', false)) && <span>
              (Questions? Send an email to <a className="email-link" href="mailto:moderation@lesserwrong.com">moderation@lesserwrong.com</a>)
            </span> }
          </div>
        )}
      <AnswersList terms={{view: "questionAnswers", postId: post._id}} post={post}/>
    </div>
  )

};

AnswersSection.propTypes = {
  post: PropTypes.object.isRequired,
};

registerComponent('AnswersSection', AnswersSection, withUser, withErrorBoundary);
