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


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.grey[0],
    padding: '24px 32px',
  },
  headline: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 38,
    fontWeight: 700
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
    marginTop: 30
  }
})

const AdvisorsRequestPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  // const { query } = useLocation()
  // const [showPostSettings, setShowPostSetttings] = useState(false)

  const { SingleColumnSection, HeadTags, ContentStyles, Typography, AdvisorCard } = Components

  // const metaDescription = `${username}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`


  return <div>
    {/* <HeadTags
      description={metaDescription}
      image={user.profileImageId && `https://res.cloudinary.com/cea/image/upload/c_crop,g_custom,q_auto,f_auto/${user.profileImageId}.jpg`}
    /> */}
    <AnalyticsContext pageContext="advisorPage">
      <SingleColumnSection>
        <div className={classes.root}>
          <h1 className={classes.headline}>Chat with a Biosecurity Professional</h1>
          <Typography variant="body1" className={classes.descriptionRow}>
            HELLO WORLD
          </Typography>
          <Typography variant="body1" className={classes.descriptionRow}>
            Request a one-on-one 30 minute chat with a GCBR advisor.
          </Typography>
          <Typography variant="body1" className={classes.descriptionRow}>
            You'll be matched with an advisor based on relevance and availability.
            They are in a variety of career stages, so if you're just getting started
            we can match you with someone more junior.
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
          
          <Button color="primary" variant="contained" href={'/'} className={classes.requestBtn}>
            Request a chat
          </Button>
          <Typography variant="body2" className={classes.requestBtnCancelText}>
            You can cancel your request at any time.
          </Typography>
          
          <Typography variant="headline" className={classes.advisorsHeadline}>Meet the advisors</Typography>
          <AdvisorCard user={{
            profileImageId: 'v1645651807/amy-presentation.png',
            name: 'Simon Grimm',
            jobTitle: 'Researcher',
            organization: 'Sculpting Evolution'
          }} />
          
          
          <Button color="primary" variant="contained" href={'/'} className={classes.requestBtn}>
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

const AdvisorsRequestPageComponent = registerComponent(
  'AdvisorsRequestPage', AdvisorsRequestPage, {styles}
);

declare global {
  interface ComponentTypes {
    AdvisorsRequestPage: typeof AdvisorsRequestPageComponent
  }
}
