import { Components, registerComponent } from 'meteor/vulcan:core';
import { getSetting } from 'meteor/vulcan:lib';
import React from 'react';
import { Link } from 'react-router';
import withUser from '../common/withUser';

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

const Home = (props, context) => {
  const { currentUser, router } = props;
  const currentView = _.clone(router.location.query).view || (currentUser && currentUser.currentFrontpageFilter) || (currentUser ? "frontpage" : "curated");
  let recentPostsTerms = _.isEmpty(router.location.query) ? {view: currentView, limit: 10} : _.clone(router.location.query)
  const shortformFeedId = currentUser && currentUser.shortformFeedId

  recentPostsTerms.forum = true
  if (recentPostsTerms.view === "curated" && currentUser) {
    recentPostsTerms.offset = 3
  }

  const curatedPostsTerms = {view:"curated", limit:3}
  const recentPostsTitle = getPostsSectionTitle(recentPostsTerms.view, currentUser);

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
      <Components.RecommendedReading />
      {currentUser &&
        <Components.Section title="Curated Content">
          <Components.PostsList terms={curatedPostsTerms} showLoadMore={false}/>
        </Components.Section>}
      <Components.Section title={recentPostsTitle}
        titleComponent= {<div className="recent-posts-title-component">
          <Components.HomePostsViews />
        </div>}
        subscribeLinks={<Components.SubscribeWidget view={recentPostsTerms.view} />}
      >
        <Components.PostsList terms={recentPostsTerms} />
      </Components.Section>

      {/*TODO; If we change the home component for the EA forum, don't worry about this part*/}
      {getSetting('hasEvents', true) && <Components.Section
        title="Community"
        titleLink="/community"
        titleComponent={<div>
          <Components.SectionSubtitle>
            <Link to="/community">Find Events Nearby</Link>
          </Components.SectionSubtitle>
        </div>}
      >
        <Components.PostsList terms={eventsListTerms} showLoadMore={false} />
      </Components.Section>}
      <Components.Section title="Recent Discussion" titleLink="/AllComments" titleComponent={
        <div>
          {shortformFeedId && <Components.SectionSubtitle>
            {/* TODO: set up a proper link url */}
            <Link to={`posts/${shortformFeedId}`}>Shortform Feed</Link>
          </Components.SectionSubtitle>}
        </div>
      }>
        <Components.RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:6}}/>
      </Components.Section>
    </div>
  )
};

registerComponent('Home', Home, withUser);
