export const testSettings = {
  forumType: process.env.FORUM_TYPE ?? "LessWrong",
  hasEvents: true,
  title: "LessWrong Test",
  tagline: "LessWrong",
  faviconUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_lncumn.ico",
  forumSettings: {
    tabTitle: "LessWrong Test",
    headerTitle: "LessWrong Test",
    shortForumTitle: "LessWrong"
  },
  siteNameWithArticle: "LessWrong",
  siteUrl: "http://localhost:3456",
  
  debug: false,
  
  testServer: true,
  analytics: {
    environment: "dev"
  },
  disallowCrawlers: true,
  disableEnsureIndex: true,
  disableElastic: true,
};
