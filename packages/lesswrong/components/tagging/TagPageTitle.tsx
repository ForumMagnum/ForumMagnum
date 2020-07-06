import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from 'react-helmet';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTagBySlug } from './useTag';
import { Link } from '../../lib/reactRouterWrapper';
import { styles } from '../common/HeaderSubtitle';

const TagPageTitle = ({isSubtitle, classes}: {
  isSubtitle: boolean,
  classes: ClassesType,
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug, "TagFragment");
  
  if (isSubtitle) {
    return (<span className={classes.subtitle}>
      <Link to="/tags/all">Tags</Link>
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

