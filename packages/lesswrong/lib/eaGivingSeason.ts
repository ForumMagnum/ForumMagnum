export const eaGivingSeason23ElectionName = "givingSeason23";

export const donationElectionLink = "#"; // TODO
export const setupFundraiserLink = "#"; // TODO
export const postsAboutElectionLink = "/topics/donation-election-2023";

export const votingOpensDate = new Date("2023-12-01");

export const donationElectionTagId = "EsNWGoFbs4MrqQ4G7";
export const effectiveGivingTagId = "L6NqHZkLc4xZ7YtDr";

type TimelinePoint = {
  date: Date,
  description: string,
}

type TimelineSpan = {
  start: Date,
  end: Date,
  description: string,
  hideDates?: boolean,
  hatched?: boolean,
}

export type TimelineSpec = {
  start: Date,
  end: Date,
  points: TimelinePoint[],
  spans: TimelineSpan[],
  divisionToPercent?: (division: number, divisions: number) => number,
}

export const timelineSpec: TimelineSpec = {
  start: new Date("2023-11-01"),
  end: new Date("2023-12-31"),
  points: [
    {date: new Date("2023-11-01"), description: "Election Fund opens"},
    {date: votingOpensDate, description: "Voting starts"},
    {date: new Date("2023-12-15"), description: "Voting ends"},
    {date: new Date("2023-12-31"), description: ""},
  ],
  spans: [
    {
      start: new Date("2023-11-07"),
      end: new Date("2023-11-14"),
      description: "Effective giving spotlight",
    },
    {
      start: new Date("2023-11-14"),
      end: new Date("2023-11-21"),
      description: "Marginal Funding Week",
    },
    {
      start: new Date("2023-11-21"),
      end: new Date("2023-11-28"),
      description: "Estimating cost-effectiveness",
    },
    {
      start: new Date("2023-12-01"),
      end: new Date("2023-12-15"),
      description: "Vote in the Election",
      hideDates: true,
      hatched: true,
    },
  ],
  // We have a lot of events in November and few in December. This function
  // allows us to space out Novemeber to use 75% of the timeline and only give
  // 25% to December.
  divisionToPercent: (division: number, divisions: number) => {
    const halfWay = divisions / 2;
    if (division < halfWay) {
      return (division / divisions) * 150;
    } else {
      return 75 + (((division - halfWay) / divisions) * 50);
    }
  },
};
