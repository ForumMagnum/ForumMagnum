import { Components } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';


const FeaturedPostsPage = (props, context) => {
  const featuredPostsTerms = {view: 'featured', limit: 10, frontpage: true};
  return (
    <div className="home">
      <Components.Section title="Featured">
        <Components.PostsList terms={featuredPostsTerms} showHeader={false} />
      </Components.Section>
    </div>
  )
};

export default defineComponent({
  name: 'FeaturedPostsPage',
  component: FeaturedPostsPage
});
