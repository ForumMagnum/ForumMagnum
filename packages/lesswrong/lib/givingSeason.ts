import { useCurrentTime } from "./utils/timeUtil";

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
    start: new Date("2025-11-10"),
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

export const useCurrentGivingSeasonEvent = () => {
  const currentTime = useCurrentTime();
  if (currentTime < givingSeasonEvents[0].start) {
    return givingSeasonEvents[0];
  }
  for (const event of givingSeasonEvents) {
    if (event.start <= currentTime && event.end > currentTime) {
      return event;
    }
  }
  return givingSeasonEvents[givingSeasonEvents.length - 1];
}

export const useDonationElectionAmount = () => {
  // TODO
  return {
    raised: 15293,
    target: 60000,
  };
}
