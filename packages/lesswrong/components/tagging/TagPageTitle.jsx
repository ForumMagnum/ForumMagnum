import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from 'react-helmet';
import { registerComponent } from 'meteor/vulcan:core';
import { useTagBySlug } from './useTag.jsx';
import { Link } from '../../lib/reactRouterWrapper';
import { styles } from '../common/HeaderSubtitle';
import { withStyles } from '@material-ui/core/styles';

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

registerComponent("TagPageTitle", TagPageTitle,
  withStyles(styles, {name: "PostsPageHeaderTitle"})
);
