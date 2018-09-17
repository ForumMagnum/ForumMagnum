import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const CollectionsNavigation = ({
    nextPostSlug,
    prevPostSlug,
    nextPostUrl,
    prevPostUrl,
    title,
    titleUrl
  }) => {

    return (
      <div className="sequences-navigation-top">
        <Components.SequencesNavigationLink
          slug={prevPostSlug}
          documentUrl={prevPostUrl}
        direction="left" />

        <div className="sequences-navigation-title">
          {title ? <Link to={ titleUrl }>{ title }</Link> : <Components.Loading/>}
        </div>

        <Components.SequencesNavigationLink
          slug={nextPostSlug}
          documentUrl={nextPostUrl}
        direction="right" />
      </div>
    )
  }

export default defineComponent({
  name: 'CollectionsNavigation',
  component: CollectionsNavigation
});
