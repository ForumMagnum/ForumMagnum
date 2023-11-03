import React from "react";
import { useCurrentFrontpageSpotlight } from "../hooks/useCurrentFrontpageSpotlight";
import { registerComponent } from "../../lib/vulcan-lib";
import { getSpotlightUrl } from "../../lib/collections/spotlights/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import { timelineSpec } from "../../lib/eaGivingSeason";
import moment from "moment";
import { isEAForum } from "../../lib/instanceSettings";
import { useLocation } from "../../lib/routeUtil";

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
  const spotlight = useCurrentFrontpageSpotlight();
  const { pathname } = useLocation()
  
  // special case for EA Forum Giving Season 2023
  const now = moment()
  const isGivingSeason = isEAForum && moment(timelineSpec.start).isBefore(now) && moment(timelineSpec.end).isAfter(now)
  // home page has its own unique header for giving season
  if (!spotlight && isGivingSeason && pathname !== '/') {
    return {
      title: 'Giving season 2023',
      link: '/giving-portal',
      background: makeBackground('#862115', '#E7714E')
    }
  }
  
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

const HeaderEventSubtitle = ({classes}: {classes: ClassesType}) => {
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
