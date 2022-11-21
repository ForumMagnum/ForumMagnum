import React from 'react';
import { Components, getSiteUrl, registerComponent } from '../../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { useCreate } from '../../../lib/crud/withCreate';
import { useMulti } from '../../../lib/crud/withMulti';
import { useLocation } from '../../../lib/routeUtil';
import { useCurrentUser } from '../../common/withUser';
import { useMessages } from '../../common/withMessages';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Button from '@material-ui/core/Button';
import type { Advisor } from './AdvisorCard';
import { useDialog } from '../../common/withDialog';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.grey[0],
    padding: '24px 32px',
  },
  betaFlag: {
    display: 'inline-block',
    backgroundColor: theme.palette.background.primaryDim,
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: 3,
    marginTop: 8
  },
  headline: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 38,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 0
  },
  descriptionRow: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 14,
    lineHeight: '24px',
    marginTop: 16
  },
  bold: {
    fontWeight: 600,
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: theme.palette.primary.main
  },
  btnsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: '10px',
    marginTop: 30
  },
  requestBtn: {
    textTransform: 'none',
    fontSize: 16,
    boxShadow: 'none',
    padding: '14px 24px',
  },
  shareBtn: {
    textTransform: 'none',
    fontSize: 14,
    boxShadow: 'none',
    padding: '14px 24px',
  },
  requestBtnCancelText: {
    color: theme.palette.grey[500],
    fontFamily: theme.typography.fontFamily,
    marginTop: 10
  },
  advisorsHeadline: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 22,
    fontWeight: 700,
    marginTop: 30,
    marginBottom: 8
  },
  advisors: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(212px, 1fr))',
    padding: '35px 10px',
    columnGap: 20,
    rowGap: '30px',
    borderTop: `2px solid ${theme.palette.primary.main}`,
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    marginTop: 10,
  },
  communityHeadlineRow: {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
    alignItems: "baseline",
    marginTop: 70,
  },
  communityHeadline: {
    flexGrow: 1,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8
  },
  communityHeadlineButton: {
    fontFamily: theme.typography.fontFamily,
    background: 'none',
    color: theme.palette.primary.main,
    padding: 0,
    '&:hover': {
      opacity: 0.5
    },
    flex: "none",
  },
  communityBody: {
    borderTop: `2px solid ${theme.palette.primary.main}`,
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    paddingTop: 15
  },
  communitySubheadline: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 15,
    color: theme.palette.grey[700]
  },
  communityMembers: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(325px, 1fr))',
    columnGap: 30,
    rowGap: '30px',
    padding: '30px 10px 35px',
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: '1fr',
    }
  },
  feedbackText: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 16,
    marginTop: 50
  },
  contactEmail: {
    color: theme.palette.primary.main,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 16,
    marginTop: 6
  },
})

