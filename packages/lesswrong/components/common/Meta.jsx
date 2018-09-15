import { Components, withCurrentUser } from 'meteor/vulcan:core';
import React from 'react';
import { Link } from 'react-router';
import defineComponent from '../../lib/defineComponent';

const Meta = ({location, currentUser}, context) => {
  const query = location ? location.query : {};
  const recentPostsTerms = { view: 'magicalSorting', limit: 10, ...query, meta: true, forum: true }
  return (
    <div className="home">
      <Components.Section title="Recent Meta Posts"
        titleComponent= {<div className="recent-posts-title-component">
          {currentUser && <div className="new-post-link"><Link to={{pathname:"/newPost", query: {meta: true}}}> new post </Link></div>}
          </div>} >
          <Components.PostsList terms={recentPostsTerms} showHeader={false} />
        </Components.Section>
    </div>
  )
};

export default defineComponent({
  name: 'Meta',
  component: Meta,
  hocs: [ withCurrentUser ]
});
