import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';

const QuestionsPage = () => {

  const terms = {
    view: 'questions',
    limit: 50,
  };

  const { Section, PostsList, TabNavigationMenu } = Components

  return (
    <Section title="Questions">
      <TabNavigationMenu />
      <PostsList terms={terms} showHeader={false}/>
    </Section>
  )
};

registerComponent('QuestionsPage', QuestionsPage);
