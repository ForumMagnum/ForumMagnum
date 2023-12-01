import moment from "moment";

export const eaGivingSeason23ElectionName = "givingSeason23";

export const donationElectionLink = "/posts/hAzhyikPnLnMXweXG/participate-in-the-donation-election-and-the-first-weekly";
export const donationElectionFundraiserLink = "https://www.givingwhatwecan.org/fundraisers/ea-forum-donation-election-fund-2023";
export const setupFundraiserLink = "https://www.givingwhatwecan.org/fundraisers";
export const postsAboutElectionLink = "/topics/donation-election-2023";
export const electionCandidatesPostLink = "/posts/bBm64htDSKn3ZKiQ5/meet-the-candidates-in-the-forum-s-donation-election-2023"

export const votingOpensDate = new Date("2023-12-01");

export const donationElectionTagId = "EsNWGoFbs4MrqQ4G7";
export const effectiveGivingTagId = "L6NqHZkLc4xZ7YtDr";

/** Cloudinary ID for the giving portal hero image */
export const heroImageId = "giving_portal_23_hero";

/** Cloudinary ID for the frontpage header background image */
export const headerImageId = "giving_portal_23_hero";
export const votingHeaderImageId = "giving_portal_23_hero4";

/** Cloudinary ID for the voting portal thank you page background image */
export const votingThankYouImageId = "voting_portal_hero";

/** Approximately the time the election was accounced: https://forum.effectivealtruism.org/posts/x2KfyNe8oPR4dqGkf/ea-forum-plans-for-giving-season-2023 */
const votingAccountCreationCutoff = new Date("2023-10-23T19:00:00Z");

export const userCanVoteInDonationElection = (
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

export type TimelineSpan = {
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
  handleVote?: () => void,
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
      href: `/s/YvGiiYnekY7anj5FB`,
      consecutive: true,
    },
    {
      start: new Date("2023-11-14"),
      end: new Date("2023-11-21"),
      description: "Marginal Funding Week",
      href: "/s/xourt4HttDM5QcHsk",
      consecutive: true,
    },
    {
      start: new Date("2023-11-21"),
      end: new Date("2023-11-28"),
      description: "Donation Debate Week",
      href: `/s/exEpwrsESEELJji3n`,
      consecutive: true,
    },
    {
      start: new Date("2023-12-01"),
      end: new Date("2023-12-15"),
      description: "Vote in the Election",
      hideDates: true,
      hatched: true,
    },
  ],
};

