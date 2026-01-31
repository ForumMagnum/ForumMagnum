import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import HeaderEventSubtitle from "./HeaderEventSubtitle";
import { useRouteMetadata } from '@/components/layout/ClientRouteMetadataContext';
import { defineStyles, useStyles } from '../hooks/useStyles';
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
  const classes = useStyles(headerSubtitleStyles);
  const { metadata: routeMetadata } = useRouteMetadata();

  const subtitle = routeMetadata.subtitle;

  if (subtitle) {
    if (typeof subtitle === 'string') {
      return <span className={classes.subtitle}>
        {subtitle}
      </span> 
    } else if ('link' in subtitle) {
      return <span className={classes.subtitle}>
        <Link to={subtitle.link}>{subtitle.title}</Link>
      </span>
    } else {
      const SubtitleComponent = subtitle;
      return <SubtitleComponent />
    }
  }

  return <HeaderEventSubtitle />;
}

export default HeaderSubtitle;


