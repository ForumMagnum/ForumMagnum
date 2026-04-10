"use client";

import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import SingleColumnSection from "../common/SingleColumnSection";
import DraftsList from "./DraftsList";
import CommentsDraftList from "../comments/CommentsDraftList";

const DraftsPage = () => {
  const currentUser = useCurrentUser()
  
  if (!currentUser) {
    return <ErrorAccessDenied />
  }
  
  return <SingleColumnSection>
    <AnalyticsContext listContext={"draftsPage"}>
      <DraftsList limit={50} title={"Drafts & Unpublished Posts"} showAllDraftsLink={false}/>
      <CommentsDraftList
        userId={currentUser._id}
        initialLimit={50}
        silentIfEmpty
        sectionTitleStyle
        quickTakesOnly
      />
    </AnalyticsContext>
  </SingleColumnSection>
}


export default registerComponent('DraftsPage', DraftsPage, {
  hocs: [withErrorBoundary]
});


