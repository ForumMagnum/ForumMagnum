import { Components, registerComponent } from 'meteor/vulcan:core';
import { getSetting } from 'meteor/vulcan:lib';
import React from 'react';
import { Link } from 'react-router';

const Home2 = () => {
  const { SingleColumnSection, SectionTitle, PostsList2, RecentDiscussionThreadsList, SubscribeWidget, HomeLatestPosts, TabNavigationMenu } = Components

  return (
    <React.Fragment>
      <Components.HeadTags image={getSetting('siteImage')} />
      <TabNavigationMenu />

      <SingleColumnSection>
        <SectionTitle title="Curated" />
        <PostsList2 terms={{view:"curated", limit:3}} showLoadMore={false}>
          <Link to={"/allPosts?filter=curated&view=new"}>View All Curated Posts</Link>
          <SubscribeWidget view={"curated"} />
        </PostsList2>
      </SingleColumnSection>

      <HomeLatestPosts />

      <SingleColumnSection>
        <SectionTitle title="Recent Discussion" />
        <RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:6}}/>
      </SingleColumnSection>
    </React.Fragment>
  )
};

registerComponent('Home2', Home2);
