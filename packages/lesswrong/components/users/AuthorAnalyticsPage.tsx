import React from "react";
import { isEAForum } from "../../lib/instanceSettings";
import { useLocation, useNavigation } from "../../lib/routeUtil";
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
import qs from "qs";
import isEmpty from "lodash/isEmpty";

const mdTitleWidth = 60;
const smTitleWidth = 50;
const xsTitleWidth = 40;
const valueWidth = (titleWidth: number) => (100 - titleWidth) / 4;
const gridColumns = (titleWidth: number) =>
  `${titleWidth}% ${valueWidth(titleWidth)}% ${valueWidth(titleWidth)}% ${valueWidth(titleWidth)}% ${valueWidth(
    titleWidth
  )}%`;

// lw-look-here
// TODO we need to handle these once the graph is added in?
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
    gridTemplateColumns: gridColumns(mdTitleWidth),
    alignItems: "center",
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: gridColumns(smTitleWidth),
    },
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: gridColumns(xsTitleWidth),
    },
  },
  gridHeader: {
    color: theme.palette.grey[600],
    fontSize: 13,
    padding: "12px 4px 12px 0",
    fontWeight: 500,
  },
  postsItem: {
    padding: "12px 4px 12px 12px",
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.borderRadius.default,
  },
  postTitleCell: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  dateHeader: {
    justifyContent: "flex-start",
    display: "flex",
    alignItems: "center",
    cursor: "pointer"
  },
  valueHeader: {
    justifyContent: "center",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    marginLeft: 14,
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
  loadMore: {
    marginTop: 10,
    marginLeft: 4,
  },
  sortArrow: {
    color: theme.palette.grey[600],
    fontSize: 14,
    marginLeft: 2,
    // flip vertically
    transform: "scaleY(-1)",
  },
  desc: {
    transform: "scaleY(1)",
  },
  hide: {
    // Set opacity: 0 rather than display: none to avoid layout shift
    opacity: 0,
  }
});

const AnalyticsPostItem = ({ post, classes }: { post: PostAnalytics2Result; classes: ClassesType }) => {
  const timeFromNow = moment(new Date(post.postedAt)).fromNow();
  const ago = timeFromNow !== "now" ? <span className={classes.xsHide}>&nbsp;ago</span> : null;

  const postAnalyticsLink = `/postAnalytics?postId=${post._id}`;

  return (
    <div className={classNames(classes.grid, classes.postsItem)}>
      <div className={classes.postTitleCell}>
        <div className={classes.postTitle}>
          <Link to={postGetPageUrl(post)}>{post.title}</Link>
        </div>
        <div className={classes.postSubtitle}>
          {timeFromNow}
          {ago}
          <Link to={postAnalyticsLink}> · view post stats</Link>
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
  const { params, query, location } = useLocation();
  const { history } = useNavigation();
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

  const { sortBy, sortDesc: sortDescRaw } = query;
  const sortDesc = sortDescRaw === "true" ? true : sortDescRaw === "false" ? false : undefined;

  const onClickHeader = (headerField: string) => {
    let newSortBy: string | undefined = sortBy;
    let newSortDesc: boolean | undefined = sortDesc;

    if (headerField === sortBy) {
      if (sortDesc === true) {
        newSortDesc = false;
      } else if (sortDesc === false) {
        newSortBy = undefined;
        newSortDesc = undefined;
      }
    } else {
      newSortBy = headerField;
      newSortDesc = true;
    }

    const currentQuery = isEmpty(query)
      ? {}
      : Object.keys(query)
          .filter((key) => key !== "sortBy" && key !== "sortDesc")
          .reduce((obj, key) => {
            obj[key] = query[key];
            return obj;
          }, {} as Record<string, string>);
    const newQuery = {
      ...currentQuery,
      ...(newSortBy !== undefined && { sortBy: newSortBy }),
      ...(newSortDesc !== undefined && { sortDesc: newSortDesc }),
    };
    history.push({ ...location.location, search: `?${qs.stringify(newQuery)}` });
  };

  const {
    authorAnalytics,
    loading: analyticsLoading,
    loadMoreProps,
  } = useAuthorAnalytics({
    userId: user?._id,
    sortBy,
    desc: sortDesc,
  });

  const { SingleColumnSection, HeadTags, Typography, Loading, LoadMore, ForumIcon } = Components;

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
            <div onClick={() => onClickHeader("postedAt")} className={classes.dateHeader}>
              Date
              <ForumIcon className={classNames(classes.sortArrow, {[classes.desc]: sortDesc, [classes.hide]: sortBy !== "postedAt"})} icon="NarrowArrowDown" />
            </div>
            <div onClick={() => onClickHeader("views")} className={classes.valueHeader}>
              Views
              <ForumIcon className={classNames(classes.sortArrow, {[classes.desc]: sortDesc, [classes.hide]: sortBy !== "views"})} icon="NarrowArrowDown" />
            </div>
            <div onClick={() => onClickHeader("reads")} className={classes.valueHeader}>
              Reads
              <ForumIcon className={classNames(classes.sortArrow, {[classes.desc]: sortDesc, [classes.hide]: sortBy !== "reads"})} icon="NarrowArrowDown" />
            </div>
            <div onClick={() => onClickHeader("baseScore")} className={classes.valueHeader}>
              Karma
              <ForumIcon className={classNames(classes.sortArrow, {[classes.desc]: sortDesc, [classes.hide]: sortBy !== "baseScore"})} icon="NarrowArrowDown" />
            </div>
            <div onClick={() => onClickHeader("commentCount")} className={classes.valueHeader}>
              Comments
              <ForumIcon className={classNames(classes.sortArrow, {[classes.desc]: sortDesc, [classes.hide]: sortBy !== "commentCount"})} icon="NarrowArrowDown" />
            </div>
          </div>
          {posts.map((post) => (
            <AnalyticsPostItem key={post._id} post={post} classes={classes} />
          ))}
          {analyticsLoading && <Loading />}
          <LoadMore className={classes.loadMore} {...loadMoreProps} />
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
