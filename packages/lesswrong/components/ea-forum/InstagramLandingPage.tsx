import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import sortBy from "lodash/sortBy";
import flatten from "lodash/flatten";
import PostsLoading from "../posts/PostsLoading";
import EAPostsItem from "../posts/EAPostsItem";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const PostsListWithVotesMultiQuery = gql(`
  query multiPostInstagramLandingPageQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const ChaptersFragmentMultiQuery = gql(`
  query multiChapterInstagramLandingPageQuery($selector: ChapterSelector, $limit: Int, $enableTotal: Boolean) {
    chapters(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ChaptersFragment
      }
      totalCount
    }
  }
`);

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
const InstagramLandingPage = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { data, loading: chaptersLoading } = useQuery(ChaptersFragmentMultiQuery, {
    variables: {
      selector: { SequenceChapters: { sequenceId: SEQUENCE_ID } },
      limit: 2,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const chapters = data?.chapters?.results;

  const postIds = chapters ? flatten(chapters.map(chapter => chapter.postIds || [])) : [];

  const { data: dataPostsListWithVotes, loading: postsLoading } = useQuery(PostsListWithVotesMultiQuery, {
    variables: {
      selector: { default: { postIds } },
      limit: postIds.length,
      enableTotal: false,
    },
    skip: !postIds.length,
    notifyOnNetworkStatusChange: true,
  });

  const posts = dataPostsListWithVotes?.posts?.results;

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

export default registerComponent(
  "InstagramLandingPage",
  InstagramLandingPage,
  {styles},
);


