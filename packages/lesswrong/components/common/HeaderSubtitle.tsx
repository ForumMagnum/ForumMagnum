import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { isFriendlyUI } from '../../themes/forumTheme';
import { blackBarTitle } from '../../lib/publicSettings';

export const styles = (theme: ThemeType) => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: isFriendlyUI ? undefined : 'uppercase',
    color: blackBarTitle.get() ? theme.palette.text.alwaysWhite : theme.palette.header.text,
    borderLeft: theme.palette.border.appBarSubtitleDivider,
  },
});

const HeaderSubtitleInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { currentRoute } = useSubscribedLocation();
  if (!currentRoute) {
    return null;
  }

  const SubtitleComponent = currentRoute.subtitleComponent;
  const subtitleString = currentRoute.headerSubtitle ?? currentRoute.subtitle;
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

export const HeaderSubtitle = registerComponent("HeaderSubtitle", HeaderSubtitleInner, {
  styles,
});

declare global {
  interface ComponentTypes {
    HeaderSubtitle: typeof HeaderSubtitle
  }
}
