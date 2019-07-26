import { Components, registerComponent } from 'meteor/vulcan:core';
import { getSetting } from 'meteor/vulcan:lib';
import React from 'react';
import withUser from '../common/withUser';

const EAHome = () => {
  const { SingleColumnSection, SectionTitle, RecentDiscussionThreadsList, HomeLatestPosts } = Components

  return (
    <React.Fragment>
      <HomeLatestPosts />

      <SingleColumnSection>
        <SectionTitle title="Recent Discussion" />
        <RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:6}}/>
      </SingleColumnSection>
    </React.Fragment>
  )
};

registerComponent('EAHome', EAHome, withUser);
