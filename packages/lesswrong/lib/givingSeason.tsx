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
import { useCurrentTime } from "./utils/timeUtil";
import { useOnNavigate } from "@/components/hooks/useOnNavigate";
import { useLocation } from "./routeUtil";
import { useQuery } from "@apollo/client";
import { isEAForum } from "./instanceSettings";
import gql from "graphql-tag";

export const GIVING_SEASON_INFO_HREF = "/posts/srZEX2r9upbwfnRKw"; // TODO
export const ELECTION_INFO_HREF = "/posts/srZEX2r9upbwfnRKw"; // TODO
export const ELECTION_DONATE_HREF = "/donation-portal";
const ELECTION_TARGET_AMOUNT = 60000; // TODO

type GivingSeasonEvent = {
  name: string,
  description: string,
  readMoreHref?: string,
  tag?: {
    _id: string,
    slug: string,
  },
  start: Date,
  end: Date,
  color: string,
  desktopCloudinaryId: string,
  mobileCloudinaryId: string,
}

export const givingSeasonEvents: GivingSeasonEvent[] = [
  {
    name: "Funding strategy week",
    description: "Encouraging content around a range of important funding considerations.",
    readMoreHref: "/posts/srZEX2r9upbwfnRKw/giving-season-2024-announcement",
    tag: { // TODO
      _id: "4ktPbiFf6FLnfyRiC",
      slug: "funding-strategy-week-2024",
    },
    start: new Date("2025-10-22"), // TODO: Set this to 2025-11-10 before deploying
    end: new Date("2025-11-17"),
    color: "#F59469",
    desktopCloudinaryId: "week1_desktop_toao8n",
    mobileCloudinaryId: "week1_mobile_fwltv9",
  },
  {
    name: "Marginal funding week",
    description: "Encouraging content around a range of important funding considerations.",
    start: new Date("2025-11-17"),
    end: new Date("2025-11-24"),
    color: "#BCDFE1",
    desktopCloudinaryId: "week2_desktop_ydo4wc",
    mobileCloudinaryId: "week2_mobile_cbygzj",
  },
  {
    name: "Donation election",
    description: "Encouraging content around a range of important funding considerations.",
    start: new Date("2025-11-24"),
    end: new Date("2025-12-08"),
    color: "#FFC500",
    desktopCloudinaryId: "week3_desktop_hqdsiu",
    mobileCloudinaryId: "week3_mobile_kby9wq",
  },
  {
    name: "Why I donate week",
    description: "Encouraging content around a range of important funding considerations.",
    start: new Date("2025-12-08"),
    end: new Date("2025-12-15"),
    color: "#63C5D5",
    desktopCloudinaryId: "week4_desktop_s1iy4m",
    mobileCloudinaryId: "week4_mobile_u0l7pw",
  },
  {
    name: "Donation celebration",
    description: "Encouraging content around a range of important funding considerations.",
    start: new Date("2025-12-15"),
    end: new Date("2025-12-"),
    color: "#FF7454",
    desktopCloudinaryId: "week5_desktop_bqdvi3",
    mobileCloudinaryId: "week5_mobile_n7bysk",
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
    skip: !isEAForum || !isHomePage,
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
