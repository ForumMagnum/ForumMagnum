import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import sortBy from "lodash/sortBy";

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

const postIds = [
  'ZhNaizQgYY9dXdQkM', // Intro to EA
  'DZnSFYPzoL2oT3pXX', // Announcing: Existential Choices Debate Week (March 17-24)
  'S9H86osFKhfFBCday', // How bad would human extinction be?
  'jCwuozHHjeoLPLemB', // How Long Do Policy Changes Matter?
  'DgpRaCdvupy6cMbdk', // Nuance in Proxies
  'RLCfqw9DKchfngv3f', // We need a new Artesunate - the miracle drug fades
  'ZuWcG3W3rEBxLceWj', // Teaching AI to reason: this year's most important story
  'dsdSnqf7CALBBwjkL', // DAW announcement
  'rXYW9GPsmwZYu3doX', // What happens on the average day?
  'H46HiaQp7YtfNiDZk', // Wild Animal Suffering is the Worst Thing in the World
  'wYjMsKsEkDPgHeAbS', // Four Ideas You Already Agree With
  'fMEhpDrpbnHpcgsDE', // Facing up to the Price on Life
  'JN3kHaiosmdA7kgNY', // The Game Board has been Flipped: Now is a good time to rethink what you’re doing
  'BRqBvkjskZ6c2G6rn', // The Upcoming PEPFAR Cut Will Kill Millions, Many of Them Children
  'bYXjejHrvq65jFL9s', // Implications of the inference scaling paradigm for AI safety
  'j5um9ZhyDCiDXaDqd', // Long-distance development policy
  'kMz9C5ExGEfqqbr3c', // Cage-free Wins in Africa in 2024
  'KbREamTda2sZhKtTz', // Will a food carbon tax lead to more animals being slaughtered? A quantitative model
  'mMYSLTedzLpqwp2Fk', // The EA Opportunity Board is back
  'SkfMyerJ5bGK7scnW', // What I'm celebrating from EA and adjacent work in 2024
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
    <PostsLoading placeholderCount={postIds.length} viewType="card" />
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
