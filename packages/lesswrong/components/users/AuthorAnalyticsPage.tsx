import React from "react";
import { isEAForum } from "../../lib/instanceSettings";
import { useLocation } from "../../lib/routeUtil";
import { Components, registerComponent, slugify } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { userIsAdminOrMod } from "../../lib/vulcan-users";
import { useMulti } from "../../lib/crud/withMulti";
import { getUserFromResults } from "./UsersProfile";
import { PostAnalytics2Result, useAuthorAnalytics } from "./useAuthorAnalytics";
import classNames from "classnames";
import moment from "moment";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";

// lw-look-here
// TODO do we still need to handle these?
const missingClientRangeText = isEAForum ? "Jan 11th - Jun 14th of 2021" : "late 2020 - early 2021";
const missingClientLastDay = isEAForum ? "2021-06-14" : "2021-05-01";
const dataCollectionFirstDay = isEAForum ? "Feb 19th, 2020" : "around the start of 2020";

const styles = (theme: ThemeType): JssStyles => ({
  root: {},
  postsListSection: {
    background: theme.palette.grey[0],
    padding: "24px 24px",
    marginBottom: 24,
    borderRadius: theme.borderRadius.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down("xs")]: {
      padding: 16,
    },
  },
  subheading: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "65% 1fr 1fr 1fr 1fr",
    alignItems: "center",
  },
  gridHeader: {
    color: theme.palette.grey[600],
    fontSize: 13,
    padding: '12px 4px 12px 0',
    fontWeight: 500,
  },
  postsItem: {
    padding: '12px 4px 12px 12px',
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.borderRadius.default,
  },
  postTitleCell: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  valueHeader: {
    textAlign: "center",
  },
  valueCell: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  postTitle: {
    fontSize: 14,
    lineHeight: "22px",
    fontWeight: "600",
    paddingRight: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: 'fit-content'
  },
  postSubtitle: {
    fontSize: 13,
    color: theme.palette.grey[700],
    fontWeight: 500,
  },
  xsHide: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
});

const AnalyticsPostItem = ({ post, classes }: { post: PostAnalytics2Result; classes: ClassesType }) => {
  const timeFromNow = moment(new Date(post.postedAt)).fromNow();
  const ago = timeFromNow !== "now" ? <span className={classes.xsHide}>&nbsp;ago</span> : null;

  const postAnalyticsLink = `/postAnalytics?postId=${post._id}`

  return (
    <div className={classNames(classes.grid, classes.postsItem)}>
      <div className={classes.postTitleCell}>
        <Link to={postGetPageUrl(post)} className={classes.postTitle}>{post.title}</Link>
        <div className={classes.postSubtitle}>
          {timeFromNow}
          {ago}<Link to={postAnalyticsLink}> · view post stats</Link>
        </div>
      </div>
      <div className={classes.valueCell}>{post.views}</div>
      <div className={classes.valueCell}>{post.reads}</div>
      <div className={classes.valueCell}>{post.karma}</div>
      <div className={classes.valueCell}>{post.comments}</div>
    </div>
  );
};

const AuthorAnalyticsPage = ({ classes }: { classes: ClassesType }) => {
  const { params } = useLocation();
  const slug = slugify(params.slug);
  const currentUser = useCurrentUser();

  const { loading: userLoading, results } = useMulti({
    terms: { view: "usersProfile", slug },
    collectionName: "Users",
    fragmentName: "UsersProfile",
    enableTotal: false,
    fetchPolicy: "cache-and-network",
  });
  const user = getUserFromResults(results);

  const { authorAnalytics, loading: analyticsLoading } = useAuthorAnalytics(user?._id);

  const { SingleColumnSection, HeadTags, Typography, Loading } = Components;

  if (!currentUser || (currentUser.slug !== slug && !userIsAdminOrMod(currentUser))) {
    return <SingleColumnSection>You don't have permission to view this page.</SingleColumnSection>;
  }

  if (userLoading || !user) return null;

  const title = `Stats for ${user.displayName}`;

  const posts = authorAnalytics?.posts || [];

  return (
    <>
      <HeadTags title={title} />
      <SingleColumnSection className={classes.root}>
        {/* TODO graph and page title */}
        <div className={classes.postsListSection}>
          <Typography variant="headline" className={classes.subheading}>
            Posts
          </Typography>
          <div className={classNames(classes.grid, classes.gridHeader)}>
            <div>Date</div>
            <div className={classes.valueHeader}>Views</div>
            <div className={classes.valueHeader}>Reads</div>
            <div className={classes.valueHeader}>Karma</div>
            <div className={classes.valueHeader}>Comments</div>
          </div>
          {analyticsLoading ? <Loading /> : posts.map((post) => (
            <AnalyticsPostItem key={post._id} post={post} classes={classes} />
          ))}
        </div>
      </SingleColumnSection>
    </>
  );
};

const AuthorAnalyticsPageComponent = registerComponent("AuthorAnalyticsPage", AuthorAnalyticsPage, { styles });

declare global {
  interface ComponentTypes {
    AuthorAnalyticsPage: typeof AuthorAnalyticsPageComponent;
  }
}
