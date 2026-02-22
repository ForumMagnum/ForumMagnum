export const testCrosspostSettings = {
  forumType: "AlignmentForum",
  hasEvents: true,
  title: "Alignment Forum Test",
  tagline: "AI Alignment Forum",
  faviconUrl: "https://res.cloudinary.com/dq3pms5lt/image/upload/v1531267596/alignmentForum_favicon_o9bjnl.png",
  forumSettings: {
    tabTitle: "Alignment Forum Test",
    headerTitle: "Alignment Forum Test",
    shortForumTitle: "AF"
  },
  siteNameWithArticle: "the AI Alignment Forum",
  siteUrl: "http://localhost:3467",
  
  debug: false,
  
  testServer: true,
  analytics: {
    environment: "dev"
  },
  disallowCrawlers: true,
  disableEnsureIndex: true,
  disableElastic: true,
  fmCrosspost: {
    siteName: "LessWrong Test",
    baseUrl: "http://localhost:3456/"
  }
};
