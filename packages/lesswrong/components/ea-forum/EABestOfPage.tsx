import React, { useMemo } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";
import { Link } from "../../lib/reactRouterWrapper";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import keyBy from "lodash/keyBy";

const MAX_WIDTH = 1500;
const MD_WIDTH = 1000;

const styles = (theme: ThemeType): JssStyles => ({
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
    fontSize: 16,
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
  "vwK3v3Mekf6Jjpeep", // Lets think about slowing down AI
  "uH9akQzJkzpBD5Duw", // What you can do to help stop violence against women and girls
  "zy6jGPeFKHaoxKEfT", // Capability approach to human welfare
  "pbMfYGjBqrhmmmDSo", // Nuclear winter
  "EEMpNRJK5qqCw6zqH", // Historical farmed animal welfare ballot initiatives
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
const featuredAudioPostIds = [
  "coryFCkmcMKdJb7Pz", // Does economic growth meaningfully improve well-being?
  "rXYW9GPsmwZYu3doX", // What happens on the average day?
  "ffmbLCzJctLac3rDu", // StrongMinds should not be a top rated charity (yet)
];

const allPostIds = [...bestOfYearPostIds, ...featuredVideoPostIds, ...featuredAudioPostIds];

const allSequenceIds = [...featuredCollectionsSequenceIds, ...introToCauseAreasSequenceIds];

const allCollectionIds = [...featuredCollectionsCollectionIds];

const digestLink = "https://effectivealtruism.us8.list-manage.com/subscribe?u=52b028e7f799cca137ef74763&id=7457c7ff3e";

const EABestOfPage = ({ classes }: { classes: ClassesType }) => {
  const { results: posts, loading } = useMulti({
    terms: {postIds: allPostIds, limit: allPostIds.length},
    collectionName: "Posts",
    fragmentName: 'PostsBestOfList',
  });

  const { results: sequences, loading: sequencesLoading } = useMulti({
    terms: {sequenceIds: allSequenceIds, limit: allSequenceIds.length},
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
  });

  const { results: collections, loading: collectionsLoading } = useMulti({
    terms: {collectionIds: allCollectionIds, limit: allCollectionIds.length},
    collectionName: "Collections",
    fragmentName: 'CollectionsBestOfFragment',
  });

  const {
    results: monthlyHighlights,
    loading: monthlyHighlightsLoading,
  } = usePaginatedResolver({
    fragmentName: "PostsListWithVotes",
    resolverName: "DigestHighlights",
  });

  const postsById = useMemo(() => keyBy(posts, '_id'), [posts]);
  const sequencesById = useMemo(() => keyBy(sequences, '_id'), [sequences]);
  const collectionsById = useMemo(() => keyBy(collections, '_id'), [collections]);

  if (loading || sequencesLoading || collectionsLoading || monthlyHighlightsLoading) {
    return <Components.Loading />;
  }

  const bestOfYearPosts = bestOfYearPostIds.map((id) => postsById[id]);
  const featuredVideoPosts = featuredVideoPostIds.map((id) => postsById[id]);
  const featuredAudioPosts = featuredAudioPostIds.map((id) => postsById[id]);
  const featuredCollectionCollections = featuredCollectionsCollectionIds.map((id) => collectionsById[id]);
  const featuredCollectionSequences = featuredCollectionsSequenceIds.map((id) => sequencesById[id]);
  const introToCauseAreasSequences = introToCauseAreasSequenceIds.map((id) => sequencesById[id]);

  const {
    HeadTags, EASequenceCard, EACollectionCard, EAPostsItem, PostsAudioCard,
    PostsVideoCard,
  } = Components;
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
                  {monthlyHighlights?.map((post) => (
                    <EAPostsItem
                      key={post._id}
                      post={post}
                      className={classes.postsItem}
                      hideSecondaryInfo
                    />
                  ))}
                </div>
                <div className={classes.viewMore}>
                  <Link to="/allPosts?timeframe=monthly&hideCommunity=true&sortedBy=top">
                    View more
                  </Link>
                </div>
              </div>
            </AnalyticsContext>
            <AnalyticsContext pageSectionContext="featuredVideo">
              <div>
                <h2 className={classes.heading}>Featured video</h2>
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
            <AnalyticsContext pageSectionContext="featuredAudio">
              <div>
                <h2 className={classes.heading}>Featured audio</h2>
                <div className={classNames(classes.listSection, classes.listGap)}>
                  {featuredAudioPosts.map((post) => (
                    <PostsAudioCard key={post._id} post={post} />
                  ))}
                </div>
              </div>
            </AnalyticsContext>
          </div>
        </div>
      </AnalyticsContext>
    </>
  );
};

const EABestOfPageComponent = registerComponent(
  "EABestOfPage",
  EABestOfPage,
  {styles, stylePriority: 2},
);

declare global {
  interface ComponentTypes {
    EABestOfPage: typeof EABestOfPageComponent;
  }
}
