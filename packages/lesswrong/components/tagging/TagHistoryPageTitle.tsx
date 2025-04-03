import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTagBySlug } from './useTag';
import { Link } from '../../lib/reactRouterWrapper';
import { styles } from '../common/HeaderSubtitle';
import { taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { getAllTagsPath } from '../../lib/routes';
import { Helmet } from '../../lib/utils/componentsWithChildren';

const TagHistoryPageTitle = ({isSubtitle, classes, siteName}: {
  isSubtitle: boolean,
  classes: ClassesType<typeof styles>,
  siteName: string
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug, "TagFragment");
  const titleString = `${tag?.name} - History - ${siteName}`
  
  if (isSubtitle) {
    return (<span className={classes.subtitle}>
      <Link to={getAllTagsPath()}>{taggingNamePluralCapitalSetting.get()}</Link>
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

const TagHistoryPageTitleComponent = registerComponent("TagHistoryPageTitle", TagHistoryPageTitle, {styles});

declare global {
  interface ComponentTypes {
    TagHistoryPageTitle: typeof TagHistoryPageTitleComponent
  }
}
