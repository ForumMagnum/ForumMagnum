import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import HeaderEventSubtitle from "./HeaderEventSubtitle";
import { useRouteMetadata } from '@/components/layout/ClientRouteMetadataContext';
import { defineStyles, useGetStyles } from '../hooks/useStyles';
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';

export const headerSubtitleStyles = defineStyles("HeaderSubtitle", (theme: ThemeType) => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: theme.isFriendlyUI ? undefined : 'uppercase',
    color: isBlackBarTitle ? theme.palette.text.alwaysWhite : theme.palette.header.text,
    borderLeft: theme.palette.border.appBarSubtitleDivider,
  },
}));

const HeaderSubtitle = () => {
  const getClasses = useGetStyles(headerSubtitleStyles);
  const { metadata: routeMetadata } = useRouteMetadata();

  const SubtitleComponent = routeMetadata.subtitleComponent;
  const subtitleString = routeMetadata.subtitle;
  const subtitleLink = routeMetadata.subtitleLink;

  if (SubtitleComponent) {
    return <SubtitleComponent isSubtitle={true} />
  } else if (subtitleLink) {
    const classes = getClasses();
    return <span className={classes.subtitle}>
      <Link to={subtitleLink}>{subtitleString}</Link>
    </span>
  } else if (subtitleString) {
    const classes = getClasses();
    return <span className={classes.subtitle}>
      {subtitleString}
    </span> 
  } else {
    return <HeaderEventSubtitle />;
  }
}

export default HeaderSubtitle;


