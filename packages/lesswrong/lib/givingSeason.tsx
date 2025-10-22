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

export const ELECTION_INFO_HREF = "/posts/srZEX2r9upbwfnRKw";
export const ELECTION_DONATE_HREF = "/donation-portal";

type GivingSeasonEvent = {
  name: string,
  description: string,
  readMoreHref?: string,
  start: Date,
  end: Date,
  color: string,
}

export const givingSeasonEvents: GivingSeasonEvent[] = [
  {
    name: "Funding strategy week",
    description: "Encouraging content around a range of important funding considerations.",
    readMoreHref: "/posts/srZEX2r9upbwfnRKw/giving-season-2024-announcement",
    start: new Date("2025-10-22"), // TODO: Set this to 2025-11-10 before deploying
    end: new Date("2025-11-17"),
    color: "#F59469",
  },
  {
    name: "Marginal funding week",
    description: "Encouraging content around a range of important funding considerations.",
    start: new Date("2025-11-17"),
    end: new Date("2025-11-24"),
    color: "#BCDFE1",
  },
  {
    name: "Donation election",
    description: "Encouraging content around a range of important funding considerations.",
    start: new Date("2025-11-24"),
    end: new Date("2025-12-08"),
    color: "#FFC500",
  },
  {
    name: "Why I donate week",
    description: "Encouraging content around a range of important funding considerations.",
    start: new Date("2025-12-08"),
    end: new Date("2025-12-15"),
    color: "#63C5D5",
  },
  {
    name: "Donation celebration",
    description: "Encouraging content around a range of important funding considerations.",
    start: new Date("2025-12-15"),
    end: new Date("2025-12-"),
    color: "#FF7454",
  },
];

export const useCurrentGivingSeasonEvent = (): GivingSeasonEvent | null => {
  const currentTime = useCurrentTime();
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
  const currentEvent = useCurrentGivingSeasonEvent()
  const defaultEvent = currentEvent ?? givingSeasonEvents[0];
  const [selectedEvent, setSelectedEvent] = useState(defaultEvent);

  const onNavigate = useCallback(() => {
    setSelectedEvent(defaultEvent);
  }, [defaultEvent]);
  useOnNavigate(onNavigate);

  const value = useMemo(() => ({
    currentEvent,
    selectedEvent,
    setSelectedEvent,
    amountRaised: 15293, // TODO: Fetch correct amount from database
    amountTarget: 60000,
  }), [currentEvent, selectedEvent, setSelectedEvent]);
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
