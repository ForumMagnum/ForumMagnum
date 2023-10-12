import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import {useLocation} from "../../lib/routeUtil";

const styles = (theme: ThemeType): JssStyles => ({
  checkbox: {
    padding: "1px 12px 0 0"
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing.unit*2,
      flex: `1 0 100%`,
      order: 0
    }
  },
})

const DraftsPage = ({classes}: {
  classes: ClassesType;
}) => {
  const {SingleColumnSection, DraftsList } = Components
  
  const currentUser = useCurrentUser()
  const { query } = useLocation();
  
  if (!currentUser) return <Components.Error404 />
  
  return <SingleColumnSection>
    <AnalyticsContext listContext={"draftsPage"}>
      <DraftsList limit={50} title={"Drafts & Unpublished Posts"} showAllDraftsLink={false}/>
    </AnalyticsContext>
  </SingleColumnSection>
}


const DraftsPageComponent = registerComponent('DraftsPage', DraftsPage, {
  hocs: [withErrorBoundary], styles
});

declare global {
  interface ComponentTypes {
    DraftsPage: typeof DraftsPageComponent
  }
}
