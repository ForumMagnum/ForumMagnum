import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import HeaderEventSubtitle from "./HeaderEventSubtitle";
import { useRouteMetadata } from '../ClientRouteMetadataContext';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isBlackBarTitle } from '../Layout';

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


