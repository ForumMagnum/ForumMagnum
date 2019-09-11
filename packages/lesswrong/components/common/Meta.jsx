import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import withUser from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';

const Meta = ({currentUser}) => {
  const { query } = useLocation();
  const recentPostsTerms = { view: 'magic', limit: 10, ...query, meta: true, forum: true }
  const { SingleColumnSection, SectionTitle, PostsList2 } = Components
  return (
    <SingleColumnSection>
      <SectionTitle title="Recent Community Posts" />
      <PostsList2 terms={recentPostsTerms} />
    </SingleColumnSection>
  )
};

registerComponent('Meta', Meta, withUser);
