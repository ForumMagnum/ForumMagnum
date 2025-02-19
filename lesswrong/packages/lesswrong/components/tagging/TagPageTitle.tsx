import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTagBySlug } from './useTag';
import { Link } from '../../lib/reactRouterWrapper';
import { styles } from '../common/HeaderSubtitle';
import { taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { getAllTagsPath } from '../../lib/routes';
import { Helmet } from '../../lib/utils/componentsWithChildren';

const TagPageTitle = ({isSubtitle, classes, siteName}: {
  isSubtitle: boolean,
  classes: ClassesType<typeof styles>,
  siteName: string
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug, "TagFragment");
  const titleString = `${tag?.name} - ${siteName}`
  
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

const TagPageTitleComponent = registerComponent("TagPageTitle", TagPageTitle, {styles});

declare global {
  interface ComponentTypes {
    TagPageTitle: typeof TagPageTitleComponent
  }
}
