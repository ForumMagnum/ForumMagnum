import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from 'react-helmet';
import { registerComponent } from 'meteor/vulcan:core';
import { useTagBySlug } from './useTag';
import { Link } from '../../lib/reactRouterWrapper';
import { styles } from '../common/HeaderSubtitle';

const TagPageTitle = ({isSubtitle, classes}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug);
  
  if (isSubtitle) {
    return (<span className={classes.subtitle}>
      <Link to="/tags">Tags</Link>
    </span>);
  } else if (!tag) {
    return null;
  } else {
    return <Helmet>
      <title>{`${tag.name} tag`}</title>
      <meta property='og:title' content={`Posts tagged ${tag.name}`}/>
    </Helmet>
  }
}

const TagPageTitleComponent = registerComponent("TagPageTitle", TagPageTitle, {styles});

declare global {
  interface ComponentTypes {
    TagPageTitle: typeof TagPageTitleComponent
  }
}

