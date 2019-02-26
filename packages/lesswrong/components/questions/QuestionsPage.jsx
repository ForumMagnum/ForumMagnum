import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const QuestionsPage = () => {

  const terms = {
    view: 'questions',
    limit: 50,
  };

  const { Section, PostsList } = Components

  return (
    <Section title="Questions">
      <PostsList terms={terms}/>
    </Section>
  )
};

registerComponent('QuestionsPage', QuestionsPage);
