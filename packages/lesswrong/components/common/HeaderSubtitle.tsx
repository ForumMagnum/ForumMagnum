import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { isEAForum } from '../../lib/instanceSettings';

export const styles = (theme: ThemeType): JssStyles => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: isEAForum ? undefined : 'uppercase',
    color: theme.palette.header.text,
    borderLeft: theme.palette.border.appBarSubtitleDivider,
  },
});

const HeaderSubtitle = ({classes}: {
  classes: ClassesType,
}) => {
  const { currentRoute } = useSubscribedLocation();
  if (!currentRoute) {
    return null;
  }

  const SubtitleComponent: any = currentRoute.subtitleComponentName ? Components[currentRoute.subtitleComponentName] : null;
  const subtitleString = currentRoute.subtitle;
  const subtitleLink = currentRoute.subtitleLink;

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
    return <Components.HeaderEventSubtitle />;
  }
}

const HeaderSubtitleComponent = registerComponent("HeaderSubtitle", HeaderSubtitle, {
  styles,
});

declare global {
  interface ComponentTypes {
    HeaderSubtitle: typeof HeaderSubtitleComponent
  }
}
