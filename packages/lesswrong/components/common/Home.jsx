import { Components, registerComponent, withCurrentUser} from 'meteor/vulcan:core';
import React from 'react';
import { Link } from 'react-router';

const Home = (props, context) => {
  const currentUser = props.currentUser
  const currentView = _.clone(props.router.location.query).view || (props.currentUser && props.currentUser.currentFrontpageFilter) || (props.currentUser ? "frontpage" : "curated");
  let recentPostsTerms = _.isEmpty(props.location.query) ? {view: currentView, limit: 10} : _.clone(props.location.query)
  if (recentPostsTerms.view === "curated" && currentUser) {
    recentPostsTerms.offset = 3
  }

  let recentPostsTitle = "Recent Posts"
  switch (recentPostsTerms.view) {
    case "frontpage":
      recentPostsTitle = "Frontpage Posts"; break;
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
  if (lat & lng) {
    eventsListTerms = {
      view: 'nearbyEvents',
      lat: lat,
      lng: lng,
      limit: 3,
    }
  }

  return (
    <div className="home">
      <Components.Section title={recentPostsTitle}
        titleComponent= {<div className="recent-posts-title-component">
          <Components.PostsViews />
        </div>} >
        <Components.PostsList terms={recentPostsTerms} showHeader={false} />
      </Components.Section>
      <Components.Section title="Recent Discussion" titleLink="/AllComments">
        <Components.RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:6}}/>
      </Components.Section>
    </div>
  )
};

registerComponent('Home', Home, withCurrentUser);
