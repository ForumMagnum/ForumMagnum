import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import withUser from '../common/withUser';

const EAHome = ({currentUser}) => {
  const { SingleColumnSection, SectionTitle, RecentDiscussionThreadsList, HomeLatestPosts } = Components

  const recentDiscussionCommentsPerPost = (currentUser && currentUser.isAdmin) ? 4 : 3;
  return (
    <React.Fragment>
      <HomeLatestPosts />

      <SingleColumnSection>
        <SectionTitle title="Recent Discussion" />
        <RecentDiscussionThreadsList
          terms={{view: 'recentDiscussionThreadsList', limit:6}}
          commentsLimit={recentDiscussionCommentsPerPost}
          maxAgeHours={18}
          af={false}
        />
      </SingleColumnSection>
    </React.Fragment>
  )
};

registerComponent('EAHome', EAHome, withUser);
