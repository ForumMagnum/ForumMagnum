import React from "react";
import { useCurrentFrontpageSpotlight } from "../hooks/useCurrentFrontpageSpotlight";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { getSpotlightUrl } from "../../lib/collections/spotlights/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import { isLWorAF } from "../../lib/instanceSettings";

const styles = (_theme: ThemeType) => ({
  root: {
    marginLeft: "1em",
    backgroundClip: "text !important",
    "-webkit-background-clip": "text !important",
    "-webkit-text-fill-color": "transparent",
    "&:hover": {
      opacity: 0.8,
    },
  },
});

const makeBackground = (leftColor?: string | null, rightColor?: string | null) =>
  `linear-gradient(
    91deg,
    ${leftColor ?? "#F35B3E"} 5.84%,
    ${rightColor ?? "#D92B08"} 99.75%
  )`;

type CurrentEvent = {
  title: string,
  link: string,
  background: string,
}

const useCurrentEvent = (): CurrentEvent | null => {
  const spotlight = useCurrentFrontpageSpotlight({
    fragmentName: "SpotlightHeaderEventSubtitle",
    skip: isLWorAF
  });
  
  if (!spotlight?.headerTitle) {
    return null;
  }

  return {
    title: spotlight.headerTitle,
    link: getSpotlightUrl(spotlight),
    background: makeBackground(
      spotlight.headerTitleLeftColor,
      spotlight.headerTitleRightColor,
    ),
  };
}

const HeaderEventSubtitle = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const currentEvent = useCurrentEvent();
  return currentEvent
    ? (
      <Link
        to={currentEvent.link}
        style={{background: currentEvent.background}}
        className={classes.root}
      >
        {currentEvent.title}
      </Link>
    )
    : null;
}

const HeaderEventSubtitleComponent = registerComponent(
  "HeaderEventSubtitle",
  HeaderEventSubtitle,
  {styles},
);

declare global {
  interface ComponentTypes {
    HeaderEventSubtitle: typeof HeaderEventSubtitleComponent
  }
}
