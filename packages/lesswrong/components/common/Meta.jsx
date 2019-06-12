import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import withUser from '../common/withUser';
import { parseQuery } from '../../lib/routeUtil.js';

const Meta = ({location, currentUser}) => {
  const query = parseQuery(location)
  const recentPostsTerms = { view: 'magic', limit: 10, ...query, meta: true, forum: true }
  const { SingleColumnSection, SectionTitle, PostsList2 } = Components
  return (
    <SingleColumnSection>
      <SectionTitle title="Recent Meta Posts" />
      <PostsList2 terms={recentPostsTerms} />
    </SingleColumnSection>
  )
};

registerComponent('Meta', Meta, withUser);
