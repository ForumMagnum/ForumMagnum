import React from "react"
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useForumWrappedV2 } from "./hooks";
import { userIsAdminOrMod } from "../../../lib/vulcan-users";


const styles = (theme: ThemeType) => ({
  root: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: 30
    }
  },
})

const EAForumWrapped2023Page = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()

  const { data, loading } = useForumWrappedV2({
    userId: currentUser?._id,
    year: 2023
  })

  const { SingleColumnSection } = Components

  if (!data) return null;

  // TODO un-admin gate
  if (!userIsAdminOrMod(currentUser)) {
    return <div className={classes.root}>
      You do not have permission to view this page.
    </div>
  }

  return (
    <AnalyticsContext pageContext="eaYearWrapped">
      <SingleColumnSection>
        <pre>Engagement Percentile: {data.engagementPercentile}</pre>
        <pre>Posts Read Count: {data.postsReadCount}</pre>
        <pre>Total Hours: {(data.totalSeconds / 3600).toFixed(1)}</pre>
        <pre>Days Visited: {JSON.stringify(data.daysVisited, null, 2)}</pre>
        <pre>Most Read Topics: {JSON.stringify(data.mostReadTopics, null, 2)}</pre>
        <pre>Relative Most Read Core Topics: {JSON.stringify(data.relativeMostReadCoreTopics, null, 2)}</pre>
        <pre>Most Read Authors: {JSON.stringify(data.mostReadAuthors, null, 2)}</pre>
        <pre>Top Post: {JSON.stringify(data.topPost, null, 2)}</pre>
        <pre>Post Count: {data.postCount}</pre>
        <pre>Author Percentile: {data.authorPercentile}</pre>
        <pre>Top Comment: {JSON.stringify(data.topComment, null, 2)}</pre>
        <pre>Comment Count: {data.commentCount}</pre>
        <pre>Commenter Percentile: {data.commenterPercentile}</pre>
        <pre>Top Shortform: {JSON.stringify(data.topShortform, null, 2)}</pre>
        <pre>Shortform Count: {data.shortformCount}</pre>
        <pre>Shortform Percentile: {data.shortformPercentile}</pre>
        <pre>Karma Change: {data.karmaChange}</pre>
        <pre>Post Karma Changes: {JSON.stringify(data.postKarmaChanges, null, 2)}</pre>
        <pre>Comment Karma Changes: {JSON.stringify(data.commentKarmaChanges, null, 2)}</pre>
        <pre>Most Received Reacts: {JSON.stringify(data.mostReceivedReacts, null, 2)}</pre>
        <pre>Alignment: {data.alignment}</pre>
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

const EAForumWrapped2023PageComponent = registerComponent('EAForumWrapped2023Page', EAForumWrapped2023Page, {styles})

declare global {
  interface ComponentTypes {
    EAForumWrapped2023Page: typeof EAForumWrapped2023PageComponent
  }
}
