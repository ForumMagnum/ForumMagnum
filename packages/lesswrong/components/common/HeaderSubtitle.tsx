import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { blackBarTitle } from '@/lib/instanceSettings';
import HeaderEventSubtitle from "./HeaderEventSubtitle";
import { useRouteMetadata } from '../ClientRouteMetadataContext';
import { defineStyles, useStyles } from '../hooks/useStyles';

export const headerSubtitleStyles = defineStyles("HeaderSubtitle", (theme: ThemeType) => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: theme.isFriendlyUI ? undefined : 'uppercase',
    color: blackBarTitle.get() ? theme.palette.text.alwaysWhite : theme.palette.header.text,
    borderLeft: theme.palette.border.appBarSubtitleDivider,
  },
}));

const HeaderSubtitle = () => {
  const classes = useStyles(headerSubtitleStyles);
  const { metadata: routeMetadata } = useRouteMetadata();

  const SubtitleComponent = routeMetadata.subtitleComponent;
  const subtitleString = routeMetadata.subtitle;
  const subtitleLink = routeMetadata.subtitleLink;

  if (SubtitleComponent) {
    return <SubtitleComponent isSubtitle={true} />
  } else if (subtitleLink) {
    return <span className={classes.subtitle}>
      <Link to={subtitleLink}>{subtitleString}</Link>
    </span>
  } else if (subtitleString) {
    return <span className={classes.subtitle}>
      {subtitleString}
    </span>
  } else {
    return <HeaderEventSubtitle />;
  }
}

export default HeaderSubtitle;


