import React, { Dispatch, ReactNode, createContext, useContext, useState } from "react";
import { isEAForum, siteUrlSetting } from "@/lib/instanceSettings";
import { Link } from "@/lib/reactRouterWrapper";
import moment, { Moment } from "moment";
import qs from "qs";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useCurrentForumEvent } from "../hooks/useCurrentForumEvent";
import { IRPossibleVoteCounts } from "@/lib/givingSeason/instantRunoff";
import { isProduction } from "@/lib/executionEnvironment";

export const GIVING_SEASON_DESKTOP_WIDTH = 1300;
export const GIVING_SEASON_MOBILE_WIDTH = 700;
export const GIVING_SEASON_MD_WIDTH = 900;

export const getDonateLink = (currentUser: UsersCurrent | null) => {
  // See docs at https://docs.every.org/docs/donate-link
  const params: Record<string, string> = {
    no_exit: "true",
    success_url: siteUrlSetting.get(),
    exit_url: siteUrlSetting.get(),
    frequency: "ONCE",
    theme_color: "0c869b",
    ...(currentUser?.email && {
      email: currentUser.email,
    }),
  };
  return `https://www.every.org/effective-ventures-foundation-usa-inc-for-the-ea-forum-donation-election-fund-2024?${qs.stringify(params)}#/donate`;
}

type GivingSeasonEvent = {
  name: string,
  description: ReactNode,
  start: Moment,
  end: Moment,
  discussionTagId?: string,
  discussionTagSlug?: string,
  background: string,
  darkText?: boolean,
  hidden?: boolean,
}

const events: GivingSeasonEvent[] = [
  {
    name: "Funding Strategy Week",
    description: <>
      Read and continue Funding Strategy Week's conversations{" "}
      <Link to="/topics/funding-strategy-week">
        here
      </Link>.
    </>,
    start: moment("2024-11-04").utc(),
    end: moment("2024-11-10").utc(),
    discussionTagId: isProduction ? "iaTpKWdeW79vqRFkA" : "4ktPbiFf6FLnfyRiC",
    discussionTagSlug: isProduction ? "funding-strategy-week" : "funding-strategy-week-2024",
    background: "https://res.cloudinary.com/cea/image/upload/v1730143995/Rectangle_5034.jpg",
  },
  {
    name: "Marginal Funding Week",
    description: <>
      A week for organisations to explain what they would do with marginal funding.{" "}
      <Link to="/posts/srZEX2r9upbwfnRKw/giving-season-2024-announcement#November_11___17__Marginal_Funding_Week">
        Read more
      </Link>.
    </>,
    start: moment("2024-11-12").utc(),
    end: moment("2024-11-18").utc(),
    discussionTagId: isProduction ? "Dvs6cEeHqvRvAfG2c" : "SHAB6gQvboCakozMA",
    discussionTagSlug: isProduction ? "marginal-funding-week" : "marginal-funding-week-2024",
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5064.jpg",
  },
  {
    name: "Donation Election",
    description: <>
      A crowd-sourced pot of funds was distributed amongst three charities{" "}
      based on your votes. Continue donation election conversations {" "}
      <Link to="/posts/j6fmnYM5ZRu9fJyrq/donation-election-how-to-vote">
        here
      </Link>.
    </>,
    start: moment("2024-11-18").utc(),
    end: moment("2024-12-03").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5069.jpg",
  },
  {
    name: "Intermission",
    description: null,
    start: moment("2024-12-03").utc(),
    end: moment("2024-12-16").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5069.jpg",
    hidden: true,
  },
  {
    name: "Pledge Highlight",
    description: <>
      A week to post about your experience with pledging, and to discuss the{" "}
      value of pledging.{" "}
      <Link to="/posts/srZEX2r9upbwfnRKw/giving-season-2024-announcement#December_16___22__Pledge_Highlight">
        Read more
      </Link>.
    </>,
    start: moment("2024-12-16").utc(),
    end: moment("2024-12-22").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5072.jpg",
  },
  {
    name: "Donation Celebration",
    description: <>
      When the donation celebration starts, you’ll be able to add a heart to{" "}
      the banner showing that you’ve done your annual donations.
    </>,
    start: moment("2024-12-23").utc(),
    end: moment("2024-12-31").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5075.jpg",
    darkText: true,
  },
];

const getCurrentEvent = (
  currentForumEvent: ForumEventsDisplay | null,
): GivingSeasonEvent | null => {
  if (currentForumEvent) {
    const matchingEvent = events.find(({name}) => name === currentForumEvent.title);
    if (matchingEvent) {
      return matchingEvent;
    }
  }
  const now = moment();
  return events.find(({start, end}) => now.isBetween(start, end)) ?? null;
}

type GivingSeasonEventsContext = {
  events: GivingSeasonEvent[],
  currentEvent: GivingSeasonEvent | null,
  selectedEvent: GivingSeasonEvent,
  setSelectedEvent: Dispatch<GivingSeasonEvent>,
  amountRaised: number,
  amountTarget: number,
  leaderboard?: IRPossibleVoteCounts
}

const givingSeasonEventsContext = createContext<GivingSeasonEventsContext>({
  events,
  currentEvent: getCurrentEvent(null),
  selectedEvent: events[0],
  setSelectedEvent: () => {},
  amountRaised: 0,
  amountTarget: 35000,
});

const amountRaisedQuery = gql`
  query GivingSeason2024DonationTotal {
    GivingSeason2024DonationTotal
  }
`;

const leaderboardQuery = gql`
  query GivingSeason2024VoteCounts {
    GivingSeason2024VoteCounts
  }
`;

export const GivingSeasonEventsProvider = ({children}: {children: ReactNode}) => {
  const {currentForumEvent} = useCurrentForumEvent();
  const currentEvent = getCurrentEvent(currentForumEvent);
  const [selectedEvent, setSelectedEvent] = useState(currentEvent ?? events[0]);

  const {data: amountRaisedData} = useQuery(amountRaisedQuery, {
    pollInterval: 60 * 1000, // Poll once per minute
    ssr: true,
    skip: !isEAForum,
  });

  const { data: leaderboardData } = useQuery<{ GivingSeason2024VoteCounts: IRPossibleVoteCounts }>(leaderboardQuery, {
    ssr: true,
  });

  return (
    <givingSeasonEventsContext.Provider value={{
      events,
      currentEvent,
      selectedEvent,
      setSelectedEvent,
      amountRaised: amountRaisedData?.GivingSeason2024DonationTotal ?? 0,
      amountTarget: 35000,
      leaderboard: leaderboardData?.GivingSeason2024VoteCounts
    }}>
      {children}
    </givingSeasonEventsContext.Provider>
  );
}

export const useGivingSeasonEvents = () => useContext(givingSeasonEventsContext)
