import React, { useMemo } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentTime } from "../../lib/utils/timeUtil";
import { useCurrentCuratedPostCount } from "../hooks/useCurrentCuratedPostCount";
import { Link } from "../../lib/reactRouterWrapper";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import keyBy from "lodash/keyBy";
import moment from "moment";
import classNames from "classnames";
import Loading from "../vulcan-core/Loading";
import HeadTags from "../common/HeadTags";
import EASequenceCard from "./EASequenceCard";
import EACollectionCard from "./EACollectionCard";
import EAPostsItem from "../posts/EAPostsItem";
import PostsAudioCard from "../posts/PostsAudioCard";
import PostsVideoCard from "../posts/PostsVideoCard";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsListWithVotesMultiQuery = gql(`
  query multiPostsListWithVotesQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const CollectionsBestOfFragmentMultiQuery = gql(`
  query multiCollectionEABestOfPageQuery($selector: CollectionSelector, $limit: Int, $enableTotal: Boolean) {
    collections(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CollectionsBestOfFragment
      }
      totalCount
    }
  }
`);

const SequencesPageFragmentMultiQuery = gql(`
  query multiSequenceEABestOfPageQuery($selector: SequenceSelector, $limit: Int, $enableTotal: Boolean) {
    sequences(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SequencesPageFragment
      }
      totalCount
    }
  }
`);

const PostsBestOfListMultiQuery = gql(`
  query multiPostsBestOfListQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsBestOfList
      }
      totalCount
    }
  }
