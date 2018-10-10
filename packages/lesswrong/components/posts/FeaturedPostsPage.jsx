import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';


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

registerComponent('FeaturedPostsPage', FeaturedPostsPage);
