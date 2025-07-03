import { devDbSettings } from "./devDbSettings";
import merge from "lodash/merge";

export const localAfDevDb = merge({
  forumType: "AlignmentForum",
  title: "AI Alignment Forum",
  tagline: "A community blog devoted to technical AI alignment research",
  siteNameWithArticle: "LessWrong",
  sentry: {
    url: "https://1ab1949fc8d04608b43132f37bb2a1b0@sentry.io/1301611",
    environment: "development",
    release: "b22cbcd8d54a4adb7780b2fe2370caf2b771c4d9"
  },
  aboutPostId: "Yp2vYb4zHXEeoTkJc",
  faqPostId: "Yp2vYb4zHXEeoTkJc",
  contactPostId: "ehcYkvyz7dh9L7Wt8",
  faviconUrl: "https://res.cloudinary.com/dq3pms5lt/image/upload/v1531267596/alignmentForum_favicon_o9bjnl.png",
  forumSettings: {
    "headerTitle": "AI ALIGNMENT FORUM",
    "shortForumTitle": "AF",
    "tabTitle": "AI Alignment Forum"
  },
  analytics: {
    environment: "localhost"
  },
  testServer: true,
  debug: false,
  expectedDatabaseId: "development",
  recombee: {
    databaseId: "lightcone-infrastructure-dev",
    publicApiToken: "6rcWJN7eFk8M977tQqEO7SH9n32u3RmPJo9z516AK2vRsiGB4WuaRIzknHwP0jC2"
  },
  taggingName: "wikitag",
  taggingUrlCustomBase: "w",
}, devDbSettings);
