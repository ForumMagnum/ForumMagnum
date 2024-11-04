import React, { Dispatch, ReactNode, createContext, useContext, useState } from "react";
import { isEAForum, siteUrlSetting } from "@/lib/instanceSettings";
import { Link } from "@/lib/reactRouterWrapper";
import moment, { Moment } from "moment";
import qs from "qs";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";

export const GIVING_SEASON_DESKTOP_WIDTH = 1220;
export const GIVING_SEASON_MOBILE_WIDTH = 900;

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
  background: string,
  darkText?: boolean,
}

const events: GivingSeasonEvent[] = [
  {
    name: "Funding Strategy Week",
    description: <>
      This week, we are encouraging content around a range of important funding{" "}
      considerations.{" "}
      <Link to="/posts/srZEX2r9upbwfnRKw/giving-season-2024-announcement#November_4___10__Funding_Strategy_Week">
        Read more
      </Link>.
    </>,
    start: moment("2024-11-04").utc(),
    end: moment("2024-11-10").utc(),
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
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5064.jpg",
  },
  {
    name: "Donation Election",
    description: <>
      A crowd-sourced pot of funds will be distributed amongst three charities{" "}
      based on your votes.{" "}
      <Link to="/posts/srZEX2r9upbwfnRKw/giving-season-2024-announcement#November_18___December_3__Donation_Election">
        Find out more
      </Link>.
    </>,
    start: moment("2024-11-18").utc(),
    end: moment("2024-12-03").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5069.jpg",
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

const getCurrentEvent = (): GivingSeasonEvent | null => {
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
}

const givingSeasonEventsContext = createContext<GivingSeasonEventsContext>({
  events,
  currentEvent: getCurrentEvent(),
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

export const GivingSeasonEventsProvider = ({children}: {children: ReactNode}) => {
  const currentEvent = getCurrentEvent();
  const [selectedEvent, setSelectedEvent] = useState(currentEvent ?? events[0]);

  const {data} = useQuery(amountRaisedQuery, {
    pollInterval: 60 * 1000, // Poll once per minute
    ssr: true,
    skip: !isEAForum,
  });

  return (
    <givingSeasonEventsContext.Provider value={{
      events,
      currentEvent,
      selectedEvent,
      setSelectedEvent,
      amountRaised: data?.GivingSeason2024DonationTotal ?? 0,
      amountTarget: 35000,
    }}>
      {children}
    </givingSeasonEventsContext.Provider>
  );
}

export const useGivingSeasonEvents = () => useContext(givingSeasonEventsContext)
