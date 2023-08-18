import React from "react";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import { Components, registerComponent, slugify } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { userIsAdminOrMod } from "../../lib/vulcan-users";
import { useMulti } from "../../lib/crud/withMulti";
import { getUserFromResults } from "../users/UsersProfile";
import { PostAnalytics2Result, useAuthorAnalytics } from "../hooks/useAnalytics";
import classNames from "classnames";
import moment from "moment";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import qs from "qs";
import isEmpty from "lodash/isEmpty";
import { isEAForum } from "../../lib/instanceSettings";

const mdTitleWidth = 60;
const smTitleWidth = 50;
const xsTitleWidth = 40;
const valueWidth = (titleWidth: number) => (100 - titleWidth) / 4;
const gridColumns = (titleWidth: number) =>
  `${titleWidth}% ${valueWidth(titleWidth)}% ${valueWidth(titleWidth)}% ${valueWidth(titleWidth)}% ${valueWidth(
    titleWidth
  )}%`;

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    [theme.breakpoints.down("sm")]: {
      // Add the top padding back in for mobile
      paddingTop: theme.spacing.mainLayoutPaddingTop,
    }
  },
  section: {
    background: theme.palette.grey[0],
    padding: "24px 24px",
    marginBottom: 24,
    borderRadius: theme.borderRadius.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down("xs")]: {
      padding: 16,
    },
  },
  postsListHeader: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  postsListHeaderText: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
  },
  fetchingLatest: {
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 500,
    // stick to bottom
    alignSelf: "flex-end",
    marginBottom: 4,
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
    [theme.breakpoints.down("xs")]: {
      fontSize: 11,
    },
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
  },
  dateHeaderLabel: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  valueHeader: {
    justifyContent: "center",
    display: "flex",
  },
  valueHeaderLabel: {
    cursor: "pointer",
    marginLeft: 14,
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down("xs")]: {
      marginLeft: 0,
    },
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
    [theme.breakpoints.down("xs")]: {
      marginLeft: 0,
    },
  },
  desc: {
    transform: "scaleY(1)",
  },
  hide: {
    // Set opacity: 0 rather than display: none to avoid layout shift
    opacity: 0,
    [theme.breakpoints.down("xs")]: {
      // On mobile: accept some layout shift in return for having more space
      display: "none",
    },
  },
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
          {" · "}
          <Link to={postAnalyticsLink}>View post stats</Link>
        </div>
      </div>
      <div className={classes.valueCell}>{post.views.toLocaleString()}</div>
      <div className={classes.valueCell}>{post.reads.toLocaleString()}</div>
      <div className={classes.valueCell}>{post.karma.toLocaleString()}</div>
      <div className={classes.valueCell}>{post.comments.toLocaleString()}</div>
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
    fragmentName: "UsersMinimumInfo",
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
    maybeStale,
    loadMoreProps,
  } = useAuthorAnalytics({
    userId: user?._id,
    sortBy,
    desc: sortDesc,
  });

  const { SingleColumnSection, HeadTags, Typography, Loading, LoadMore, ForumIcon, AnalyticsGraph } = Components;

  // TODO: This is admin/mod gated while in development. Uncomment below when it is ready for public use.
  // if (!currentUser || (currentUser.slug !== slug && !userIsAdminOrMod(currentUser))) {
  //   return <SingleColumnSection>You don't have permission to view this page.</SingleColumnSection>;
  // }
  if (!userIsAdminOrMod(currentUser) || !isEAForum) {
    return <SingleColumnSection>You don't have permission to view this page.</SingleColumnSection>;
  }

  if (userLoading || !user) return null;

  const title = `Stats for ${user.displayName}`;

  const posts = authorAnalytics?.posts || [];

  const renderHeaderCell = (headerField: string, label: string) => (
    <div onClick={() => onClickHeader(headerField)} className={classes.valueHeader}>
      <div className={classes.valueHeaderLabel}>
        {label}
        <ForumIcon
          className={classNames(classes.sortArrow, {
            [classes.desc]: sortDesc,
            [classes.hide]: sortBy !== headerField,
          })}
          icon="NarrowArrowDown"
        />
      </div>
    </div>
  );

  return (
    <>
      <HeadTags title={title} />
      <SingleColumnSection className={classes.root}>
        <div className={classes.section}>
          <AnalyticsGraph userId={user._id} title="Stats on all posts" />
        </div>
        <div className={classes.section}>
          <div className={classes.postsListHeader}>
            <Typography variant="headline" className={classes.postsListHeaderText}>
              Posts
            </Typography>
            {maybeStale && <span className={classes.fetchingLatest}>
              checking latest data...
            </span>}
          </div>
          <div className={classNames(classes.grid, classes.gridHeader)}>
            <div onClick={() => onClickHeader("postedAt")} className={classes.dateHeader}>
              <div className={classes.dateHeaderLabel}>
                Date
                <ForumIcon
                  className={classNames(classes.sortArrow, {
                    [classes.desc]: sortDesc,
                    [classes.hide]: sortBy !== "postedAt",
                  })}
                  icon="NarrowArrowDown"
                />
              </div>
            </div>
            {renderHeaderCell("views", "Views")}
            {renderHeaderCell("reads", "Reads")}
            {renderHeaderCell("baseScore", "Karma")}
            {renderHeaderCell("commentCount", "Comments")}
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
