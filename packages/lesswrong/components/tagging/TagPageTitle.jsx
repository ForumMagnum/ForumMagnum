import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from 'react-helmet';
import { registerComponent } from 'meteor/vulcan:core';
import { useTagBySlug } from './useTag.jsx';

const TagPageTitle = ({isSubtitle}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug);
  
  if (isSubtitle) {
    return null;
  } else if (!tag) {
    return null;
  } else {
    return <Helmet>
      <title>{tag.name} tag</title>
      <meta property='og:title' content={`Posts tagged ${tag.name}`}/>
    </Helmet>
  }
}

registerComponent("TagPageTitle", TagPageTitle);
