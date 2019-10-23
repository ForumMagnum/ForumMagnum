import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from 'react-helmet';
import { registerComponent } from 'meteor/vulcan:core';

const TagPageTitle = ({isSubtitle}) => {
  const { params } = useLocation();
  const { tag } = params;
  
  if (isSubtitle) {
    return null;
  } else {
    return <Helmet>
      <title>{tag} tag</title>
      <meta property='og:title' content={`Posts tagged ${tag}`}/>
    </Helmet>
  }
}

registerComponent("TagPageTitle", TagPageTitle);
