import React from "react";
import { isEAForum } from "../../lib/instanceSettings";
import { useLocation } from "../../lib/routeUtil";
import { Components, registerComponent, slugify } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { userIsAdminOrMod } from "../../lib/vulcan-users";
import { useMulti } from "../../lib/crud/withMulti";
import { getUserFromResults } from "./UsersProfile";
import { useAuthorAnalytics } from "./useAuthorAnalytics";

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
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', // 3fr for "Date", 1fr for others
    alignItems: 'center',
    marginBottom: 8,
  },
  cell: {
    padding: 8,
  }
});

const AnalyticsPostItem = ({ post, classes }: { post: any; classes: ClassesType }) => {
  return <div className={classes.grid}>
    <div className={classes.cell}>{post._id /* TODO replace with the title etc when available */}</div>
    <div className={classes.cell}>{post.views}</div>
    <div className={classes.cell}>{post.reads}</div>
    <div className={classes.cell}>{post.karma}</div>
    <div className={classes.cell}>{post.comments}</div>
  </div>
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

  const { authorAnalytics, loading: analyticsLoading, error } = useAuthorAnalytics(user?._id);

  const { SingleColumnSection, HeadTags, Typography } = Components;

  if (!currentUser || (currentUser.slug !== slug && !userIsAdminOrMod(currentUser))) {
    return <SingleColumnSection>You don't have permission to view this page.</SingleColumnSection>;
  }

  if (userLoading || !user) return null;

  const title = `Stats for ${user.displayName}`;

  const posts = authorAnalytics?.posts || [];
  // Each element is of type:
  // {
  //   views: number
  //   reads: number
  //   karma: number
  //   comments: number
  //   // TODO include regular post data here like title etc, for now we just have _id
  //   _id: string
  // }

  return (
    <>
      <HeadTags title={title} />
      <SingleColumnSection className={classes.root}>
        {/* TODO graph and page title */}
        <div className={classes.postsListSection}>
          <Typography variant="headline" className={classes.subheading}>
            Posts
          </Typography>
          <div className={classes.grid}>
            <div className={classes.cell}>Date</div>
            <div className={classes.cell}>Views</div>
            <div className={classes.cell}>Reads</div>
            <div className={classes.cell}>Karma</div>
            <div className={classes.cell}>Comments</div>
          </div>
          {posts.map((post) => (
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
