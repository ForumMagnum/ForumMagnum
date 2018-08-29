import { Components, registerComponent, withCurrentUser} from 'meteor/vulcan:core';
import React from 'react';
import { getSetting } from 'meteor/vulcan:lib';

const Home = (props, context) => {
  const { currentUser, router } = props;
  const currentView = _.clone(router.location.query).view || (currentUser && currentUser.currentFrontpageFilter) || (currentUser ? "frontpage" : "curated");
  let recentPostsTerms = _.isEmpty(router.location.query) ? {view: currentView, limit: 10} : _.clone(router.location.query)

  recentPostsTerms.forum = true
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
      recentPostsTitle = "Recent Posts";
  }

  // TODO: IBETA ONLY Only logged-in users should see page content
  if (!currentUser) return <p>Please log in to see content during internal beta</p>

  return (
    <div>
      <Components.HeadTags image={getSetting('siteImage')} />
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
