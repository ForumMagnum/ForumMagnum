import React from "react";
import { getSpotlightUrl } from "../../lib/collections/spotlights/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import { isLWorAF } from "../../lib/instanceSettings";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles("HeaderEventSubtitle", (_theme: ThemeType) => ({
  root: {
    marginLeft: "1em",
    backgroundClip: "text !important",
    "-webkit-background-clip": "text !important",
    "-webkit-text-fill-color": "transparent",
    "&:hover": {
      opacity: 0.8,
    },
  },
}));

const HeaderEventSubtitleSpotlightQuery = gql(`
  query HeaderEventSubtitleSpotlightQuery {
    currentSpotlight {
      ...SpotlightHeaderEventSubtitle
    }
  }
`);

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
  const { data } = useQuery(HeaderEventSubtitleSpotlightQuery, {
    skip: isLWorAF()
  });
  const spotlight = data?.currentSpotlight;
  
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

const HeaderEventSubtitle = () => {
  const classes = useStyles(styles);
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

export default HeaderEventSubtitle;


