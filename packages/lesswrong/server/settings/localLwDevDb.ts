export const localLwDevDb = {
  forumType: "LessWrong",
  title: "LessWrong",
  tagline: "A community blog devoted to refining the art of rationality",
  logoUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_png/LessWrong_Logo_skglnw.svg",
  siteNameWithArticle: "LessWrong",
  sentry: {
    url: "https://1ab1949fc8d04608b43132f37bb2a1b0@sentry.io/1301611",
    environment: "development",
    release: "af3e448a331a722ef3fd32505773d0e82a25595c"
  },
  aboutPostId: "bJ2haLkcGeLtTWaD5",
  faqPostId: "2rWKkWuPrgTMpLRbp",
  contactPostId: "ehcYkvyz7dh9L7Wt8",
  faviconUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_lncumn.ico",
  faviconWithBadge: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_with_badge.ico",
  forumSettings: {
    headerTitle: "LESSWRONG",
    shortForumTitle: "LW",
    tabTitle: "LessWrong"
  },
  analytics: {
    environment: "localhost"
  },
  testServer: true,
  debug: false,
  ckEditorOverride: {
    uploadUrl: "https://39669.cke-cs.com/easyimage/upload/",
    webSocketUrl: "wss://39669.cke-cs.com/ws"
  },
  fmCrosspost: { siteName: "the EA Forum", baseUrl: "http://localhost:4000/" },
  allowTypeIIIPlayer: true,
  hasRejectedContentSection: true,
  hasCuratedPosts: true,
  expectedDatabaseId: "development",
  performanceMetricLogging: {
    enabled: true,
    batchSize: 10,
    sqlSampleRate: 0.05
  },
  reviewBotId: "tBchiz3RM7rPwujrJ",
  recombee: {
    databaseId: "lightcone-infrastructure-dev",
    publicApiToken: "6rcWJN7eFk8M977tQqEO7SH9n32u3RmPJo9z516AK2vRsiGB4WuaRIzknHwP0jC2"
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