`);

const MAX_WIDTH = 1500;
const MD_WIDTH = 1000;

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    gap: "80px",
    maxWidth: `min(${MAX_WIDTH}px, 100%)`,
    marginLeft: "auto",
    marginRight: "auto",
    padding: "32px 32px",
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.up("md")]: {
      width: MD_WIDTH,
    },
    [theme.breakpoints.up("lg")]: {
      width: MAX_WIDTH,
    },
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
      gap: "60px",
    },
    [theme.breakpoints.down("xs")]: {
      padding: "32px 4px",
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "60px",
  },
  leftColumn: {
    flex: "17 1 0%",
    minWidth: 0, // Magic flexbox property to prevent overflow, see https://stackoverflow.com/a/66689926
  },
  rightColumn: {
    flex: "10 1 0%",
    minWidth: 0, // Magic flexbox property to prevent overflow, see https://stackoverflow.com/a/66689926
  },
  pageTitle: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 32,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 12,
  },
  pageDescription: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: "150%",
    "& a": {
      color: theme.palette.primary.main,
    },
  },
  heading: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 20,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 20,
  },
  gridSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gridGap: "16px",
  },
  listSection: {
    display: "flex",
    flexDirection: "column",
  },
  listGap: {
    gap: "16px",
  },
  viewMore: {
    marginTop: 14,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.grey[600],
  },
  postsItem: {
    maxWidth: "unset",
  },
});

const featuredCollectionsCollectionIds = [
  "MobebwWs2o86cS9Rd", // EA Handbook
];
const featuredCollectionsSequenceIds = [
  "HSA8wsaYiqdt4ouNF", // First Decade Winners
  "gBjPorwZHRArNSQ5w", // Most important century implications
];
const bestOfYearPostIds = [
  "XkLnbSsjK7TpNFgPn", // Truthseeking is the ground in which other principles grow
  "da6iKGxco8hjwH4nv", // Detecting Genetically Engineered Viruses With Metagenomic Sequencing
  "upR4t3gM4YxsKFBCG", // Can we help individual people cost-effectively? Our trial with three sick kids
  "JuGhpwTJxbeGt5GhH", // Good Judgment with Numbers
  "bT3WrFn6H4fpvLSk8", // Policy advocacy for eradicating screwworm looks remarkably cost-effective
];
const introToCauseAreasSequenceIds = [
  "vtmN9g6C57XbqPrZS", // AI risk
  "hnEu2fKLQ9wTRJ9Zc", // Global health and development
  "KWvPuGeFyb5aMdHgK", // Animal welfare
  "JuwQwdLugR63ux2P8", // Biosecurity
  "aH5to3as8yiQA6wGo", // Intro to moral philosophy
  "pFageBjmsLra3ucDC", // Intro to cause prioritization
];
const featuredVideoPostIds = [
  "bsE5t6qhGC65fEpzN", // Growth and the case against randomista development
  "whEmrvK9pzioeircr", // Will AI end everything?
  "LtaT28tevyLbDwidb", // An update to our thinking on climate change
];
// TODO: re-enable these when we fix the audio player
// const featuredAudioPostIds = [
//   "coryFCkmcMKdJb7Pz", // Does economic growth meaningfully improve well-being?
//   "rXYW9GPsmwZYu3doX", // What happens on the average day?
//   "ffmbLCzJctLac3rDu", // StrongMinds should not be a top rated charity (yet)
// ];

const allPostIds = [...bestOfYearPostIds, ...featuredVideoPostIds];

const allSequenceIds = [...featuredCollectionsSequenceIds, ...introToCauseAreasSequenceIds];

const allCollectionIds = [...featuredCollectionsCollectionIds];

export const digestLink = "https://effectivealtruism.us8.list-manage.com/subscribe?u=52b028e7f799cca137ef74763&id=7457c7ff3e";

const EABestOfPage = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const currentCuratedPostCount = useCurrentCuratedPostCount();

  const { data, loading } = useQuery(PostsBestOfListMultiQuery, {
    variables: {
      selector: { default: { postIds: allPostIds } },
      limit: allPostIds.length,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const posts = data?.posts?.results;

  const { data: dataSequencesPageFragment, loading: sequencesLoading } = useQuery(SequencesPageFragmentMultiQuery, {
    variables: {
      selector: { default: { sequenceIds: allSequenceIds } },
      limit: allSequenceIds.length,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const sequences = dataSequencesPageFragment?.sequences?.results;

  const { data: dataCollectionsBestOfFragment, loading: collectionsLoading } = useQuery(CollectionsBestOfFragmentMultiQuery, {
    variables: {
      selector: { default: { collectionIds: allCollectionIds } },
      limit: allCollectionIds.length,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const collections = dataCollectionsBestOfFragment?.collections?.results;

  const currentTime = useCurrentTime();
  const { data: dataPostsListWithVotes, loading: monthlyHighlightsLoading } = useQuery(PostsListWithVotesMultiQuery, {
    variables: {
      selector: { curated: { curatedAfter: moment(currentTime).subtract(1, "month").startOf("day").toISOString() } },
      limit: 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const monthlyHighlights = dataPostsListWithVotes?.posts?.results;

  const postsById = useMemo(() => keyBy(posts, '_id'), [posts]);
  const sequencesById = useMemo(() => keyBy(sequences, '_id'), [sequences]);
  const collectionsById = useMemo(() => keyBy(collections, '_id'), [collections]);

  if (loading || sequencesLoading || collectionsLoading || monthlyHighlightsLoading) {
    return <Loading />;
  }

  const bestOfYearPosts = bestOfYearPostIds.map((id) => postsById[id]).filter(p => !!p);
  const featuredVideoPosts = featuredVideoPostIds.map((id) => postsById[id]).filter(p => !!p);
  // const featuredAudioPosts = featuredAudioPostIds.map((id) => postsById[id]).filter(p => !!p);
  const featuredCollectionCollections = featuredCollectionsCollectionIds.map((id) => collectionsById[id]).filter(c => !!c);
  const featuredCollectionSequences = featuredCollectionsSequenceIds.map((id) => sequencesById[id]).filter(s => !!s);
  const introToCauseAreasSequences = introToCauseAreasSequenceIds.map((id) => sequencesById[id]).filter(s => !!s);
  return (
    <>
      <HeadTags title="Best of the Forum" />
      <AnalyticsContext pageContext="eaBestOfPage">
        <div className={classes.root}>
          <div className={classNames(classes.column, classes.leftColumn)}>
            <div>
              <h1 className={classes.pageTitle}>Best of the Forum</h1>
              <div className={classes.pageDescription}>
                There are hundreds of posts on the EA Forum. This page collects
                a smaller number of excellent posts on a range of topics in
                effective altruism, selected by the EA Forum Team. You can{" "}
                <Link to={digestLink}>also sign up for a weekly email</Link>{" "}
                with some of our favorite posts from the past week.
              </div>
            </div>
            <AnalyticsContext pageSectionContext="featuredCollections">
              <div>
                <h2 className={classes.heading}>Featured collections</h2>
                <div className={classes.gridSection}>
                  {featuredCollectionCollections.map((collection) => (
                    <EACollectionCard key={collection._id} collection={collection} />
                  ))}
                  {featuredCollectionSequences.map((sequence) => (
                    <EASequenceCard key={sequence._id} sequence={sequence} />
                  ))}
                </div>
                <div className={classes.viewMore}>
                  <Link to="/library">View all collections</Link>
                </div>
              </div>
            </AnalyticsContext>
            <AnalyticsContext pageSectionContext="highlightsThisYear">
              <div>
                <h2 className={classes.heading}>Highlights this year</h2>
                <div className={classes.listSection}>
                  {bestOfYearPosts.map((post) => (
                    <EAPostsItem
                      key={post._id}
                      post={post}
                      className={classes.postsItem}
                    />
                  ))}
                </div>
                <div className={classes.viewMore}>
                  <Link to="/recommendations">View more</Link>
                </div>
              </div>
            </AnalyticsContext>
            <AnalyticsContext pageSectionContext="exploreCauseAreas">
              <div>
                <h2 className={classes.heading}>Explore cause areas</h2>
                <div className={classes.gridSection}>
                  {introToCauseAreasSequences.map((sequence) => (
                    <EASequenceCard key={sequence._id} sequence={sequence} />
                  ))}
                </div>
              </div>
            </AnalyticsContext>
          </div>
          <div className={classNames(classes.column, classes.rightColumn)}>
            <AnalyticsContext pageSectionContext="highlightsThisMonth">
              <div>
                <h2 className={classes.heading}>Highlights this month</h2>
                <div className={classes.listSection}>
                  {monthlyHighlights?.map((post, i) => (
                    <EAPostsItem
                      key={post._id}
                      post={post}
                      className={classes.postsItem}
                      curatedIconLeft={i < currentCuratedPostCount}
                      hideSecondaryInfo
                    />
                  ))}
                </div>
                <div className={classes.viewMore}>
                  <Link to="/recommendations">
                    View more
                  </Link>
                </div>
              </div>
            </AnalyticsContext>
            <AnalyticsContext pageSectionContext="featuredVideo">
              <div>
                <h2 className={classes.heading}>Featured videos</h2>
                <div className={classNames(classes.listSection, classes.listGap)}>
                  {featuredVideoPosts.map((post) => (
                    <PostsVideoCard key={post._id} post={post} />
                  ))}
                </div>
                <div className={classes.viewMore}>
                  <Link to="/topics/video">View more</Link>
                </div>
              </div>
            </AnalyticsContext>
            {/* <AnalyticsContext pageSectionContext="featuredAudio">
              <div>
                <h2 className={classes.heading}>Featured audio</h2>
                <div className={classNames(classes.listSection, classes.listGap)}>
                  {featuredAudioPosts.map((post) => (
                    <PostsAudioCard key={post._id} post={post} />
                  ))}
                </div>
              </div>
            </AnalyticsContext> */}
          </div>
        </div>
      </AnalyticsContext>
    </>
  );
};

export default registerComponent(
  "EABestOfPage",
  EABestOfPage,
  {styles, stylePriority: 2},
);


