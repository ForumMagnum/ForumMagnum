export const prodLw = {
  forumType: "LessWrong",
  title: "LessWrong",
  siteNameWithArticle: "LessWrong",
  sentry: {
    url: "https://1ab1949fc8d04608b43132f37bb2a1b0@sentry.io/1301611",
    environment: "production",
    release: "69f0f3c5d57b596e8249571383f8a280eff9bb23"
  },
  debug: false,
  aboutPostId: "bJ2haLkcGeLtTWaD5",
  faqPostId: "2rWKkWuPrgTMpLRbp",
  contactPostId: "ehcYkvyz7dh9L7Wt8",
  expectedDatabaseId: "production",
  tagline: "A community blog devoted to refining the art of rationality",
  faviconUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_lncumn.ico",
  faviconWithBadge: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_with_badge.ico",
  forumSettings: {
    headerTitle: "LESSWRONG",
    shortForumTitle: "LW",
    tabTitle: "LessWrong"
  },
  analytics: {
    environment: "lesswrong.com"
  },
  cluster: {
    enabled: true,
    numWorkers: 2
  },
  testServer: false,
  fmCrosspost: { siteName: "the EA Forum", baseUrl: "https://forum.effectivealtruism.org/" },
  allowTypeIIIPlayer: true,
  hasRejectedContentSection: true,
  hasCuratedPosts: true,
  performanceMetricLogging: {
    enabled: true,
    batchSize: 100
  },
  reviewBotId: "tBchiz3RM7rPwujrJ",
  recombee: {
    databaseId: "lightcone-infrastructure-lesswrong-prod-2",
    publicApiToken: "sb95OJbQ7mKLQAm1abPog2m5vCPj7XqZlVYdHGyANcjzqaHT5fX6HEgB0vCfiLav"
  },
  taggingName: "wikitag",
  taggingUrlCustomBase: "w",
  homepagePosts: {
    feeds: [
      {
        name: "forum-classic",
        label: "Latest",
        description: "The classic LessWrong frontpage algorithm that combines karma with time discounting, plus any tag-based weighting if applied.",
        showToLoggedOut: true
      },
      {
        name: "recombee-hybrid",
        label: "Enriched",
        description: "An equal mix of Latest and Recommended.",
        showSparkleIcon: true,
        defaultTab: true,
        showToLoggedOut: true
      },
      {
        name: "recombee-lesswrong-custom",
        label: "Recommended",
        description: "Personalized recommendations from the history of LessWrong, using a machine learning model that takes into account posts you've read and/or voted on.",
        showSparkleIcon: true,
        showToLoggedOut: true
      },
      {
        name: "forum-subscribed-authors",
        label: "Subscribed",
        description: "Posts and comments by people you've explicitly subscribed to.",
        isInfiniteScroll: true
      },
      {
        name: "vertex-default",
        label: "Vertex",
        description: "Experimental feed for Google Vertex recommendations.",
        showLabsIcon: true,
        adminOnly: true
      },
      {
        name: "forum-bookmarks",
        label: "Bookmarks",
        description: "A list of posts you saved because you wanted to have them findable later."
      },
      {
        name: "forum-continue-reading",
        label: "Resume Reading",
        description: "Further posts in post sequences that you started reading.",
        disabled: true
      }
    ]
  }
};
