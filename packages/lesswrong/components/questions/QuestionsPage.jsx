import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Link } from 'react-router';

const QuestionsPage = () => {

  const topQuestionsTerms = {
    view: 'topQuestions',
    limit: 5,
  };

  const recentActivityTerms = {
    view: 'recentQuestionActivity',
    limit: 12,
  };


  const { TabNavigationMenu, SingleColumnSection, SectionTitle,  PostsList2 } = Components

  return (
    <div>
      <TabNavigationMenu />
      <SingleColumnSection>
        <SectionTitle title="Top Questions"/>
        <PostsList2 terms={topQuestionsTerms}/>
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="Recent Activity"/>
        <PostsList2 terms={recentActivityTerms}>
          <Link to={"/allPosts?filter=questions&view=new"}>View All Questions</Link>
        </PostsList2>
      </SingleColumnSection>
    </div>

  )
};

registerComponent('QuestionsPage', QuestionsPage);
