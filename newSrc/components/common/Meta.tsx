import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const Meta = () => {
  const { query } = useLocation();
  const recentPostsTerms = { view: 'magic', limit: 10, ...query, meta: true, forum: true }
  const { SingleColumnSection, SectionTitle, PostsList2 } = Components
  return (
    <SingleColumnSection>
      <SectionTitle title="Recent Meta Posts" />
      <PostsList2 terms={recentPostsTerms} />
    </SingleColumnSection>
  )
};

const MetaComponent = registerComponent('Meta', Meta);

declare global {
  interface ComponentTypes {
    Meta: typeof MetaComponent
  }
}
