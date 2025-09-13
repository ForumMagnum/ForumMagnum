import merge from "lodash/merge";
import { sharedSettings } from "./sharedSettings";

export const prodAf = merge({
  forumType: "AlignmentForum",
  title: "AI Alignment Forum",
  siteNameWithArticle: "the AI Alignment Forum",
  siteUrl: "https://www.alignmentforum.org",
  sentry: {
    url: "https://1ab1949fc8d04608b43132f37bb2a1b0@sentry.io/1301611",
    environment: "alignmentForum",
    release: "69f0f3c5d57b596e8249571383f8a280eff9bb23"
  },
  debug: false,
  aboutPostId: "Yp2vYb4zHXEeoTkJc",
  faqPostId: "Yp2vYb4zHXEeoTkJc",
  contactPostId: "ehcYkvyz7dh9L7Wt8",
  expectedDatabaseId: "production",
  tagline: "A community blog devoted to technical AI alignment research",
  faviconUrl: "https://res.cloudinary.com/dq3pms5lt/image/upload/v1531267596/alignmentForum_favicon_o9bjnl.png",
  forumSettings: {
    headerTitle: "AI ALIGNMENT FORUM",
    shortForumTitle: "AF",
    tabTitle: "AI Alignment Forum"
  },
  analytics: {
    environment: "alignmentforum.org"
  },
  testServer: false,
  fmCrosspost: { siteName: "the EA Forum", baseUrl: "https://forum.effectivealtruism.org/" },
  performanceMetricLogging: {
    enabled: true,
    batchSize: 100
  },
  recombee: {
    databaseId: "lightcone-infrastructure-lesswrong-prod-2",
    publicApiToken: "sb95OJbQ7mKLQAm1abPog2m5vCPj7XqZlVYdHGyANcjzqaHT5fX6HEgB0vCfiLav"
  },
  taggingName: "wikitag",
  taggingUrlCustomBase: "w"
}, sharedSettings);
