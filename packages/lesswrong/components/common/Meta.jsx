import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import withUser from '../common/withUser';

const Meta = ({location, currentUser}) => {
  const query = location ? location.query : {};
  const recentPostsTerms = { view: 'magic', limit: 10, ...query, meta: true, forum: true }
  const { SingleColumnSection, SectionTitle, PostsList } = Components
  return (
    <SingleColumnSection>
      <SectionTitle title="Recent Meta Posts" />
      <PostsList terms={recentPostsTerms} />
    </SingleColumnSection>
  )
};

registerComponent('Meta', Meta, withUser);
