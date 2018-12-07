import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import withUser from '../common/withUser'

const AnswersSection = ({post}) => {
  const { AnswersList, NewAnswerForm, currentUser } = Components
  return (

    <div>
      {currentUser && <NewAnswerForm postId={post._id}/>}
      <AnswersList terms={{view: "questionAnswers", postId: post._id}} post={post}/>
    </div>
  )

};

AnswersSection.propTypes = {
  post: PropTypes.object.isRequired,
};

registerComponent('AnswersSection', AnswersSection, withUser);
