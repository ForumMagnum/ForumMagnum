import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { Link } from "../../../lib/reactRouterWrapper";
import type { PodcastData } from "../../../lib/eaPodcasts";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    backgroundColor: theme.palette.panelBackground.onboardingPodcast,
    borderRadius: theme.borderRadius.default,
    display: "inline-block",
    padding: "5px 8px",
    minHeight: 37,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 600,
    lineHeight: "13px",
    textDecoration: "none !important",
    "&:hover": {
      opacity: "0.8 !important",
    },
  },
  container: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    height: "100%",
  },
  icon: {
    color: theme.palette.primary.main,
  },
  listenOn: {
    textDecoration: "none !important",
    color: theme.palette.grey[600],
    fontSize: 9,
  },
  name: {
    textDecoration: "none !important",
    fontSize: 12,
  },
});

export const EAOnboardingPodcastInner = ({podcast, classes}: {
  podcast?: PodcastData,
  classes: ClassesType<typeof styles>,
}) => {
  if (!podcast) {
    return null;
  }
  return (
    <Link
      to={podcast.url}
      target="_blank"
      rel="noopener noreferrer"
      className={classes.root}
    >
      <div className={classes.container}>
        <div className={classes.icon}>{podcast.icon}</div>
        <div>
          <div className={classes.listenOn}>LISTEN ON</div>
          <div className={classes.name}>{podcast.name}</div>
        </div>
      </div>
    </Link>
  );
}

export const EAOnboardingPodcast = registerComponent(
  "EAOnboardingPodcast",
  EAOnboardingPodcastInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingPodcast: typeof EAOnboardingPodcast
  }
}
