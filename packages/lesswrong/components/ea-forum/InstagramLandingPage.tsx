import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import sortBy from "lodash/sortBy";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    [theme.breakpoints.down('md')]: {
      padding: '14px 8px 0'
    },
    [theme.breakpoints.down("sm")]: {
      marginLeft: -8,
      marginRight: -8,
    }
  },
  content: {
    margin: '0 auto',
  },
});

const postIds = [
  'ZhNaizQgYY9dXdQkM', // Intro to EA
  'mEQTxDGp4MxMSZA74', // Still donation half
  'SDJKMbvuLyppJNiGD', // RP
  'g2reCF86jukN9WMSJ', // AWF
  'ZYktdzJRMsp2JhwYg', // AMF
  'aYxuFeCcqRvaszHPb', // PauseAI
  'pEtxF6fJr5M6H5fbC', // WAI
]

/**
 * This is a page that the EAF links to from our Instagram account bio.
 * Basically this is the way to get visitors from Instagram to go where you want them to go.
 */
const InstagramLandingPage = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { results: posts, loading } = useMulti({
    terms: {
      postIds,
      limit: postIds.length,
    },
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
  });
  const orderedPosts = sortBy(posts, p => postIds.indexOf(p._id))

  const {
    PostsLoading, EAPostsItem,
  } = Components;

  const postsList = loading ? (
    <PostsLoading placeholderCount={20} viewType="card" />
  ) : orderedPosts.map((post) => (
    <EAPostsItem
      key={post._id}
      viewType="card"
      post={post}
      showKarma={false}
      showIcons={false}
    />
  ))

  return (
    <>
      <AnalyticsContext pageContext="InstagramLandingPage">
        <div className={classes.root}>
          <div className={classes.content}>
            {postsList}
          </div>
        </div>
      </AnalyticsContext>
    </>
  );
};

const InstagramLandingPageComponent = registerComponent(
  "InstagramLandingPage",
  InstagramLandingPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    InstagramLandingPage: typeof InstagramLandingPageComponent;
  }
}
