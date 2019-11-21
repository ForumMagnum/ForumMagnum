import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';

const Nominations2018 = () => {

  const { SingleColumnSection, SectionTitle, PostsList2, RecentDiscussionThreadsList } = Components

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts for the 2018 Review"/>
        <PostsList2 terms={{view:"nominations2018"}}/>
      </SingleColumnSection>
      <SingleColumnSection>
        <RecentDiscussionThreadsList
          title="2018 Review Discussion"
          shortformButton={false}
          terms={{view: '2018reviewRecentDiscussionThreadsList', limit:20}}
          commentsLimit={4}
          maxAgeHours={18}
          af={false}
        />
      </SingleColumnSection>
    </div>
  )
}

registerComponent('Nominations2018', Nominations2018);
