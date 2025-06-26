import React from "react";
import { useSingle } from "../../lib/crud/withSingle";
import { useLocation } from "../../lib/routeUtil";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { canUserEditPostMetadata, postGetPageUrl } from "../../lib/collections/posts/helpers";
import { userIsAdminOrMod } from "../../lib/vulcan-users/permissions";
import { Table } from "@/components/widgets/Table"
import { TableBody } from "@/components/widgets/TableBody"
import { TableRow } from "@/components/widgets/TableRow"
import { TableCell } from "@/components/widgets/TableCell"
import { useMultiPostAnalytics } from "../hooks/useAnalytics";
import { Link } from "../../lib/reactRouterWrapper";
import AnalyticsGraph, { GRAPH_LEFT_MARGIN } from "./AnalyticsGraph";
import classNames from "classnames";
import SingleColumnSection from "../common/SingleColumnSection";
import LoginForm from "../users/LoginForm";
import HeadTags from "../common/HeadTags";
import { Typography } from "../common/Typography";
import LWTooltip from "../common/LWTooltip";

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

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down("sm")]: {
      paddingTop: 24,
    },
    [theme.breakpoints.down("xs")]: {
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  title: {
    display: "flex",
    alignItems: "center",
    minHeight: 40,
    marginBottom: 24,
    marginLeft: GRAPH_LEFT_MARGIN,
    fontSize: 32,
    fontWeight: "700",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    [theme.breakpoints.down("sm")]: {
      marginTop: 8,
    },
  },
  subheading: {
    fontSize: 20,
    margin: '8px 0px',
    color: theme.palette.grey[1000],
    marginLeft: GRAPH_LEFT_MARGIN,
  },
  tableContainer: {
    overflow: "hidden",
    width: "100%",
    paddingRight: 36,
    [theme.breakpoints.down("xs")]: {
      paddingRight: 30,
    },
  },
  table: {
    marginBottom: 40,
    marginLeft: GRAPH_LEFT_MARGIN,
  },
  placeholder: {
    height: 10,
    background: theme.palette.panelBackground.placeholderGradient,
    backgroundSize: "300% 100%",
    animation: "profile-image-loader 1.8s infinite",
    borderRadius: 3,
    maxWidth: "100%",
  },
  titlePlaceholder: {
    display: "flex",
    alignItems: "center",
    width: 500,
  },
  statPlaceholder: {
    width: 60,
  },
});

const PostsAnalyticsPage = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { query } = useLocation();

  const {document: post, error} = useSingle({
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
  if (!query.postId) {
    return null;
  }

  if (error) {
    return (
      <SingleColumnSection className={classes.root}>
        {error.message}
      </SingleColumnSection>
    );
  }

  if (!currentUser) {
    return (
      <SingleColumnSection className={classes.root}>
        <p>You don't have permission to view this page. Would you like to log in?</p>
        <LoginForm />
      </SingleColumnSection>
    );
  }

  if (post && !canUserEditPostMetadata(currentUser, post) && !userIsAdminOrMod(currentUser)) {
    return (
      <SingleColumnSection className={classes.root}>
        You don't have permission to view this page.
      </SingleColumnSection>
    );
  }

  const statPlaceholder = (
    <div className={classNames(classes.statPlaceholder, classes.placeholder)} />
  );

  return (
    <>
      <HeadTags title={post?.title ?? "Post analytics"} />
      <SingleColumnSection className={classes.root}>
        <Typography variant="display2" className={classes.title}>
          {post
            ? <Link to={postGetPageUrl(post)}>{post.title}</Link>
            : <div className={classNames(classes.placeholder, classes.titlePlaceholder)} />
          }
        </Typography>
        <Typography variant="display2" className={classes.subheading}>
          Overall stats
        </Typography>
        <div className={classes.tableContainer}>
          <Table className={classes.table}>
            <TableBody>
              <TableRow>
                <TableCell>Views</TableCell>
                <TableCell>
                  {overallStats ? overallStats.views : statPlaceholder}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <LWTooltip title="Unique views 30s or longer">Reads</LWTooltip>
                </TableCell>
                <TableCell>
                  {overallStats ? overallStats.reads : statPlaceholder}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Karma</TableCell>
                <TableCell>
                  {overallStats ? overallStats.karma : statPlaceholder}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Comments</TableCell>
                <TableCell>
                  {overallStats ? overallStats.comments : statPlaceholder}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <LWTooltip title="Percentage of unique views less than 30s">
                    Bounce Rate
                  </LWTooltip>
                </TableCell>
                <TableCell>
                  {overallStats
                    ? formatBounceRate(overallStats.uniqueViews, overallStats.reads)
                    : statPlaceholder
                  }
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <LWTooltip title="Note: includes time spent reading and writing comments">
                    Mean reading time
                  </LWTooltip>
                </TableCell>
                <TableCell>
                  {overallStats
                    ? readableReadingTime(overallStats.meanReadingTime)
                    : statPlaceholder
                  }
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <AnalyticsGraph
          postIds={post ? [post._id] : []}
          disclaimerEarliestDate={post?.createdAt ?? new Date()}
        />
      </SingleColumnSection>
    </>
  );
};

export default registerComponent("PostsAnalyticsPage", PostsAnalyticsPage, { styles });


