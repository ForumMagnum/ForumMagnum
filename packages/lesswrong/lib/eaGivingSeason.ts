import moment from "moment";

export const eaGivingSeason23ElectionName = "givingSeason23";

export const donationElectionLink = "#"; // TODO

export const votingOpensDate = new Date("2023-12-01");

// TODO: This tag doesn't exist yet
export const donationElectionTagId = "L6NqHZkLc4xZ7YtDr";
export const effectiveGivingTagId = "L6NqHZkLc4xZ7YtDr";

const votingAccountCreationCutoff = new Date("2023-10-23");

const userCanVoteInDonationElection = (
  user: UsersCurrent | DbUser | null,
) =>
  !!user && new Date(user.createdAt).getTime() < votingAccountCreationCutoff.getTime();

export const assertUserCanVoteInDonationElection = (
  user: UsersCurrent | DbUser | null,
) => {
  if (!userCanVoteInDonationElection(user)) {
    const date = moment(votingAccountCreationCutoff).format("Do MMMM YYYY");
    throw new Error(`To vote in this election your account must be created before ${date}`);
  }
}

type TimelinePoint = {
  date: Date,
  description: string,
}

type TimelineSpan = {
  start: Date,
  end: Date,
  description: string,
}

export type TimelineSpec = {
  start: Date,
  end: Date,
  points: TimelinePoint[],
  spans: TimelineSpan[],
}

export const timelineSpec: TimelineSpec = {
  start: new Date("2023-11-15"),
  end: new Date("2023-12-31"),
  points: [
    {date: new Date("2023-11-28"), description: "Giving Tuesday"},
    {date: votingOpensDate, description: "Voting starts"},
    {date: new Date("2023-12-15"), description: "Voting ends"},
    {date: new Date("2023-12-20"), description: "Election winner announced"},
  ],
  spans: [
    {
      start: new Date("2023-11-21"),
      end: new Date("2023-11-28"),
      description: "Effective giving spotlight Week",
    },
    {
      start: new Date("2023-11-30"),
      end: new Date("2023-12-07"),
      description: "Marginal Funding Week",
    },
    {
      start: new Date("2023-12-08"),
      end: new Date("2023-12-16"),
      description: "Forum BOTEC-a-thon Week",
    },
  ],
};
