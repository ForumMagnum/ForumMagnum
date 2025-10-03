import type { CareerStageValue } from "@/lib/collections/users/helpers";
import moment from "moment";

/**
 * The max screen width where the Home RHS is visible
 */
export const HOME_RHS_MAX_SCREEN_WIDTH = 1370;

// list of "interested in" / "experienced in" / "working in" options from EAG
type EAGOccupationOrCause =
  'Academic research'|
  'AI safety technical research'|
  'AI strategy & policy'|
  'Alternative proteins'|
  'Biosecurity'|
  'China-Western relations'|
  'Civilisational recovery/resilience'|
  'Climate change mitigation'|
  'Communications/Marketing'|
  'Consulting'|
  'Counselling/Social work'|
  'Creatives'|  // This might be a stray value, only one person had this
  'Data science/Data visualization'|
  'EA community building/community management'|
  'Earning to give'|
  'Education'|
  'Entrepreneurship'|
  'Event production'|
  'Farmed animal welfare'|
  'Finance/Accounting'|
  'General X-Risk'|
  'Global coordination & peace-building'|
  'Global health & development'|
  'Global mental health & well-being'|
  'Global priorities research'|
  'Grantmaking'|
  'Graphic design'|
  'Healthcare/Medicine'|
  'HR/People operations'|
  'Improving institutional decision making'|
  'Information security'|
  'Journalism'|
  'Machine learning'|
  'Nuclear security'|
  'Operations'|
  'People management'|
  'Philanthropy'|
  'Policymaking/Civil service'|
  'Politics'|
  'Product management'|
  'Project management/ Program management'|
  'Software development/Software engineering'|
  'Space governance'|
  'S-risks'|
  'Technology'|
  'User experience design/research'|
  'Wild animal welfare'|
  'Writing'

export type EAGWillingToRelocateOption =
  'I’d be excited to move here or already live here'|
  'I’d be willing to move here for a good opportunity'|
  'I’m hesitant to move here, but would for a great opportunity'|
  'I’m unwilling or unable to move here'
  
type EAGWillingToRelocateLocation =
  'BayArea'|
  'Boston'|
  'DC'|
  'London'|
  'NYC'|
  'Oxford'|
  'Remote'

type JobAdData = {
  careerStages?: CareerStageValue[],                    // used to match on career stages (either from the user profile or EAG)
  experiencedIn?: EAGOccupationOrCause[],               // used to match on EAG experience
  interestedIn?: EAGOccupationOrCause[],                // used to match on EAG interests
  subscribedTagIds?: string[],                          // used to match on a set of topics that the user is subscribed to
  readCoreTagIds?: string[],                            // used to match on a set of core topics that the user has read frequently
  coreTagReadsThreshold?: number,                       // used to adjust the threshold for how many post reads per topic to qualify for seeing the ad
  logo: string,                                         // url for org logo
  occupation: string,                                   // text displayed in the tooltip
  feedbackLinkPrefill: string,                          // url param used to prefill part of the feedback form
  bitlyLink: string,                                    // bitly link to the job ad page
  role: string,
  insertThe?: boolean,                                  // set if you want to insert a "the" before the org name
  org: string,
  orgLink: string,                                      // internal link on the org name
  salary?: string,
  location: string,
  countryCode?: string,                                 // if provided, only show to users who we think are in this country (match on account location)
  countryName?: string,                                 // if provided, only show to users who we think are in this country (match on EAG data)
  city?: string,                                        // if provided, only show to users who we think are in or near this city
  willingToRelocateTo?: EAGWillingToRelocateLocation,   // if provided, only show to users who live here or are excited/willing to move here (match on EAG data)
  roleType?: string,                                    // i.e. part-time, contract
  deadline?: moment.Moment,                             // also used to hide the ad after this date
}

// job-specific data for the ad
// (also used in the reminder email, so links in the description need to be absolute)
export const JOB_AD_DATA: Record<string, JobAdData> = {
  'iaps-ai-policy-fellowship': {
    careerStages: ['earlyCareer'],
    interestedIn: ['AI strategy & policy'],
    subscribedTagIds: [
      'u3Xg8MjDe2e6BvKtv' // AI governance
    ],
    logo: 'https://80000hours.org/wp-content/uploads/2023/10/institute_for_ai_policy_and_strategy_iaps_logo-160x160.jpeg',
    occupation: 'AI policy',
    feedbackLinkPrefill: 'AI+Policy+Fellow+at+IAPS',
    bitlyLink: "https://efctv.org/49OaBpB", // https://www.iaps.ai/fellowship
    role: 'AI Policy Fellow',
    insertThe: true,
    org: 'Institute for AI Policy & Strategy',
    orgLink: '/topics/institute-for-ai-policy-and-strategy',
    salary: '$5k per month',
    location: 'Remote',
    deadline: moment('2024-03-18'),
  },
  'cea-head-of-comms': {
    careerStages: ['midCareer', 'lateCareer'],
    experiencedIn: ['Communications/Marketing', 'Journalism'],
    logo: 'https://80000hours.org/wp-content/uploads/2022/12/CEA-160x160.png',
    occupation: 'communications',
    feedbackLinkPrefill: 'Head+of+Communications+at+CEA',
    bitlyLink: "https://efctv.org/3Terl1X", // https://www.centreforeffectivealtruism.org/careers/head-of-communications
    role: 'Head of Communications',
    insertThe: true,
    org: 'Centre for Effective Altruism',
    orgLink: '/topics/centre-for-effective-altruism-1',
    salary: '$97k - $170k',
    location: 'Remote',
    deadline: moment('2024-03-29'),
  },
  'fem-head-of-ops': {
    careerStages: ['midCareer', 'lateCareer'],
    experiencedIn: ['Operations'],
    interestedIn: ['Global health & development'],
    subscribedTagIds: [
      'sWcuTyTB5dP3nas2t', // GH&D
    ],
    logo: 'https://80000hours.org/wp-content/uploads/2022/05/Family-Empowerment-Media-160x160.png',
    occupation: 'ops and global health & development',
    feedbackLinkPrefill: 'Head+of+Operations+at+FEM',
    bitlyLink: "https://efctv.org/4c50Kxd", // https://docs.google.com/document/d/1Crui7aF5tEU-EYpC5dJ-fCTzXenmR85x9CFb3k3H8wo/edit
    role: 'Head of Operations',
    org: 'Family Empowerment Media',
    orgLink: '/topics/family-empowerment-media',
    salary: '$50k - $65k',
    location: 'Remote',
  },
  'cais-research-engineer': {
    careerStages: ['earlyCareer'],
    experiencedIn: ['Software development/Software engineering'],
    interestedIn: ['AI safety technical research'],
    subscribedTagIds: [
      'oNiQsBHA3i837sySD', // AI safety
    ],
    logo: 'https://80000hours.org/wp-content/uploads/2023/11/Center-for-AI-safety-160x160.jpeg',
    occupation: 'AI safety',
    feedbackLinkPrefill: 'Research+Engineer+at+CAIS',
    bitlyLink: "https://efctv.org/49OMlU9", // https://jobs.lever.co/aisafety/297ef7ae-a5aa-4c7e-a954-bf4535fd0e88
    role: 'Research Engineer',
    insertThe: true,
    org: 'Center for AI Safety',
    orgLink: '/topics/center-for-ai-safety',
    salary: '$120k - $160k',
    location: 'San Francisco, CA',
    city: 'San Francisco',
    willingToRelocateTo: 'BayArea',
  },
};
