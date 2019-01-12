import { Components, registerComponent, withCurrentUser} from 'meteor/vulcan:core';
import { getSetting } from 'meteor/vulcan:lib';
import React from 'react';
import withUser from '../common/withUser';

const Home = (props, context) => {
  const { currentUser, router } = props;
  const currentView = _.clone(router.location.query).view || (currentUser && currentUser.currentFrontpageFilter) || 'frontpage'
  let recentPostsTerms = _.isEmpty(router.location.query) ? {view: currentView, limit: 10} : _.clone(router.location.query)

  recentPostsTerms.forum = true

  let recentPostsTitle = "Recent Posts"
  switch (recentPostsTerms.view) {
    case "frontpage":
      recentPostsTitle = "Frontpage Posts"; break;
    case "community":
      recentPostsTitle = "All Posts"; break;
    default:
      recentPostsTitle = "Recent Posts";
  }

  return (
    <div>
      <Components.HeadTags image={getSetting('siteImage')} />
      <Components.Section title={recentPostsTitle}
        titleComponent= {<div className="recent-posts-title-component">
          <Components.HomePostsViews />
        </div>}
      >
        <Components.PostsList terms={recentPostsTerms} showHeader={false} />
      </Components.Section>
      <Components.Section title="Recent Discussion" titleLink="/AllComments">
        <Components.RecentDiscussionThreadsList terms={{view: 'recentDiscussionThreadsList', limit:6}}/>
      </Components.Section>
    </div>
  )
};

registerComponent('Home', Home, withUser);
