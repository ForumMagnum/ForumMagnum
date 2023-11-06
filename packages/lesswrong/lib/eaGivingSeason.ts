import moment from "moment";

export const eaGivingSeason23ElectionName = "givingSeason23";

export const donationElectionLink = "/posts/hAzhyikPnLnMXweXG/participate-in-the-donation-election-and-the-first-weekly";
export const donationElectionFundraiserLink = "https://www.givingwhatwecan.org/fundraisers/ea-forum-donation-election-fund-2023";
export const setupFundraiserLink = "https://www.givingwhatwecan.org/fundraisers";
export const postsAboutElectionLink = "/topics/donation-election-2023";

export const votingOpensDate = new Date("2023-12-01");

export const donationElectionTagId = "EsNWGoFbs4MrqQ4G7";
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
  href?: string,
  consecutive?: boolean,
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
  end: new Date("2023-12-20"),
  points: [
    {date: new Date("2023-11-01"), description: ""},
    {date: votingOpensDate, description: ""},
    {date: new Date("2023-12-15"), description: ""},
    {date: new Date("2023-12-20"), description: ""},
  ],
  spans: [
    {
      start: new Date("2023-11-07"),
      end: new Date("2023-11-14"),
      description: "Effective Giving Spotlight",
      href: `${donationElectionLink}#Effective_Giving_Spotlight`,
      consecutive: true,
    },
    {
      start: new Date("2023-11-14"),
      end: new Date("2023-11-21"),
      description: "Marginal Funding Week",
      href: `${donationElectionLink}#Marginal_Funding_Week`,
      consecutive: true,
    },
    {
      start: new Date("2023-11-21"),
      end: new Date("2023-11-28"),
      description: "Donation Debate Week",
      href: `${donationElectionLink}#Donation_Debate_Week`,
      consecutive: true,
    },
    {
      start: new Date("2023-12-01"),
      end: new Date("2023-12-15"),
      description: "Vote in the Election",
      href: `${donationElectionLink}#Voting_opens_December_1___more_information`,
      hideDates: true,
      hatched: true,
    },
  ],
};
