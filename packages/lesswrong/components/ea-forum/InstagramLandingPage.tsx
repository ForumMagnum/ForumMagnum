import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
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
  's9dyyge6uLG5ScwEp', // It looks like there are some good funding opportunities in AI safety right now
  'sEsguXTiKBA6LzX55', // Takes on "Alignment faking in llms"
  'vHiDeQnCepvwnv8Fm', // AWF AMA
  '5zzbzbYZcocoLnLif', // There is no EA sorting hat
  '4P2qKX7wegdEgMMnb', // GWWC AMA
  'hKfXxfkQ8XCT5ZBRX', // AGB AMA
  '9pkjXwe2nFun32hR2', // mirror bacteria
  '3ZSG22tDuDLxTLY4n', // Allan AMA
  'mEQTxDGp4MxMSZA74', // Still donating half
  'SDJKMbvuLyppJNiGD', // RP
  'g2reCF86jukN9WMSJ', // AWF
  'ZYktdzJRMsp2JhwYg', // AMF
  'aYxuFeCcqRvaszHPb', // PauseAI
  'pEtxF6fJr5M6H5fbC', // WAI
  '9fuJgLik6FNtgrDAD', // Arthropoda Foundation
  'hcpA7ufW6zZzeFaT4', // ORCG
  'HXqzmahbjJwwiX9Si', // ARMoR
  'XmtyNTS8eaT2PMzx4', // NAO
  'rsRDu3u3wF6ctcQPn', // THL
  'k8NLM6QoEjMkEGEmG', // Donation election results
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
