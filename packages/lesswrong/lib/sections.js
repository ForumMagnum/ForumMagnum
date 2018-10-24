
const postViewSections = {
  'curated': {
    label: "Curated Posts",
    description: "Curated - Recent, high quality posts selected by the LessWrong moderation team.",
    learnMoreLink: "/posts/tKTcrnKn2YSdxkxKG/frontpage-posting-and-commenting-guidelines",
    categoryIcon:"star",
    rssView: "curated-rss",
    rss:true
  },
  'frontpage': {
    label:'Frontpage Posts',
    categoryIcon:"supervisor_account",
    description: "Posts meeting our frontpage guidelines: aim to explain, not to persuade. Avoid meta-discussion",
    learnMoreLink: "/posts/tKTcrnKn2YSdxkxKG/frontpage-posting-and-commenting-guidelines",
    includes: "(includes curated content and frontpage posts)",
    rssView: "frontpage-rss",
    rss:true
  },
  'community': {
    label: 'All Posts',
    description: "Includes personal and meta blogposts (as well as curated and frontpage).",
    learnMoreLink: "/posts/tKTcrnKn2YSdxkxKG/frontpage-posting-and-commenting-guidelines",
    categoryIcon:"person",
    rssView: "community-rss",
    rss:true
  },
  'meta': {
    label: 'Meta',
    description: "Meta - Discussion about the LessWrong site.",
    categoryIcon:"details",
    rssView: "meta-rss",
    rss:true
  },
  'daily': {
    label: 'Daily',
    description: "Daily - All posts on LessWrong, sorted by date",
    rss:false
  },
  'more': {
    label: '...',
    description: "See more options",
    rss:false
  },
  'pending': 'pending posts',
  'rejected': 'rejected posts',
  'scheduled': 'scheduled posts',
  'all_drafts': 'all drafts',
}

export default postViewSections;
