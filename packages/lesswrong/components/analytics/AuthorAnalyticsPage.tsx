import React, { useEffect, useState } from "react";
import { useCurrentUser } from "../common/withUser";
import { userIsAdminOrMod } from "../../lib/vulcan-users/permissions";
import { useMulti } from "../../lib/crud/withMulti";
import { getUserFromResults } from "../users/UsersProfile";
import { useMultiPostAnalytics } from "../hooks/useAnalytics";
import classNames from "classnames";
import qs from "qs";
import isEmpty from "lodash/isEmpty";
import range from "lodash/range";
import { GRAPH_LEFT_MARGIN } from "./AnalyticsGraph";
import { slugify } from "@/lib/utils/slugify";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { capitalize } from "../../lib/vulcan-lib/utils";
import { useLocation, useNavigate } from "../../lib/routeUtil";

export const mdTitleWidth = 60;
export const smTitleWidth = 50;
export const xsTitleWidth = 45;
const valueWidth = (titleWidth: number) => (100 - titleWidth) / 4;
export const gridColumns = (titleWidth: number) =>
  `${titleWidth}% ${valueWidth(titleWidth)}% ${valueWidth(titleWidth)}% ${valueWidth(titleWidth)}% ${valueWidth(
    titleWidth
  )}%`;

const styles = (theme: ThemeType) => ({
  root: {
    width: 800,
    maxWidth: "100%",
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down("sm")]: {
      // Add the top padding back in for mobile
      paddingTop: theme.spacing.mainLayoutPaddingTop,
    }
  },
  section: {
    background: theme.palette.grey[0],
    padding: 24,
    marginBottom: 24,
    borderRadius: theme.borderRadius.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down("xs")]: {
      padding: "16px 8px",
    },
  },
  postsSection: {
    [theme.breakpoints.down("xs")]: {
      marginRight: GRAPH_LEFT_MARGIN,
    },
  },
  pageHeader: {
    margin: "24px 36px",
    [theme.breakpoints.down("xs")]: {
      marginLeft: GRAPH_LEFT_MARGIN,
    },
  },
  pageHeaderText: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
  },
  postsListHeader: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  fetchingLatest: {
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 500,
    // stick to bottom
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  allYourPosts: {
    fontSize: 18,
    fontWeight: 600,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    marginLeft: GRAPH_LEFT_MARGIN,
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
    marginLeft: GRAPH_LEFT_MARGIN,
    [theme.breakpoints.down("xs")]: {
      fontSize: 11,
    },
  },
  postItem: {
    marginLeft: GRAPH_LEFT_MARGIN,
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
    marginLeft: GRAPH_LEFT_MARGIN,
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down("xs")]: {
      marginLeft: 0,
    },
  },
  loadMore: {
    marginTop: 10,
    marginLeft: 28,
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

const AuthorAnalyticsPage = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const { params, query, location } = useLocation();
  const navigate = useNavigate();
  const slug = slugify(params.slug);
  const currentUser = useCurrentUser();

  const {results} = useMulti({
    terms: { view: "usersProfile", slug },
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    enableTotal: false,
    fetchPolicy: "cache-and-network",
  });
  const user = getUserFromResults(results);

  const { sortBy, sortDesc: sortDescRaw } = query;
  const sortDesc = sortDescRaw === "true" ? true : sortDescRaw === "false" ? false : undefined;

  const [restoreScrollPos, setRestoreScrollPos] = useState(-1);

  useEffect(() => {
    if (restoreScrollPos === -1) return;

    window.scrollTo({top: restoreScrollPos})
    setRestoreScrollPos(-1);
  }, [restoreScrollPos])

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
    navigate({ ...location, search: `?${qs.stringify(newQuery)}` });
    setRestoreScrollPos(window.scrollY)
  };

  const initialLimit = 10;
  const itemsPerPage = 20;

  const {
    data,
    loading: analyticsLoading,
    loadMoreProps,
  } = useMultiPostAnalytics({
    userId: user?._id,
    sortBy,
    desc: sortDesc,
    initialLimit,
    itemsPerPage,
  });

  // Give the posts their own state so the list doesn't disappear when
  // clicking "load more" or updating other data
  const [posts, setPosts] = useState(data?.posts ?? []);
  const [totalCount, setTotalCount] = useState(loadMoreProps.totalCount);

  useEffect(() => {
    if (data?.posts) {
      setPosts(data.posts);
    }
  }, [data, posts, loadMoreProps]);

  useEffect(() => {
    setTotalCount((current) => Math.max(current, loadMoreProps.totalCount));
  }, [loadMoreProps.totalCount]);

  // Manually reset the post list if we navigate to a different user's stats
  useEffect(() => {
    setPosts([]);
    setTotalCount(0);
  }, [slug]);

  const {
    SingleColumnSection, HeadTags, Typography, LoadMore, ForumIcon, LWTooltip,
    AnalyticsGraph, AnalyticsPostItem, AnalyticsPostItemSkeleton,
  } = Components;

  const isCurrentUser = currentUser?.slug === slug
  if (!currentUser || (!isCurrentUser && !userIsAdminOrMod(currentUser))) {
    return (
      <SingleColumnSection className={classes.root}>
        You don't have permission to view this page.
      </SingleColumnSection>
    );
  }

  const title = `Stats for ${user?.displayName ?? slug}`;

  const getUserHeading = (uppercase: boolean) => {
    const format = uppercase ? capitalize : (s: string) => s;
    if (isCurrentUser) {
      return format("your");
    }
    return user ? `${user.displayName}'s` : format("user");
  }

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

  const placeholderCount = posts.length
    ? Math.min(itemsPerPage, totalCount - posts.length)
    : initialLimit;

  return (
    <>
      <HeadTags title={title} />
      <SingleColumnSection className={classes.root}>
        <div className={classes.pageHeader}>
          <Typography variant="headline" className={classes.pageHeaderText}>
            {getUserHeading(true)} post stats
          </Typography>
        </div>
        <div className={classes.section}>
          <AnalyticsGraph userId={user?._id} />
        </div>
        <div className={classNames(classes.section, classes.postsSection)}>
          <div className={classes.allYourPosts}>All {getUserHeading(false)} posts</div>
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
            <LWTooltip title="Unique views 30s or longer" placement="top">{renderHeaderCell("reads", "Reads")}</LWTooltip>
            {renderHeaderCell("baseScore", "Karma")}
            {renderHeaderCell("commentCount", "Comments")}
          </div>
          {posts.map((post) => (
            <AnalyticsPostItem
              key={post._id}
              post={post}
              className={classes.postItem}
            />
          ))}
          {analyticsLoading &&
            range(0, placeholderCount).map((i) => (
              <AnalyticsPostItemSkeleton key={i} className={classes.postItem} />
            ))
          }
          <LoadMore className={classes.loadMore} {...loadMoreProps} hideLoading />
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
