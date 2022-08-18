import React from 'react';
import { Components, getSiteUrl, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { useCreate } from '../../lib/crud/withCreate';
import { useMulti } from '../../lib/crud/withMulti';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Button from '@material-ui/core/Button';

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
    borderRadius: '3px 9px 3px 3px',
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
    marginTop: 20
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
  },
  advisors: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    padding: '10px 0',
    borderTop: `2px solid ${theme.palette.primary.main}`,
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    marginTop: 10,
  },
  feedbackText: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 16,
    marginTop: 40
  },
  contactEmail: {
    color: theme.palette.primary.main,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 16,
    marginTop: 6
  }
})

const AdvisorsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { query } = useLocation()
  const { flash } = useMessages()
  const { captureEvent } = useTracking()

  const { SingleColumnSection, HeadTags, AdvisorCard } = Components

  const { create: createAdvisorRequest } = useCreate({
    collectionName: 'AdvisorRequests',
    fragmentName: 'AdvisorRequestsMinimumInfo',
  })
  const { count } = useMulti({
    terms: {view: 'requestsByUser', userId: currentUser?._id},
    collectionName: 'AdvisorRequests',
    fragmentName: 'AdvisorRequestsMinimumInfo',
    skip: !currentUser
  })

  const onRequest = async () => {
    // track that the current user requested a chat
    if (currentUser && !count) {
      await createAdvisorRequest({
        data: {userId: currentUser._id}
      });
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
  const shareLink = `${getSiteUrl()}/advisors${currentUser ? `?ref=${encodeURIComponent(currentUser.displayName)}` : ''}`
  
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
              mitigate <a href="/topics/biosecurity" target="_blank" rel="noopener noreferrer" className={classes.link}>
                global catastrophic biological risks
              </a>? Get some personalized advice from a professional in this field.
            </span>
          </div>
          <div className={classes.descriptionRow}>
            The 30-minute meeting will allow you to get career advice, learn about the professional's experience,
            and ask questions about topics of common interest.
          </div>
          <div className={classes.descriptionRow}>
            <div className={classes.bold}>Who is this for?</div>
            <div>
              Anyone seriously interested in working on
              mitigating <a href="/topics/global-catastrophic-biological-risk" target="_blank" rel="noopener noreferrer" className={classes.link}>
                catastrophic biological risks
              </a>, like the risk of an engineered pandemic. If you're unsure, you can read
              the <a href="https://80000hours.org/problem-profiles/preventing-catastrophic-pandemics/" target="_blank" rel="noopener noreferrer" className={classes.link}>
                80,000 Hours problem profile on this here
              </a>.
            </div>
            <div>
              Note that <span className={classes.bold}>you don't have to have any experience</span> in the field;
              we have advisors prepared to talk to people at different career stages.
            </div>
          </div>
          <div className={classes.descriptionRow}>
            <div className={classes.bold}>If in doubt, request a call!</div>
            <div>
              You won't be wasting anyone's time. The advisors here have decided that this is a good use
              of their time — if a call gets set up, you can assume everyone wants to be there.
              And the form is quick — less than 5 minutes to fill out.
            </div>
          </div>
          <div className={classes.descriptionRow}>
            <div className={classes.bold}>We'll prioritize based on your interests and CV</div>
            Advisors have limited availability so we'll prioritize people based on relevance to their
            stated interests and background.
          </div>
          <div className={classes.descriptionRow}>
            As an early access beta, this service is free. We will ask for your feedback after the
            chat. <span className={classes.italic}>
              <a href="/" target="_blank" rel="noopener noreferrer" className={classes.link}>
                You can find additional information and an FAQ here.
              </a>
            </span>
          </div>
          
          {btnsNode}
          
          <h2 className={classes.advisorsHeadline}>Meet the advisors</h2>
          <div className={classes.advisors}>
            <AdvisorCard user={{
              profileImageId: 'v1645651807/amy-presentation.png',
              name: 'Simon Grimm',
              jobTitle: 'Researcher',
              organization: 'Sculpting Evolution',
              location: 'Boston, MA, USA',
              linkedinProfileSlug: 'sarahycheng',
              twitterProfileSlug: '',
              askMeAbout: [
                'Pathogen evolution and biophysics',
                'Applying to grad school',
                'Working at the United Nations',
                'Organizing EA workshops'
              ]
            }} />
            <AdvisorCard user={{
              profileImageId: 'v1649941603/Most_Important_Century_Statues.jpg',
              name: 'Phoenix Wright',
              jobTitle: 'Grad student',
              organization: 'MIT',
              location: 'Cambridge, MA, USA',
              linkedinProfileSlug: '',
              twitterProfileSlug: '',
              askMeAbout: ['Stepladders']
            }} />
            <AdvisorCard user={{
              profileImageId: 'v1534973232/sample.jpg',
              name: 'Miles Edgeworth',
              jobTitle: 'Prosecutor',
              organization: 'Old Bailey',
              location: 'London, UK',
              linkedinProfileSlug: '',
              twitterProfileSlug: '',
              askMeAbout: ['Cravats']
            }} />
            <AdvisorCard user={{
              profileImageId: 'v1534973232/sample.jpg',
              name: 'Maya Fey',
              jobTitle: 'Medium-in-training',
              organization: 'Kurain Village',
              location: 'Sydney, Australia',
              linkedinProfileSlug: '',
              twitterProfileSlug: '',
              askMeAbout: ['Ladders']
            }} />
          </div>
          
          {btnsNode}
          
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
