import NoSSR from 'react-no-ssr';
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import classNames from 'classnames'
import React from 'react'
import { useSingle } from '../../lib/crud/withSingle'
import { forumTypeSetting } from '../../lib/instanceSettings'
import { useLocation, useServerRequestStatus } from '../../lib/routeUtil'
import { Components, registerComponent } from '../../lib/vulcan-lib'
import { useCurrentUser } from '../common/withUser'
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { requireCssVar } from '../../themes/cssVars';
import moment from 'moment'
import { canUserEditPostMetadata } from '../../lib/collections/posts/helpers'
import { usePostAnalytics } from '../hooks/usePostAnalytics';

const isEAForum = forumTypeSetting.get()

// lw-look-here
const missingClientRangeText = isEAForum ? "Jan 11th - Jun 14th of 2021" : "late 2020 - early 2021"
const missingClientLastDay = isEAForum ? "2021-06-14" : "2021-05-01"
const dataCollectionFirstDay = isEAForum ? "Feb 19th, 2020" : "around the start of 2020"

function caclulateBounceRate(totalViews?: number, viewsAfter10sec?: number) {
  if (!totalViews || viewsAfter10sec === undefined || viewsAfter10sec === null) return null
  return `${Math.round((1 - (viewsAfter10sec / totalViews)) * 100)} %`
}

function readableReadingTime (seconds?: number) {
  if (!seconds) return null
  const minutes = Math.floor(seconds / 60)
  const secondsRemainder = seconds % 60
  const secondsPart = `${secondsRemainder} s`
  if (minutes > 0) return `${minutes} m ${secondsRemainder ? secondsPart : ''}`
  return secondsPart
}

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
    marginTop: theme.spacing.unit * 2,
    marginLeft: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  graphContainer: {
    marginTop: 30,
  },
  notEnoughDataMessage: {
    color: theme.palette.grey[500],
  }
})

const lineStroke = requireCssVar("palette", "primary", "main");

function PostsAnalyticsGraphs (
  { classes, uniqueClientViewsSeries }: { classes: ClassesType, uniqueClientViewsSeries: { date: string, uniqueClientViews: number }[] | undefined }
) {
  const { Typography } = Components
  
  if (!uniqueClientViewsSeries?.length || uniqueClientViewsSeries.length === 1) {
    return (<Typography variant="body1" className={classes.notEnoughDataMessage}>
      <em>Not enough data for a graph, check back tomorrow.</em>
    </Typography>
    )
  }
  return <ResponsiveContainer width="100%" height={300} className={classes.graphContainer}>
  <LineChart data={uniqueClientViewsSeries} height={300} margin={{right: 30}}>
    <XAxis dataKey="date" interval={Math.floor(uniqueClientViewsSeries.length/5)} />
    <YAxis dataKey="uniqueClientViews" />
    <Tooltip />
    <Legend />
    <Line
      type="monotone"
      dataKey="uniqueClientViews"
      name="Views by unique devices"
      stroke={lineStroke}
      dot={false}
      activeDot={{ r: 8 }}
    />
  </LineChart>
</ResponsiveContainer>
}

const PostsAnalyticsInner = ({ classes, post }: { classes: ClassesType, post: PostsPage }) => {
  const { postAnalytics, loading, error } = usePostAnalytics(post._id)
  const { Loading, Typography, LWTooltip } = Components
  
  if (loading) {
    return <>
      <Typography variant="body1" className={classNames(classes.gutterBottom, classes.calculating)}>
        <em>Calculating metrics. This might be slow for popular posts - if you get an error, try refreshing the page!</em>
      </Typography>
      <Loading />
    </>
  }
  if (error) {
    throw error
  }
  
  const uniqueClientViewsSeries = postAnalytics?.uniqueClientViewsSeries.map(({ date, uniqueClientViews }) => ({
    date: moment(date).format('MMM-DD'),
    uniqueClientViews
  }))
  
  return <>
    <Typography variant="display2" className={classes.title}>Cumulative Data</Typography>
    <Table>
      <TableBody>
      <TableRow>
          <TableCell>All views</TableCell>
          <TableCell>{postAnalytics?.allViews}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Views by unique devices</TableCell>
          <TableCell>{postAnalytics?.uniqueClientViews}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell><LWTooltip title='Percent of (unique) views that left before 10 seconds'>
            Bounce Rate
          </LWTooltip></TableCell>
          <TableCell>
            {caclulateBounceRate(postAnalytics?.uniqueClientViews, postAnalytics?.uniqueClientViews10Sec)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{'Views by unique devices > 5 minutes'}</TableCell>
          <TableCell>{postAnalytics?.uniqueClientViews5Min}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell><LWTooltip title='Note: includes time spent reading and writing comments, does not include bounces'>
            Median reading time
          </LWTooltip></TableCell>
          <TableCell>{readableReadingTime(postAnalytics?.medianReadingTime)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <Typography variant="display2" className={classes.title}>Daily Data</Typography>
    <PostsAnalyticsGraphs classes={classes} uniqueClientViewsSeries={uniqueClientViewsSeries} />
  </>

}

const PostsAnalyticsPage = ({ classes }: {
  classes: ClassesType;
}) => {
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
    SingleColumnSection, WrappedLoginForm, HeadTags, Typography
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
    !canUserEditPostMetadata(currentUser, postReturn.document) &&
    !currentUser.groups?.includes('sunshineRegiment')
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
      {moment(post.postedAt) < moment(missingClientLastDay) && <Typography variant='body1' gutterBottom>
        <em>
          Note: For figures that rely on detecting unique clients, we were
          mistakenly not collecting that data from {missingClientRangeText}.
        </em>
      </Typography>}
      {moment(post.postedAt) < moment('2020-02-19') && <Typography variant='body1' gutterBottom>
        <em>
          Note 2: Data collection began on {dataCollectionFirstDay}.
        </em>
      </Typography>}
      <NoSSR>
        <PostsAnalyticsInner post={post} classes={classes} />
      </NoSSR>
      <Typography variant="body1" className={classes.viewingNotice} component='div'>
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
