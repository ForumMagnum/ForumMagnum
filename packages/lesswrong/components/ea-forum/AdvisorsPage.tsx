import React, { useEffect, useState } from 'react';
import { combineUrls, Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { userCanEdit, userGetDisplayName, userGetProfileUrlFromSlug } from "../../lib/collections/users/helpers";
import { taglineSetting } from '../common/HeadTags';
import { siteNameWithArticleSetting  } from '../../lib/instanceSettings';
import StarIcon from '@material-ui/icons/Star'
import Button from '@material-ui/core/Button';
import { useCreate } from '../../lib/crud/withCreate';
import { useDialog } from '../common/withDialog';
import AdvisorRequests from '../../lib/collections/advisorRequests/collection';
import { useNavigation } from '../../lib/routeUtil';

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
    marginTop: 14
  },
  descriptionRow: {
    marginTop: 20
  },
  link: {
    color: theme.palette.primary.main
  },
  requestBtn: {
    textTransform: 'none',
    fontSize: 16,
    boxShadow: 'none',
    padding: '14px 24px',
    marginTop: 30
  },
  requestBtnCancelText: {
    color: theme.palette.grey[500],
    marginTop: 10
  },
  advisorsHeadline: {
    fontSize: 22,
    fontWeight: 700,
    paddingBottom: 10,
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    marginTop: 30,
  },
  advisors: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: 10
  }
})

const AdvisorsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  // const { query } = useLocation()
  // const [showPostSettings, setShowPostSetttings] = useState(false)

  const { SingleColumnSection, HeadTags, ContentStyles, Typography, AdvisorCard } = Components

  // const metaDescription = `${username}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`

  const { create: createAdvisorRequest } = useCreate({
    collection: AdvisorRequests,
    fragmentName: 'AdvisorRequestsMinimumInfo',
  });

  const { openDialog } = useDialog();
  const { history } = useNavigation();

  const onRequest = async () => {
    if (currentUser) {
      const request = await createAdvisorRequest({
        data: {userId: currentUser._id},
      });
      history.push("/advisor-request");
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    }
  }

  return <div>
    {/* <HeadTags
      description={metaDescription}
      image={user.profileImageId && `https://res.cloudinary.com/cea/image/upload/c_crop,g_custom,q_auto,f_auto/${user.profileImageId}.jpg`}
    /> */}
    <AnalyticsContext pageContext="advisorPage">
      <SingleColumnSection>
        <div className={classes.root}>
          <div className={classes.betaFlag}>Beta</div>
          <h1 className={classes.headline}>Chat with a Biosecurity Professional</h1>
          <Typography variant="body1" className={classes.descriptionRow}>
            Interested in using your career to
            mitigate <a href="https://80000hours.org/problem-profiles/preventing-catastrophic-pandemics/" target="_blank" className={classes.link}>
              global catastrophic biological risks
            </a>? Get some personalized advice from a professional in this field.
          </Typography>
          <Typography variant="body1" className={classes.descriptionRow}>
            After you submit your request, we'll match you with an advisor based on fit and availability.
            They are in a variety of career stages, including some current students, so if you're just getting started
            we can match you with someone more junior. They'll meet with you for a one-on-one 30 minute video chat.
          </Typography>
          <Typography variant="body1" className={classes.descriptionRow}>
            To get the most out of this service, we recommend you be familiar
            with <a href="https://effectivealtruism.org" target="_blank" className={classes.link}>
              effective altruism
            </a> and <a href="https://80000hours.org/problem-profiles/preventing-catastrophic-pandemics/" target="_blank" className={classes.link}>GCBRs</a> before requesting a chat.
          </Typography>
          <Typography variant="body1" className={classes.descriptionRow}>
            As an early access beta, this service is free. We will ask for your feedback after the chat.
          </Typography>
          
          <Button color="primary" variant="contained" className={classes.requestBtn} onClick={onRequest}>
            Request a chat
          </Button>
          <Typography variant="body2" className={classes.requestBtnCancelText}>
            You can cancel your request at any time.
          </Typography>
          
          <Typography variant="headline" className={classes.advisorsHeadline}>Meet the advisors</Typography>
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
              profileImageId: 'v1645651807/amy-presentation.png',
              name: 'Phoenix Wright',
              jobTitle: 'Grad student',
              organization: 'MIT',
              location: 'Cambridge, MA, USA',
              linkedinProfileSlug: '',
              twitterProfileSlug: '',
              askMeAbout: ['Stepladders']
            }} />
            <AdvisorCard user={{
              profileImageId: 'v1645651807/amy-presentation.png',
              name: 'Miles Edgeworth',
              jobTitle: 'Prosecutor',
              organization: 'Old Bailey',
              location: 'London, UK',
              linkedinProfileSlug: '',
              twitterProfileSlug: '',
              askMeAbout: ['Cravats']
            }} />
          </div>
          
          
          <Button color="primary" variant="contained" className={classes.requestBtn} onClick={onRequest}>
            Request a chat
          </Button>
          <Typography variant="body2" className={classes.requestBtnCancelText}>
            You can cancel your request at any time.
          </Typography>
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
