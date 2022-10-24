import React, { useEffect, useState } from 'react';
import { Components, registerComponent, getFragment } from '../../../lib/vulcan-lib';
import { useCurrentUser } from '../../common/withUser';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { taglineSetting } from '../../common/HeadTags';
import { siteNameWithArticleSetting  } from '../../../lib/instanceSettings';
import AdvisorRequests from '../../../lib/collections/advisorRequests/collection';

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


// TODO: we decided not to implement this part for the beta test,
//       so either finish or delete this after the test
const AdvisorsRequestPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  // const { query } = useLocation()
  // const [showPostSettings, setShowPostSetttings] = useState(false)

  const { SingleColumnSection, HeadTags, ContentStyles, AdvisorCard, WrappedSmartForm } = Components

  // const metaDescription = `${username}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`

  return <div>
    {/* <HeadTags
      description={metaDescription}
    /> */}
    <AnalyticsContext pageContext="advisorPage">
      <SingleColumnSection>
        <div className={classes.root}>
          <h1 className={classes.headline}>Chat with a Biosecurity Professional</h1>
          <WrappedSmartForm
            documentId={"PK9TvjiAzRuj45toq"}
            collection={AdvisorRequests}
            successCallback={async () => {
              // console.log("SUCCESS");
            }}
            queryFragment={getFragment('AdvisorRequestsMinimumInfo')}
            mutationFragment={getFragment('AdvisorRequestsMinimumInfo')}
            showRemove={false}
          />
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
