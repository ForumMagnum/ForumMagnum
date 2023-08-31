import React from "react";
import { useSingle } from "../../lib/crud/withSingle";
import { useLocation } from "../../lib/routeUtil";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { canUserEditPostMetadata, postGetPageUrl } from "../../lib/collections/posts/helpers";
import { userIsAdminOrMod } from "../../lib/vulcan-users";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import { useMultiPostAnalytics } from "../hooks/useAnalytics";
import { Link } from "../../lib/reactRouterWrapper";

function formatBounceRate(denominator?: number, numerator?: number) {
  if (!denominator || numerator === undefined || numerator === null) return null
  return `${((1 - (numerator / denominator)) * 100).toFixed(1)}%`
}

function readableReadingTime (seconds?: number) {
  if (!seconds) return null
  const minutes = Math.floor(seconds / 60)
  const secondsRemainder = Math.round(seconds % 60)
  const secondsPart = `${secondsRemainder} s`
  if (minutes > 0) return `${minutes} m ${secondsRemainder ? secondsPart : ''}`
  return secondsPart
}

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    [theme.breakpoints.down("sm")]: {
      paddingTop: 16,
    },
  },
  title: {
    marginBottom: 24,
    [theme.breakpoints.down("sm")]: {
      marginTop: 8,
    },
  },
  subheading: {
    fontSize: 20,
    margin: '8px 0px'
  },
  table: {
    marginBottom: 24,
  },
});

const PostsAnalyticsPage = ({ classes }: { classes: ClassesType }) => {
  const { query } = useLocation();

  const {
    document: post,
    loading,
    error,
  } = useSingle({
    documentId: query.postId,
    collectionName: "Posts",
    fragmentName: "PostsPage",
    skip: !query.postId,
  });
  const currentUser = useCurrentUser();

  const { data: postAnalytics } = useMultiPostAnalytics({
    postIds: [query.postId],
  });
  const overallStats = postAnalytics?.posts?.[0];

  const {
    SingleColumnSection,
    WrappedLoginForm,
    HeadTags,
    Typography,
    AnalyticsGraph,
    AnalyticsDisclaimers,
    LWTooltip,
    Loading,
  } = Components;

  if (loading || error || !query.postId) {
    return null;
  }

  if (!currentUser) {
    return (
      <SingleColumnSection>
        <p>You don't have permission to view this page. Would you like to log in?</p>
        <WrappedLoginForm />
      </SingleColumnSection>
    );
  }

  if (!canUserEditPostMetadata(currentUser, post) && !userIsAdminOrMod(currentUser)) {
    return <SingleColumnSection>You don't have permission to view this page.</SingleColumnSection>;
  }

  const overallStatsTable = overallStats ? (
    <Table className={classes.table}>
      <TableBody>
        <TableRow>
          <TableCell>Views</TableCell>
          <TableCell>{overallStats.views}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <LWTooltip title="Unique views 30s or longer">Reads</LWTooltip>
          </TableCell>
          <TableCell>{overallStats.reads}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Karma</TableCell>
          <TableCell>{overallStats.karma}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Comments</TableCell>
          <TableCell>{overallStats.comments}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <LWTooltip title="Percentage of unique views less than 30s">Bounce Rate</LWTooltip>
          </TableCell>
          <TableCell>{formatBounceRate(overallStats.uniqueViews, overallStats.reads)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <LWTooltip title="Note: includes time spent reading and writing comments">Mean reading time</LWTooltip>
          </TableCell>
          <TableCell>{readableReadingTime(overallStats.meanReadingTime)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ) : (
    <Loading />
  );

  return (
    <>
      <HeadTags title={post.title} />
      <SingleColumnSection className={classes.root}>
        <Typography variant="display2" className={classes.title}>
          <Link to={postGetPageUrl(post)}>{post.title}</Link>
        </Typography>
        <Typography variant="display2" className={classes.subheading}>
          Overall stats
        </Typography>
        {overallStatsTable}
        <AnalyticsGraph postIds={[post._id]} title={"Daily stats"} smallerTitle />
        <AnalyticsDisclaimers earliestDate={post.createdAt} />
      </SingleColumnSection>
    </>
  );
};

const PostsAnalyticsPageComponent = registerComponent("PostsAnalyticsPage", PostsAnalyticsPage, { styles });

declare global {
  interface ComponentTypes {
    PostsAnalyticsPage: typeof PostsAnalyticsPageComponent;
  }
}
