import React from "react";
import { useCurrentFrontpageSpotlight } from "../hooks/useCurrentFrontpageSpotlight";
import { registerComponent } from "../../lib/vulcan-lib";
import { getSpotlightUrl } from "../../lib/collections/spotlights/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import { eaGivingSeason23ElectionName, userCanVoteInDonationElection } from "../../lib/eaGivingSeason";
import { useLocation } from "../../lib/routeUtil";
import { useCurrentUser } from "./withUser";
import { useElectionVote } from "../ea-forum/voting-portal/hooks";
import { useIsGivingSeason } from "../ea-forum/giving-portal/hooks";

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
  });
  const { pathname } = useLocation()
  
  // special case for EA Forum Giving Season 2023
  const isGivingSeason = useIsGivingSeason();
  const { electionVote } = useElectionVote(eaGivingSeason23ElectionName);
  const currentUser = useCurrentUser();
  // We only advertise voting for users who are eligible -
  // i.e. those that created their accounts before Oct 23 and haven't voted yet.
  const advertiseVoting = currentUser && userCanVoteInDonationElection(currentUser) && !electionVote?.submittedAt
  // home page has its own unique header for giving season
  if (!spotlight && isGivingSeason && pathname !== '/') {
    return {
      title: advertiseVoting ? 'Vote in the Donation Election' : 'Giving season 2023',
      link: '/giving-portal',
      background: makeBackground('#AA1200', '#B65F54')
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
