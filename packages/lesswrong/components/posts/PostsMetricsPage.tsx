import React from 'react'
import { Components, registerComponent } from '../../lib/vulcan-lib'
import { useLocation, useServerRequestStatus } from '../../lib/routeUtil'
import { useSingle } from '../../lib/crud/withSingle'
import { useCurrentUser } from '../common/withUser'
import { userOwns } from '../../lib/vulcan-users'
import { usePostMetrics } from './usePostMetrics'

const styles = (theme: ThemeType): JssStyles => ({
})

const PostsMetricsPage = ({ classes }) => {
  const { params } = useLocation()
  const { document: post } = useSingle({
    documentId: params._id,
    collectionName: "Posts",
    fragmentName: 'PostsPage',
  })
  const currentUser = useCurrentUser()
  const serverRequestStatus = useServerRequestStatus()
  const { postMetrics, loading, error } = usePostMetrics(params?._id)
  const { WrappedLoginForm, SingleColumnSection, HeadTags } = Components
  if (!currentUser) {
    if (serverRequestStatus) serverRequestStatus.status = 401
    return <SingleColumnSection>
      <p>You don't have permission to view this page. Would you like to log in?</p>
      <WrappedLoginForm />
    </SingleColumnSection>
  }
  // TODO; coauthors (maybe just asana task)
  if (
    !userOwns(currentUser, post) &&
    !currentUser?.isAdmin &&
    !currentUser?.groups.includes('sunshineRegiment')
  ) {
    if (serverRequestStatus) serverRequestStatus.status = 403
    return <SingleColumnSection>
      You don't have permission to view this page.
    </SingleColumnSection>
  }

  return (<>
    <HeadTags title={`Metrics for "${post.title}"`} />
    <SingleColumnSection>
      Unique client views: {postMetrics?.uniqueClientViews}
    </SingleColumnSection>
  </>)
}

const PostsMetricsPageComponent = registerComponent('PostsMetricsPage', PostsMetricsPage, {styles})

declare global {
  interface ComponentTypes {
    PostsMetricsPage: typeof PostsMetricsPageComponent
  }
}
