export type GivingPortalOrg = {
  name: string,
  logoSrc: string,
  href: string,
  preVoteCount: number,
  description: string,
}

const orgs: GivingPortalOrg[] = [
  {
    name: "Rethink Priorities",
    logoSrc: "https://images.squarespace-cdn.com/content/v1/5d0026086571b00001028877/1600883588358-CT8GRXPV0OBEPV0BTTAG/83473139_110918283816707_8043830058659348480_n.png?format=120w",
    href: "https://rethinkpriorities.org/",
    preVoteCount: 43,
    description: "Rethink Priorities’ Existential Security Team is working to cause the greatest expected increase it can to the value of the long-term future. It focuses on research and field...",
  },
  {
    name: "Charity Entrepreneurship",
    logoSrc: "https://scontent-lhr8-1.xx.fbcdn.net/v/t39.30808-6/266335298_1795843907292437_3163044476636653261_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=5f2048&_nc_ohc=AiG-Q9rhFt8AX-gPsDZ&_nc_ht=scontent-lhr8-1.xx&oh=00_AfCdt1pBmMu5Eid4EcZ5xs4NuhPpckccRgstZf_xa9LMMg&oe=6535FF65",
    href: "https://www.charityentrepreneurship.com/",
    preVoteCount: 3,
    description: "Charity Entrepreneurship is a research and training programme that incubates multiple effective charities annually.",
  },
  {
    name: "The Humane League",
    logoSrc: "https://cdn.sanity.io/images/4rsg7ofo/production/eba5552ff1fab9dda018e95b195aa4adbec14c59-1000x1000.jpg",
    href: "https://thehumaneleague.org/",
    preVoteCount: 1,
    description: "The Humane League exists to end the abuse of animals raised for food. It does this by influencing the policies of the world’s biggest companies, demanding legislation, and...",
  },
  {
    name: "GiveDirectly",
    logoSrc: "https://cdn.sanity.io/images/4rsg7ofo/production/e757f11bc42968f513edb9ecb1844e67431e16d9-1000x1000.jpg",
    href: "https://www.givedirectly.org/",
    preVoteCount: 0,
    description: "GiveDirectly is a nonprofit that lets donors send money directly to the world’s poorest households. GiveDirectly believes people living in poverty deserve the dignity to...",
  },
];

export const useElectionCandidates = () => {
  // TODO: Fetch this from the backend
  return orgs;
}

export const useDonationOpportunities = () => {
  // TODO: Fetch this from the backend
  return orgs;
}
