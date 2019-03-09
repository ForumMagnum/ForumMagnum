import { Components, registerComponent } from 'meteor/vulcan:core';
import { getSetting } from 'meteor/vulcan:lib';
import React from 'react';
import { Link } from 'react-router';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles'
import Checkbox from '@material-ui/core/Checkbox';

function getPostsSectionTitle(view, currentUser) {
  switch (view) {
    case "frontpage":
      return "Frontpage Posts";
    case "curated":
      if (currentUser) {
        return "More Curated";
      } else {
        return "Curated Posts";
      }
    case "community":
      return "All Posts";
    default:
      return "Recent Posts";
  }
}

const Home = (props) => {
  const { currentUser, router } = props;
  const { SingleColumnSection, SectionTitle, PostsList2, RecentDiscussionThreadsList, SubscribeWidget, HomeLatestPosts } = Components

  const query = _.clone(router.location.query) || {}
  const currentView = query.view || (currentUser && currentUser.currentFrontpageFilter) || "frontpage";
  const limit = parseInt(query.limit) || 10

  const shortformFeedId = currentUser && currentUser.shortformFeedId

  const lat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
  const lng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]
  let eventsListTerms = {
    view: 'events',
    limit: 3,
  }
  if (lat && lng) {
    eventsListTerms = {
      view: 'nearbyEvents',
      lat: lat,
      lng: lng,
      limit: 3,
    }
  }

  return (
    <div>
      <Components.HeadTags image={getSetting('siteImage')} />
      {/* <Components.RecommendedReading /> */}

      <SingleColumnSection>
        <SectionTitle title="Recommendations" />
        <PostsList2 terms={{view:"curated", limit:3}} showLoadMore={false}>
          <Link to={"/allPosts?filter=curated&view=new"}>All Curated Posts</Link>
          <SubscribeWidget view={"curated"} />
        </PostsList2>
      </SingleColumnSection>

      <HomeLatestPosts query={query} currentView={currentView} limit={limit} />

      <SingleColumnSection>
        <SectionTitle title="Community Events"/>
        <PostsList2 terms={eventsListTerms} showLoadMore={false}>
          <Link to="/community">Find Events Nearby</Link>
        </PostsList2>
      </SingleColumnSection>

      <SingleColumnSection>
        <SectionTitle title="Recent Discussion" />
        <RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:6}}/>
        <Link to="/community">Find Events Nearby</Link>
        <div>
          {shortformFeedId && <Components.SectionSubtitle>
            {/* TODO: set up a proper link url */}
            <Link to={`posts/${shortformFeedId}`}>Shortform Feed</Link>
          </Components.SectionSubtitle>}
        </div>
      </SingleColumnSection>
    </div>
  )
};

registerComponent('Home', Home, withUser);
