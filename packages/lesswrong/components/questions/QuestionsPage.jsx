import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';

const QuestionsPage = () => {

  const terms = {
    view: 'questions',
    limit: 50,
  };

  const { PostsList, TabNavigationMenu, SingleColumnSection, SectionTitle } = Components

  return (
    <SingleColumnSection>
      <SectionTitle title="Questions">
      </SectionTitle>
      <TabNavigationMenu />
      <PostsList terms={terms} showHeader={false}/>
    </SingleColumnSection>
  )
};

registerComponent('QuestionsPage', QuestionsPage);
