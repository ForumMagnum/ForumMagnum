import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useCurrentTime } from "../utils/timeUtil";
import { useOnNavigate } from "@/components/hooks/useOnNavigate";
import { useLocation } from "../routeUtil";
import { useQuery } from "@apollo/client";
import { isEAForum } from "../instanceSettings";
import gql from "graphql-tag";
import { userIsAdmin } from "../vulcan-users/permissions";

export const GIVING_SEASON_INFO_HREF = "/posts/RzdKnBYe3jumrZxkB/giving-season-2025-announcement";
export const ELECTION_INFO_HREF = "/posts/RzdKnBYe3jumrZxkB/giving-season-2025-announcement#November_24th_to_December_7th_";
export const ELECTION_LEARN_MORE_HREF = "/posts/93KvQDDQfaZEBTP7t/donation-election-fund-rewards-and-matching";
export const ELECTION_DONATE_HREF = "https://www.every.org/ea-forum-donation-election-2025";
export const ELECTION_2025_MATCHED_AMOUNT = 5000;
export const MARGINAL_FUNDING_SEQUENCE_ID = "jTAPdwYry3zTyifkZ";
export const MARGINAL_FUNDING_SPOTIFY_URL = "https://open.spotify.com/playlist/2wEYoo2FtV7OQQA0pATewT?si=XET3lr9aT9S-PFOGDvW6Kw";
export const SINGLE_COLUMN_BREAKPOINT = 700;
const ELECTION_TARGET_AMOUNT = 30000;

export const ACTIVE_DONATION_ELECTION = "givingSeason25";
export const DONATION_ELECTION_NUM_WINNERS = 3;
export const DONATION_ELECTION_SHOW_LEADERBOARD_CUTOFF = 100;
export const DONATION_ELECTION_ACCOUNT_AGE_CUTOFF = new Date("2025-10-24T00:00:00.000Z"); // Based on the time of https://forum.effectivealtruism.org/posts/RzdKnBYe3jumrZxkB/giving-season-2025-announcement
export const DONATION_ELECTION_APPROX_CLOSING_DATE = 'Dec 7th';
export const DONATION_ELECTION_START = new Date("2025-11-24T10:00:00.000Z");
export const DONATION_ELECTION_END = new Date("2025-12-08T00:00:00.000Z");

/**
 * Check if a user is allowed to vote in the donation election
 * @returns Object with `allowed` boolean and `reason` string explaining why if not allowed
 */
export function userIsAllowedToVoteInDonationElection(
  currentUser: UsersCurrent | DbUser | null,
  now: Date,
): { allowed: boolean; reason: string } {
  if (!currentUser) {
    return { allowed: false, reason: "You must be logged in to vote" };
  }

  if (currentUser.banned) {
    return { allowed: false, reason: "Banned users cannot vote" };
  }

  const isAdmin = userIsAdmin(currentUser);

  // Admins can always vote
  if (isAdmin) {
    return { allowed: true, reason: "" };
  }

  // Check if voting is currently open
  const votingOpen = now >= DONATION_ELECTION_START && now < DONATION_ELECTION_END;
  if (!votingOpen) {
    if (now < DONATION_ELECTION_START) {
      return { allowed: false, reason: "Voting has not yet opened" };
    } else {
      return { allowed: false, reason: "Voting has closed" };
    }
  }

  // Check if account is old enough
  if (new Date(currentUser.createdAt) > DONATION_ELECTION_ACCOUNT_AGE_CUTOFF) {
    return { allowed: false, reason: "Your account is too young to vote in the Donation Election" };
  }

  return { allowed: true, reason: "" };
}

type GivingSeasonEvent = {
  name: string,
  description: string,
  readMoreHref: string,
  tag?: {
    _id: string,
    slug: string,
  },
  start: Date,
  end: Date,
  color: string,
  desktopCloudinaryId: string,
  mobileCloudinaryId: string,
  feedCount: number,
}

