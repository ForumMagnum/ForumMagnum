import merge from "lodash/merge";
import { sharedSettings } from "./sharedSettings";

export const baserates = merge({
  forumType: "LessWrong",
  title: "LessWrong Development Server",
  siteNameWithArticle: "LessWrong",
  sentry: {
    url: "https://1ab1949fc8d04608b43132f37bb2a1b0@sentry.io/1301611",
    environment: "development",
    release: "b22cbcd8d54a4adb7780b2fe2370caf2b771c4d9"
  },
  debug: false,
  aboutPostId: "bJ2haLkcGeLtTWaD5",
  faqPostId: "2rWKkWuPrgTMpLRbp",
  contactPostId: "ehcYkvyz7dh9L7Wt8",
  expectedDatabaseId: "development",
  tagline: "A community blog devoted to refining the art of rationality",
  faviconUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_lncumn.ico",
  faviconWithBadge: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_with_badge.ico",
  forumSettings: {
    headerTitle: "LESSWRONG",
    shortForumTitle: "LW",
    tabTitle: "LessWrong"
  },
  taggingName: "wikitag",
  taggingUrlCustomBase: "w",
  analytics: {
    environment: "baserates.org"
  },
  testServer: true,
  disallowCrawlers: true,
  hasRejectedContentSection: true,
  hasCuratedPosts: true,
}, sharedSettings);
