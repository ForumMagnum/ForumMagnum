import { registerComponent, Components } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import { useContinueReading } from '../recommendations/withContinueReading';
import Tooltip from "@material-ui/core/Tooltip";
import {QueryLink} from "../../lib/reactRouterWrapper";
import {DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD} from "../../lib/collections/posts/views";
import Checkbox from "@material-ui/core/Checkbox";

const styles = (theme: ThemeType): JssStyles => ({
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
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

const DraftsPage = ({classes}) => {
  const {SingleColumnSection, SectionTitle, DraftsList, MetaInfo, LWTooltip} = Components
  
  const currentUser = useCurrentUser()
  const {continueReading} = useContinueReading();
  const [showArchived, setShowArchived] = useState(false)
  
  if (!currentUser) return <span>You must sign in to view bookmarked posts.</span>
  
  
  return <SingleColumnSection>
    <AnalyticsContext listContext={"draftsPage"}>
      <div className={classes.titleRow}>
        <SectionTitle title="Drafts & Unpublished Posts"/>
        <LWTooltip title={<div><div>By default, posts below -10 karma are hidden.</div><div>Toggle to show them.</div></div>} placement="left-start">
            <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={showArchived} onClick={()=>{setShowArchived(!showArchived)}}/>
            <MetaInfo className={classes.checkboxLabel}>
              Show Archived Posts
            </MetaInfo>
        </LWTooltip>
      </div>
      <DraftsList showArchived={showArchived}/>
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
