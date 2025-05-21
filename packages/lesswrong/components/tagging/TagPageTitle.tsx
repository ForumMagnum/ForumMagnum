import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { useTagBySlug } from './useTag';
import { Link } from '../../lib/reactRouterWrapper';
import { styles } from '../common/HeaderSubtitle';
import { taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { getAllTagsPath } from '@/lib/pathConstants';
import { Helmet } from '../../lib/utils/componentsWithChildren';
import { defineStyles, useStyles } from '../hooks/useStyles';

const titleComponentStyles = defineStyles('TagPageTitle', styles);

export const TagPageTitle = ({isSubtitle, siteName}: {
  isSubtitle: boolean,
  siteName: string
}) => {
  const classes = useStyles(titleComponentStyles);

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
