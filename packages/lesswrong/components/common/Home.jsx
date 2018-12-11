import { Components, registerComponent } from 'meteor/vulcan:core';
import { getSetting } from 'meteor/vulcan:lib';
import React from 'react';
import { Link } from 'react-router';
import withUser from '../common/withUser';

const Home = (props, context) => {
  const { currentUser, router } = props;
  const currentView = _.clone(router.location.query).view || (currentUser && currentUser.currentFrontpageFilter) || (currentUser ? "frontpage" : "curated");
  let recentPostsTerms = _.isEmpty(router.location.query) ? {view: currentView, limit: 10} : _.clone(router.location.query)

  recentPostsTerms.forum = true
  if (recentPostsTerms.view === "curated" && currentUser) {
    recentPostsTerms.offset = 3
  }

  const curatedPostsTerms = {view:"curated", limit:3}
  let recentPostsTitle = "Recent Posts"
  switch (recentPostsTerms.view) {
    case "frontpage":
      recentPostsTitle = "Frontpage Posts"; break;
    case "curated":
      if (currentUser) {
        recentPostsTitle = "More Curated"; break;
      } else {
        recentPostsTitle = "Curated Posts"; break;
      }
    case "community":
      recentPostsTitle = "All Posts"; break;
    default:
      return "Recent Posts";
  }

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
          <Components.PostsList terms={curatedPostsTerms} showHeader={false} showLoadMore={false}/>
        </Components.Section>}
      <Components.Section title={recentPostsTitle}
        titleComponent= {<div className="recent-posts-title-component">
          <Components.PostsViews />
        </div>}
        subscribeLinks={<Components.SubscribeWidget view={recentPostsTerms.view} />}
      >
        <Components.PostsList terms={recentPostsTerms} showHeader={false} />
      </Components.Section>
      <Components.Section
        title="Community"
        titleLink="/community"
        titleComponent={<div>
          <Components.SectionSubtitle>
          <Link to="/community">Find Events Nearby</Link>
          </Components.SectionSubtitle>
        </div>}
      >
        <Components.PostsList
          terms={eventsListTerms}
          showLoadMore={false}
          showHeader={false} />
      </Components.Section>
      <Components.Section title="Recent Discussion" titleLink="/AllComments">
        <Components.RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:6}}/>
      </Components.Section>
    </div>
  )
};

registerComponent('Home', Home, withUser);
