import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from 'react-helmet';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTagBySlug } from './useTag';
import { Link } from '../../lib/reactRouterWrapper';
import { styles } from '../common/HeaderSubtitle';
import { taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';

const TagSubforumTitle = ({isSubtitle, classes, siteName}: {
  isSubtitle: boolean,
  classes: ClassesType,
  siteName: string
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug, "TagFragment");
  const titleString = `${tag?.name} - History - ${siteName}`
  
  if (isSubtitle) {
    return (<span className={classes.subtitle}>
      <Link to={`/${taggingNamePluralSetting.get()}/`}>{taggingNamePluralCapitalSetting.get()}</Link>
    </span>);
  } else if (!tag) {
    return null;
  } else {
    return <Helmet>
      <title>{titleString}</title>
      <meta property='og:title' content={titleString}/>
    </Helmet>
  }
}

const TagHistoryPageTitleComponent = registerComponent("TagHistoryPageTitle", TagSubforumTitle, {styles});

declare global {
  interface ComponentTypes {
    TagSubforumTitle: typeof TagHistoryPageTitleComponent
  }
}
