import { getSetting } from 'meteor/vulcan:core';

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
    description: "Posts meeting our frontpage guidelines:\n • interesting, insightful, useful\n • aim to explain, not to persuade\n • avoid meta discussion \n • relevant to people whether or not they \nare involved with the EA community.",
    includes: "(includes curated content and frontpage posts)",
    rssView: "frontpage-rss",
    rss:true
  },
  'community': {
    label: 'All Posts',
    description: "Includes personal and community blogposts\n (as well as frontpage).",
    categoryIcon:"person",
    rssView: "all-posts-rss",
    rss:true
  },
  'meta': {
    label: 'Community',
    description: "Discussion about the EA Community and the EA Forum itself",
    categoryIcon:"details",
    rssView: "community-rss",
    rss:true
  },
  'daily': {
    label: 'Daily',
    description: "Daily - All posts on the EA Forum, sorted by date",
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

if (getSetting('EAForum')) {
  delete postViewSections.curated
}

export default postViewSections;