export const givingSeasonEvents: GivingSeasonEvent[] = [
  {
    name: "Funding strategy week",
    description: "A week for discussing funding diversification, when to donate, and other strategic questions.",
    readMoreHref: "/posts/RzdKnBYe3jumrZxkB/giving-season-2025-announcement#November_10th_to_16th",
    tag: {
      _id: "kSLB5r7cX77Lbuegw",
      slug: "funding-strategy-week-2025",
    },
    start: new Date("2025-11-10"),
    end: new Date("2025-11-17"),
    color: "#BCDFE1",
    desktopCloudinaryId: "week2_desktop_ydo4wc",
    mobileCloudinaryId: "week2_mobile_cbygzj",
    feedCount: 4,
  },
  {
    name: "Marginal funding week",
    description: "A week for organisations to share what they could do with extra funding.",
    readMoreHref: "/marginal-funding",
    tag: {
      _id: "hmhCHsvuminjfEPhy",
      slug: "marginal-funding-week-2025",
    },
    start: new Date("2025-11-17"),
    end: new Date("2025-11-24T10:00:00.000Z"),
    color: "#FF7454",
    desktopCloudinaryId: "week3_desktop_hqdsiu",
    mobileCloudinaryId: "week3_mobile_kby9wq",
    feedCount: 3,
  },
  {
    name: "Donation election",
    description: "Allocating a pot of collective funds to three organisations, based on your votes.",
    readMoreHref: "/posts/RzdKnBYe3jumrZxkB/giving-season-2025-announcement#November_24th_to_December_7th_",
    tag: {
      _id: "5S6ttX5JADjsPpxym",
      slug: "donation-election-2025",
    },
    start: new Date("2025-11-24T10:00:00.000Z"),
    end: new Date("2025-12-08"),
    color: "#FFC500",
    desktopCloudinaryId: "week4_desktop_s1iy4m",
    mobileCloudinaryId: "week4_mobile_u0l7pw",
    feedCount: 0,
  },
  {
    name: "Why I donate week",
    description: "A week to share the personal stories and reasons behind our donations.",
    readMoreHref: "/posts/RzdKnBYe3jumrZxkB/giving-season-2025-announcement#December_8th_to_14th",
    tag: {
      _id: "pxHqtADbp4vCEndc8",
      slug: "why-i-donate-week-2025",
    },
    start: new Date("2025-12-08"),
    end: new Date("2025-12-15"),
    color: "#63C5D5",
    desktopCloudinaryId: "week1_desktop_toao8n",
    mobileCloudinaryId: "week1_mobile_fwltv9",
    feedCount: 4,
  },
  {
    name: "Donation celebration",
    description: "When you’ve finished making your giving season donations, add a heart to the banner and celebrate with us!",
    readMoreHref: "/posts/RzdKnBYe3jumrZxkB/giving-season-2025-announcement#December_15th_to_the_end_of_the_year",
    start: new Date("2025-12-15"),
    end: new Date("2025-12-31"),
    color: "#F59469",
    desktopCloudinaryId: "week5_desktop_bqdvi3",
    mobileCloudinaryId: "week5_mobile_n7bysk",
    feedCount: 0,
  },
];

export const useCurrentGivingSeasonEvent = (): GivingSeasonEvent | null => {
  const currentTime = useCurrentTime();
  if (!isEAForum) {
    return null;
  }
  for (const event of givingSeasonEvents) {
    if (event.start <= currentTime && event.end > currentTime) {
      return event;
    }
  }
  return null;
}

type GivingSeasonContext = {
  currentEvent: GivingSeasonEvent | null,
  selectedEvent: GivingSeasonEvent,
  setSelectedEvent: Dispatch<SetStateAction<GivingSeasonEvent>>,
  amountRaised: number,
  amountTarget: number,
}

const givingSeasonContext = createContext<GivingSeasonContext | null>(null)

export const GivingSeasonContext = ({children}: {children: ReactNode}) => {
  const {currentRoute} = useLocation();
  const isHomePage = currentRoute?.name === "home";
  const isVotingPortalPage = currentRoute?.name === "VotingPortal";
  const currentEvent = useCurrentGivingSeasonEvent()
  const defaultEvent = currentEvent ?? givingSeasonEvents[0];
  const [selectedEvent, setSelectedEvent] = useState(defaultEvent);

  const onNavigate = useCallback(() => {
    setSelectedEvent(defaultEvent);
  }, [defaultEvent]);
  useOnNavigate(onNavigate);

  const {data} = useQuery(gql`
    query GivingSeason2025DonationTotal {
      GivingSeason2025DonationTotal
    }
  `, {
    pollInterval: 60 * 1000, // Poll once per minute
    ssr: true,
    skip: !isEAForum || (!isHomePage && !isVotingPortalPage),
  });
  const amountRaised = Math.round(data?.GivingSeason2025DonationTotal ?? 0);

  const value = useMemo(() => ({
    currentEvent,
    selectedEvent,
    setSelectedEvent,
    amountRaised,
    amountTarget: ELECTION_TARGET_AMOUNT,
  }), [currentEvent, selectedEvent, setSelectedEvent, amountRaised]);
  return (
    <givingSeasonContext.Provider value={value}>
      {children}
    </givingSeasonContext.Provider>
  );
}

export const useGivingSeason = () => {
  const value = useContext(givingSeasonContext)
  if (!value) {
    throw new Error("Giving season context not found");
  }
  return value;
}
