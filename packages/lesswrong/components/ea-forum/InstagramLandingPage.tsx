import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import sortBy from "lodash/sortBy";
import flatten from "lodash/flatten";
import { PostsLoading } from "../posts/PostsLoading";
import { EAPostsItem } from "../posts/EAPostsItem";

const styles = (theme: ThemeType) => ({
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

// A draft sequence under SC's account to store the ordered list of posts
const SEQUENCE_ID = 'iNAgbC98BnMuNWmxN';

/**
 * This is a page that the EAF links to from our Instagram account bio.
 * Basically this is the way to get visitors from Instagram to go where you want them to go.
 */
const InstagramLandingPageInner = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { results: chapters, loading: chaptersLoading } = useMulti({
    terms: {
      view: "SequenceChapters",
      sequenceId: SEQUENCE_ID,
      limit: 2,
    },
    collectionName: "Chapters",
    fragmentName: 'ChaptersFragment',
  });

  const postIds = chapters ? flatten(chapters.map(chapter => chapter.postIds || [])) : [];

  const { results: posts, loading: postsLoading } = useMulti({
    terms: {
      postIds,
      limit: postIds.length,
    },
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
    skip: !postIds.length,
  });

  const loading = chaptersLoading || postsLoading;
  const orderedPosts = posts ? sortBy(posts, p => postIds.indexOf(p._id)) : [];
  const postsList = loading ? (
    <PostsLoading placeholderCount={10} viewType="card" />
  ) : orderedPosts.map((post) => (
    <EAPostsItem
      key={post._id}
      viewType="card"
      post={post}
      showKarma={false}
      showIcons={false}
      hideTag={true}
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

export const InstagramLandingPage = registerComponent(
  "InstagramLandingPage",
  InstagramLandingPageInner,
  {styles},
);


