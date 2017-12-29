import { Components, registerComponent, withCurrentUser} from 'meteor/vulcan:core';
import React from 'react';
import { Link } from 'react-router';

const AllPosts = (props, context) => {
  const recentPostsTerms = _.isEmpty(props.location && props.location.query) ? {view: 'top', limit: 10}: props.location.query;
  return (
    <div className="all-posts">
      <Components.Section title="Recent Posts"
        titleComponent= {<div className="recent-posts-title-component">
          {props.currentUser && <div className="new-post-link"><Link to={{pathname:"/newPost"}}> new post </Link></div>}
        </div>} >
        <Components.PostsDaily terms={recentPostsTerms} />
        </Components.Section>
    </div>
  )
};

registerComponent('AllPosts', AllPosts, withCurrentUser);