const advisors: Array<Advisor> = [
  {
    profileImageId: 'v1661205655/advisors/1605745710517.jpg',
    name: 'Ryan Teo',
    slug: 'ryan-teo',
    jobTitle: 'Political Affairs Intern',
    organization: 'UN Biological Weapons Convention',
    location: 'London / Singapore',
    linkedinProfileSlug: 'teojcryan',
    twitterProfileSlug: 'teojcryan',
    website: 'teojcryan.com',
    askMeAbout: [
      'Infectious disease modelling',
      'Applying to grad school',
      'Working at the United Nations',
    ]
  }, {
    profileImageId: 'v1661205259/advisors/WhatsApp_Image_2022-08-19_at_9.50.47_PM_-_Caitlin_Walker.jpg',
    name: 'Caitlin Walker',
    slug: 'caitlinwalker',
    jobTitle: 'Health Security PhD Student',
    organization: 'Johns Hopkins',
    location: 'Baltimore, MD, USA',
    linkedinProfileSlug: 'caitlin-walker-a0a812171',
    askMeAbout: [
      'Biosecurity and global health policy',
      'PhD/masters options and applications',
    ]
  }, {
    profileImageId: 'v1661272032/advisors/1645151898861_-_Ryan_Duncombe.jpg',
    name: 'Ryan Duncombe',
    slug: 'rduncombe',
    jobTitle: 'Scientist',
    organization: 'Alvea',
    location: 'San Francisco, CA, USA',
    linkedinProfileSlug: 'ryan-duncombe',
    askMeAbout: [
      'GCBRs',
      'Graduate school',
      'Immunology',
      'Vaccines',
    ]
  }, {
    profileImageId: 'v1661205259/advisors/729C728E-6348-4CDE-99BA-171A0A123F1B_1_105_c_-_Noga_Aharony.jpg',
    name: 'Noga Aharony',
    slug: 'nongiga',
    jobTitle: 'PhD Student',
    organization: 'Columbia University',
    location: 'New York City, USA',
    linkedinProfileSlug: 'nogaaharony',
    twitterProfileSlug: 'nongiga',
    website: 'noga.science',
    askMeAbout: [
      'Metagenomics & microbiology',
      'Machine learning & algorithms in biology',
      'Graduate school & applying',
      'Working at the Center for Health Security',
    ]
  }, {
    profileImageId: 'v1661205262/advisors/Screen_Shot_2022-06-02_at_6.35.17_AM_-_Adin_Richards.png',
    name: 'Adin Richards',
    slug: 'adin',
    jobTitle: 'Biosecurity Fellow',
    organization: 'Institute for Progress',
    location: 'Providence, RI, USA',
    linkedinProfileSlug: 'adin-richards-2b49a7220',
    askMeAbout: [
      'Biosecurity field building',
      'Organizing university discussion groups',
      'Policy research',
      'Pandemic preparedness (e.g. continuity of operation plans, critical infrastructure resilience)',
    ]
  }, {
    profileImageId: 'v1661205260/advisors/241668439_368152568131819_8579005214601011924_n_3_-_Oliver_Crook.jpg',
    name: 'Oliver Crook',
    slug: 'olly-crook',
    jobTitle: 'Todd-Bird Junior Research Fellow',
    organization: 'University of Oxford',
    location: 'Oxford, UK',
    linkedinProfileSlug: 'oliver-m-crook-1844a17a',
    twitterProfileSlug: 'OllyMCrook',
    askMeAbout: [
      'Mathematical biology',
      'Computational biochemistry',
      'Applying for research positions',
      'Academia',
      'Genetic engineering',
    ]
  }, {
    profileImageId: 'v1661205260/advisors/dan_headshot_2_cropped_-_Daniel_Greene.png',
    name: 'Dan Greene',
    slug: 'daniel-greene-1',
    jobTitle: 'Postdoctoral Scholar',
    organization: 'Stanford University',
    location: 'Santa Cruz, CA, USA',
    linkedinProfileSlug: 'daniel-greene-725ab258',
    website: 'danielgreene.net',
    askMeAbout: [
      'Laboratory biorisk management',
      'DURC policy',
      'Social-science applications to biosecurity',
      'Risk management training',
    ]
  }, {
    profileImageId: 'v1661379536/advisors/1653408925284_-_Simon_Grimm.jpg',
    name: 'Simon Grimm',
    slug: 'simon_grimm',
    jobTitle: 'Visiting Researcher',
    organization: 'MIT Media Lab, Nucleic Acid Observatory',
    location: 'Cambridge, MA, USA',
    linkedinProfileSlug: 'simon-grimm-7962311a8',
    twitterProfileSlug: 'simon__Grimm',
    askMeAbout: [
      'Biosecurity / Biomonitoring / DURC policy',
      'Career steps after graduation',
      'Thinking through the merits of different biosecurity interventions',
    ]
  }, {
    profileImageId: 'v1663346534/advisors/harshu_musunuri_-_Harshu_Musunuri.jpg',
    name: 'Harshu Musunuri',
    slug: 'harshu-musunuri-1',
    jobTitle: 'MD-PhD Student',
    organization: 'UCSF',
    location: 'San Francisco, CA, USA',
    linkedinProfileSlug: 'hmusu',
    twitterProfileSlug: 'HarshuMusunuri',
    askMeAbout: [
      'Technical biosecurity',
      'Medical countermeasures (especially vaccines and therapeutics)',
      'New ideas in pathogen detection/surveillance',
      'Dual-use research and regulation',
      'Biosecurity policy as it relates to implementation and practicality',
    ]
  },
]

// This page only exists for the Biosecurity topic
const TOPIC_ID = 'aELNHEKtcZtMwEkdK'

const AdvisorsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const { query } = useLocation()
  const { flash } = useMessages()
  const { captureEvent } = useTracking()
  const { openDialog } = useDialog()

  const { SingleColumnSection, HeadTags, AdvisorCard, Loading, CommunityMemberCard } = Components

  // const { create: createAdvisorRequest } = useCreate({
  //   collectionName: 'AdvisorRequests',
  //   fragmentName: 'AdvisorRequestsMinimumInfo',
  // })
  // const { count } = useMulti({
  //   terms: {view: 'requestsByUser', userId: currentUser?._id},
  //   collectionName: 'AdvisorRequests',
  //   fragmentName: 'AdvisorRequestsMinimumInfo',
  //   skip: !currentUser
  // })
  
  const { results: communityMembers, loading: communityMembersLoading } = useMulti({
    terms: {view: 'tagCommunityMembers', profileTagId: TOPIC_ID, hasBio: true, limit: 50},
    collectionName: 'Users',
    fragmentName: 'UsersProfile'
  })

  const onRequest = async () => {
    captureEvent('advisorRequestBtnClicked')
    // track that the current user requested a chat
    // if (currentUser && !count) {
    //   await createAdvisorRequest({
    //     data: {userId: currentUser._id}
    //   });
    // }
  }
  
  const handleJoin = () => {
    if (!currentUser) {
      openDialog({componentName: "LoginPopup"})
    } else {
      void updateCurrentUser({profileTagIds: [...(currentUser.profileTagIds || []), TOPIC_ID]})
    }
  }

  const handleRemove = () => {
    if (currentUser) {
      void updateCurrentUser({profileTagIds: currentUser.profileTagIds.filter((id) => id !== TOPIC_ID)});
    }
  }

  // link to the google form for signing up, and prefill some fields if necessary
  let formLink = 'https://docs.google.com/forms/d/e/1FAIpQLSdNoLVtdBe_lGY82NQ1wSfAEfSmtdxffK6PA3RueROYY_AMqQ/viewform?'
  if (currentUser) {
    formLink += `entry.539808253=${encodeURIComponent(currentUser.displayName)}`
  }
  if (query && query.ref) {
    formLink += `&entry.2006908680=${encodeURIComponent(query.ref)}`
  }
  // link that gets copied to clipboard when clicking the "Share" button
  const shareLink = `${getSiteUrl()}advice${currentUser ? `?ref=${encodeURIComponent(currentUser.displayName)}` : ''}`
  
  const btnsNode = <>
    <div className={classes.btnsRow}>
      <Button
        color="primary"
        variant="contained"
        className={classes.requestBtn}
        onClick={onRequest}
        href={formLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        Request a chat
      </Button>
      <CopyToClipboard
        text={shareLink}
        onCopy={() => {
          flash({messageString: 'Link copied'})
          captureEvent('advisorShareBtnClicked')
        }}
      >
        <Button color="primary" variant="outlined" className={classes.shareBtn}>
          Share this page
        </Button>
      </CopyToClipboard>
    </div>
    <div className={classes.requestBtnCancelText}>
      You can cancel your request at any time.
    </div>
  </>
  
  const isCurrentUserInList = communityMembers?.some(user => user._id === currentUser?._id)

  return <div>
    <HeadTags description="Request a chat with a biosecurity professional working on mitigating global catastrophic biological risks" />
    <AnalyticsContext pageContext="advisorPage">
      <SingleColumnSection>
        <div className={classes.root}>
          <div className={classes.betaFlag}>Beta</div>
          <h1 className={classes.headline}>Chat with a Biosecurity Professional</h1>
          <div className={classes.descriptionRow}>
            <span className={classes.bold}>
              Interested in using your career to
              mitigate <a href="https://80000hours.org/problem-profiles/preventing-catastrophic-pandemics/" target="_blank" rel="noopener noreferrer" className={classes.link}>
                global catastrophic biological risks
              </a>? Get some personalized advice from someone working in the field.
            </span>
          </div>
          <div className={classes.descriptionRow}>
            The 30-minute meeting with an advisor will allow you to get career advice,
            learn about their experience, and ask questions about topics of common interest.
          </div>
          <div className={classes.descriptionRow}>
            This service is free, and you don't have to have any prior experience in the field to use it.
            Advisors have limited time so we will prioritize advisees based on their background and stated interest.
          </div>
          <div className={classes.descriptionRow}>
            <span className={classes.italic}>
              We are currently testing out this service in beta mode - we'll ask for your feedback after the
              call. <a href="/posts/5rdwbfEAPoXtukvk3/get-advice-from-a-biosecurity-professional" target="_blank" rel="noopener noreferrer" className={classes.link}>
                You can find additional information and an FAQ here.
              </a>
            </span>
          </div>
          
          {btnsNode}
          
          <h2 className={classes.advisorsHeadline}>Meet the advisors</h2>
          <div className={classes.advisors}>
            {advisors.map(advisor => <AdvisorCard key={advisor.name} user={advisor} />)}
          </div>
          
          {btnsNode}
          
          <div className={classes.communityHeadlineRow}>
            <h2 className={classes.communityHeadline}>Meet others in the community</h2>
            {isCurrentUserInList ? (
              <button className={classes.communityHeadlineButton} onClick={handleRemove}>
                Remove me
              </button>
            ) : (
              <button className={classes.communityHeadlineButton} onClick={handleJoin}>
                Add me to the list
              </button>
            )}
          </div>
          <div className={classes.communityBody}>
            <div className={classes.communitySubheadline}>Find other people interested in working on biosecurity.</div>
            <div className={classes.communityMembers}>
              {(communityMembersLoading || !communityMembers) ? <Loading /> : <>
                  {communityMembers.map(user => <CommunityMemberCard key={user._id} user={user} />)}
                </>
              }
            </div>
          </div>
          
          <div className={classes.feedbackText}>
            Feedback or questions? Let us know!
          </div>
          <div className={classes.contactEmail}>
            <a href="mailto:forum@effectivealtruism.org" target="_blank" rel="noopener noreferrer">
              forum@effectivealtruism.org
            </a>
          </div>
        </div>
      </SingleColumnSection>
    </AnalyticsContext>
  </div>
}

const AdvisorsPageComponent = registerComponent(
  'AdvisorsPage', AdvisorsPage, {styles}
);

declare global {
  interface ComponentTypes {
    AdvisorsPage: typeof AdvisorsPageComponent
  }
}