// These are charities/orgs that are *not* election candidates, but are listed at the bottom of the Giving Portal
// in the "Other donation opportunities" section (after the election candidates).
export const otherDonationOpportunities = [
  {
    _id: '1',
    name: 'Centre for Effective Altruism',
    description: 'CEA helps to build and nurture the EA community; running EA conferences, the EA Forum, supporting groups, writing newsletters and content, and more.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1643318287/ea-logo-square-1200x1200__1_',
    href: 'https://www.centreforeffectivealtruism.org/',
    fundraiserLink: 'https://www.centreforeffectivealtruism.org/donate',
  },
  {
    _id: '2',
    name: 'Centre for Enabling EA Learning and Research',
    description: 'CEELAR is a free/subsidized living space for people seeking to do the most good they can with their time/resources.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1701453334/ZKCwwjyBMw2iA8ox6u1TJZCYqEphFaUlMEkXbKTXYZ9iE52L7KvDPVfy4WWQPD8SHRk9mK96bGB6-rssjrUKbjY_w16383',
    href: 'https://www.ceealar.org/',
    fundraiserLink: 'https://ceealar.org/donate/',
  },
  {
    _id: '3',
    name: 'Doebem',
    description: 'Doebem is a charity evaluator identifying effective giving opportunities in Brazil and globally.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1701453716/Screen_Shot_2023-12-01_at_1.01.42_PM',
    href: 'https://doebem.org.br/',
    fundraiserLink: 'https://doebem.org.br/checkout?org=fundoEficaz',
  },
  {
    _id: '4',
    name: 'EA Poland',
    description: 'EA Poland is a charity that organizes and grows the EA community in Poland.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1643318287/ea-logo-square-1200x1200__1_',
    href: 'https://efektywnyaltruizm.org/',
    fundraiserLink: 'https://efektywnyaltruizm.org/donate',
  },
  {
    _id: '5',
    name: 'Legal Impact for Chickens',
    description: 'LIC sues companies that break animal welfare commitments.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1701457394/lic-2023-logo-black-stacked-transparent-1',
    href: 'https://www.legalimpactforchickens.org/',
    fundraiserLink: 'https://www.legalimpactforchickens.org/donate',
  },
  {
    _id: '6',
    name: 'ML Alignment & Theory Scholars Program',
    description: 'MATS is a program that helps talented scholars upskill and get into AI safety.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1701457636/Screen_Shot_2023-12-01_at_2.07.02_PM',
    href: 'https://www.matsprogram.org/',
    fundraiserLink: 'https://manifund.org/projects/mats-funding',
  },
  {
    _id: '7',
    name: 'PIBBSS',
    description: 'PIBBSS is a program that facilitates research into the analogy between natural and artificial systems, in order to progress work on AI safety.',
    logoSrc: 'https://pibbss.ai/wp-content/uploads/2023/10/pibbssLogo.png',
    href: 'https://pibbss.ai/',
    fundraiserLink: 'https://pibbss.ai/contact-us/',
  },
  {
    _id: '8',
    name: 'Riesgos Catastróficos Globales',
    description: 'RCG investigates science policy opportunities to improve the management of GCRs in Spanish speaking countries.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1701458346/Screen_Shot_2023-12-01_at_2.18.49_PM',
    href: 'https://riesgoscatastroficosglobales.com/',
    fundraiserLink: 'https://riesgoscatastroficosglobales.com/dona',
  },
  {
    _id: '9',
    name: 'High Impact Medicine',
    description: 'Hi-Med is a program for promoting impact-driven careers and giving amongst medical students and professionals.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1701459039/Screen_Shot_2023-12-01_at_2.30.26_PM',
    href: 'https://www.highimpactmedicine.org/',
    fundraiserLink: 'https://www.every.org/high-impact-medicine?utmCampaign=donate-link#/donate/card',
  },
  {
    _id: '10',
    name: 'Maternal Health Initiative',
    description: 'MHI is a charity that helps Ghanaian women access family planning help and resources.',
    logoSrc: 'https://give.cornerstone.cc/assets/merchant/maternalhealthinitiative/images/logo.png?1662921546',
    href: 'https://maternalhealthinitiative.org/',
    fundraiserLink: 'https://give.cornerstone.cc/maternalhealthinitiative',
  },
  {
    _id: '11',
    name: 'Solar4Africa',
    description: 'Solar4Africa is a charity that builds and distributes solar technologies in Africa.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1701458893/Kuyere_logo_1200x1200',
    href: 'https://www.solar4africa.org/',
    fundraiserLink: 'https://www.omprakash.org/global/solar4africa/donate/',
  },
  {
    _id: '12',
    name: 'Spiro',
    description: 'Spiro is a new charity that aims to identify, screen and treat children living with TB sufferers.',
    logoSrc: 'https://res.cloudinary.com/cea/image/upload/q_auto,f_auto/v1701459133/Screen_Shot_2023-12-01_at_2.31.57_PM',
    href: 'https://www.spiro.ngo/',
    fundraiserLink: 'https://www.spiro.ngo/donate',
  },
  {
    _id: '13',
    name: 'Vida Plena',
    description: 'Vida Plena is a program that trains local communities to provide mental health care for depression in Latin America.',
    logoSrc: 'https://vidaplena.global/wp-content/uploads/2022/10/vida_plena_negro.png',
    href: 'https://vidaplena.global/',
    fundraiserLink: 'https://vidaplena.global/?form=give',
  },
]