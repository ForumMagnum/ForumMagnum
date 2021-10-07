import NoSsr from '@material-ui/core/NoSsr'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import classNames from 'classnames'
import React from 'react'
import { useSingle } from '../../lib/crud/withSingle'
import { forumTypeSetting } from '../../lib/instanceSettings'
import { Link } from '../../lib/reactRouterWrapper'
import { useLocation, useServerRequestStatus } from '../../lib/routeUtil'
import { Components, registerComponent } from '../../lib/vulcan-lib'
import { userOwns } from '../../lib/vulcan-users'
import { useCurrentUser } from '../common/withUser'
import { usePostAnalytics } from './usePostAnalytics'
import { Label, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import  theme  from '../../themes/forumTheme'
import moment from 'moment'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: theme.spacing.unit * 2,
    },
  },
  title: {
    marginBottom: theme.spacing.unit * 3,
  },
  viewingNotice: {
    marginTop: theme.spacing.unit * 4,
    '& a': {
      color: theme.palette.primary.main,
    },
  },
  // TODO: right now on lw-master, gutterBottom exists on the Typography class,
  // but we don't yet have that code
  gutterBottom: {
    marginBottom: '0.35em',
  },
  calculating: {
    marginLeft: theme.spacing.unit * 2,
  },
  graphContainer: {
    marginTop: 50,
    '& .xAxis': {
      marginTop: 100
    }
  }
})

const PostsAnalyticsInner = ({ classes, post }) => {
  const { postAnalytics, loading, error } = usePostAnalytics(post._id)
  const { Loading, Typography } = Components
  if (loading) {
    return <>
      <Typography variant="body1" className={classNames(classes.gutterBottom, classes.calculating)}>
        <em>Calculating metrics. (This can take some time for popular posts.)</em>
      </Typography>
      <Loading />
    </>
  }
  if (error) {
    throw error
  }
  
  const uniqueClientViewsSeries = postAnalytics?.uniqueClientViewsSeries.map(({ date, uniqueClientViews }) => ({
    // Can we terribly hack this?
    date: moment(date).format('MMM-DD'),
    uniqueClientViews
  }))
  
  return <>
    <Typography variant="display2" className={classes.title}>Cumulative Data</Typography>
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>Views by unique devices</TableCell>
          <TableCell>{postAnalytics?.uniqueClientViews}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{'Views by unique devices, on page for > 10 sec'}</TableCell>
          <TableCell>{postAnalytics?.uniqueClientViews10Sec}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <Typography variant="display2" className={classes.title}>Daily Data</Typography>
    <ResponsiveContainer width="100%" height={300} className={classes.graphContainer}>
      <LineChart data={uniqueClientViewsSeries} height={300} margin={{right: 30}}>
        <XAxis dataKey="date" angle={-30} offset={20}>
          <Label value="Date" offset={30}/>
        </XAxis>
        <YAxis dataKey="uniqueClientViews" />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="uniqueClientViews"
          stroke={theme.palette.primary.main}
          dot={false}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </>

}

const PostsAnalyticsInnerComponent = registerComponent('PostsAnalyticsInner', PostsAnalyticsInner, {styles})

declare global {
  interface ComponentTypes {
    PostsAnalyticsInner: typeof PostsAnalyticsInnerComponent
  }
}

const PostsAnalyticsPage = ({ classes }) => {
  const { query } = useLocation()
  // Cannot destructure and retain return type typing due to TS version
  const postReturn = useSingle({
    documentId: query.postId,
    collectionName: "Posts",
    fragmentName: 'PostsPage',
  })
  const currentUser = useCurrentUser()
  const serverRequestStatus = useServerRequestStatus()
  const {
    SingleColumnSection, WrappedLoginForm, PostsAnalyticsInner, HeadTags, Typography
  } = Components


  if (!query.postId) {
    if (serverRequestStatus) serverRequestStatus.status = 400
    return <SingleColumnSection>
      Bad URL: Must specify a post ID
    </SingleColumnSection>
  }

  if (postReturn.loading) {
    return null
  }

  if (postReturn.error) {
    throw postReturn.error;
  }

  if (!currentUser) {
    if (serverRequestStatus) serverRequestStatus.status = 401
    return <SingleColumnSection>
      <p>You don't have permission to view this page. Would you like to log in?</p>
      <WrappedLoginForm />
    </SingleColumnSection>
  }


  if (
    !userOwns(currentUser, postReturn.document) &&
    !currentUser?.isAdmin &&
    !currentUser?.groups?.includes('sunshineRegiment')
  ) {
    if (serverRequestStatus) serverRequestStatus.status = 403
    return <SingleColumnSection>
      You don't have permission to view this page.
    </SingleColumnSection>
  }

  const post = postReturn.document
  const isEAForum = forumTypeSetting.get() === 'EAForum'
  const title = `Analytics for "${post.title}"`

  // Analytics query can still be very expensive despire indexes, and we don't
  // want 30 seconds before TTFB
  return <>
    <HeadTags title={title} />
    <SingleColumnSection className={classes.root}>
      <Typography variant='display2' className={classes.title}>
        {title}
      </Typography>
      <NoSsr>
        <PostsAnalyticsInner post={post} />
      </NoSsr>
        <Typography variant="body1" className={classes.viewingNotice} component='div'>
        <p>This feature is new. <Link to='/contact'>Let us know what you think.</Link></p>
        <p><em>Post statistics are only viewable by {isEAForum && "authors and"} admins</em></p>
      </Typography>
    </SingleColumnSection>
  </>
}

const PostsAnalyticsPageComponent = registerComponent('PostsAnalyticsPage', PostsAnalyticsPage, { styles })

declare global {
  interface ComponentTypes {
    PostsAnalyticsPage: typeof PostsAnalyticsPageComponent
  }
}
