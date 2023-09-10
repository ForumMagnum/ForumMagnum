import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { isFriendlyUI } from '../../themes/forumTheme';
import { currentEventHeader } from '../../lib/publicSettings';

export const styles = (theme: ThemeType): JssStyles => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: isFriendlyUI ? undefined : 'uppercase',
    color: theme.palette.header.text,
    borderLeft: theme.palette.border.appBarSubtitleDivider,
  },
  currentEventLink: {
    marginLeft: "1em",
    background: `linear-gradient(
      91deg,
      ${theme.palette.text.currentEventHeader.start} 5.84%,
      ${theme.palette.text.currentEventHeader.stop} 99.75%
    )`,
    backgroundClip: "text",
    "-webkit-background-clip": "text",
    "-webkit-text-fill-color": "transparent",
    "&:hover": {
      opacity: 0.8,
    },
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
    const currentEvent = currentEventHeader.get();
    return currentEvent
      ? (
        <Link
          to={currentEvent.link}
          className={classes.currentEventLink}
        >
          {currentEvent.name}
        </Link>
      )
      : null;
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
