import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Link } from 'react-router';
import withUser from '../common/withUser';

const Meta = ({location, currentUser}, context) => {
  const query = location ? location.query : {};
  const recentPostsTerms = { view: 'magic', limit: 10, ...query, meta: true, forum: true }
  return (
    <div className="home">
      <Components.Section title="Recent Community Posts"
        titleComponent= {<div className="recent-posts-title-component">
          {currentUser && <div className="new-post-link"><Link to={{pathname:"/newPost", query: {meta: true}}}> new post </Link></div>}
          </div>} >
          <Components.PostsList terms={recentPostsTerms} />
        </Components.Section>
    </div>
  )
};

registerComponent('Meta', Meta, withUser);
