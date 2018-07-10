import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React from 'react';
import { Link } from 'react-router';
import Users from "meteor/vulcan:users";

const AlignmentForumHome = ({currentUser}) => {
  let recentPostsTerms = {view: 'alignmentForumPosts', limit: 10}

  const renderRecentPostsTitle = () => <div className="recent-posts-title-component">
    { currentUser && Users.canDo(currentUser, "posts.alignment.new") &&
      <div className="new-post-link">
        <Link to={{pathname:"/newPost", query: {af: true}}}>
          new post
        </Link>
      </div>
    }
  </div>

  return (
    <div className="alignment-forum-home">
      <Components.Section title="Alignment Posts"
        titleComponent={renderRecentPostsTitle()}>
        <Components.PostsList terms={recentPostsTerms} showHeader={false} />
      </Components.Section>
      <Components.Section title="Recent Discussion" titleLink="/AllComments">
        <Components.RecentDiscussionThreadsList
          terms={{view: 'afRecentDiscussionThreadsList', limit:6}}
          threadView={"afRecentDiscussionThread"}
        />
      </Components.Section>
    </div>
  )
};

registerComponent('AlignmentForumHome', AlignmentForumHome, withCurrentUser);
