import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';

const AnswersSection = ({post, classes}) => {
  const { Section, AnswersList, NewAnswerForm } = Components
  return (

    <div>
      <AnswersList terms={{view: "questionAnswers", postId: post._id}} post={post}/>
      <Section>
        <NewAnswerForm postId={post._id}/>
      </Section>
    </div>
  )

};

AnswersSection.propTypes = {
  post: PropTypes.object.isRequired,
  // classes: PropTypes.object.isRequired,
};

registerComponent('AnswersSection', AnswersSection);
