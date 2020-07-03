import React from 'react';
import { addRoute, getSetting } from './vulcan-lib';
import { Posts } from './collections/posts/collection';

const communitySubtitle = { subtitleLink: "/community", subtitle: "Community" };
const rationalitySubtitle = { subtitleLink: "/rationality", subtitle: "Rationality: A-Z" };
const hpmorSubtitle = { subtitleLink: "/hpmor", subtitle: "HPMoR" };
const codexSubtitle = { subtitleLink: "/codex", subtitle: "SlateStarCodex" };
const metaSubtitle = { subtitleLink: "/meta", subtitle: "Meta" };

function getPostPingbackById(parsedUrl, postId) {
  if (parsedUrl.hash) {
    // If the URL contains a hash, it leads to either a comment or a landmark
    // within the post.
    // Future work: If it's a comment ID, make a comment pingback; if it's not
    // a comment ID, make it a post-pingback but do some special-case thing so
    // that the preview excerpt starts in the section that's linked to.
    return null;
  } else {
    return ({ collectionName: "Posts", documentId: postId })
  }
}

async function getPostPingbackByLegacyId(parsedUrl, legacyId) {
  const parsedId = parseInt(legacyId, 36);
  const post = Posts.findOne({"legacyId": parsedId.toString()});
  if (!post) return null;
  return getPostPingbackById(parsedUrl, post._id);
}

async function getPostPingbackBySlug(parsedUrl, slug) {
  const post = Posts.findOne({slug: slug});
  if (!post) return null;
  return getPostPingbackById(parsedUrl, post._id);
}


addRoute([
  // User-profile routes
  {
    name:'users.single',
    path:'/users/:slug',
    componentName: 'UsersSingle',
    //titleHoC: userPageTitleHoC,
    titleComponentName: 'UserPageTitle',
    subtitleComponentName: 'UserPageTitle',
  },
  {
    name:'users.single.user',
    path:'/user/:slug',
    componentName: 'UsersSingle'
  },
  {
    name: "userOverview",
    path:'/user/:slug/overview',
    redirect: (location) => `/users/${location.params.slug}`,
    componentName: "UsersSingle",
  },
  {
    name:'users.single.u',
    path:'/u/:slug',
    componentName: 'UsersSingle'
  },
  {
    name:'users.account',
    path:'/account',
    componentName: 'UsersAccount'
  },
  {
    name:'users.manageSubscriptions',
    path:'/manageSubscriptions',
    componentName: 'ViewSubscriptionsPage',
    title: "Manage Subscriptions",
  },
  {
    name:'users.edit',
    path:'/users/:slug/edit',
    componentName: 'UsersAccount'
  },

  // Miscellaneous LW2 routes
  {
    name: 'login',
    path: '/login',
    componentName: 'LoginPage',
    title: "Login"
  },
  {
    name: 'resendVerificationEmail',
    path: '/resendVerificationEmail',
    componentName: 'ResendVerificationEmailPage'
  },
  {
    name: 'inbox',
    path: '/inbox',
    componentName: 'InboxWrapper',
    title: "Inbox"
  },
  {
    name: 'conversation',
    path: '/inbox/:_id',
    componentName: 'ConversationWrapper',
    title: "Private Conversation"
  },

  {
    name: 'newPost',
    path: '/newPost',
    componentName: 'PostsNewForm',
    title: "New Post"
  },
  {
    name: 'editPost',
    path: '/editPost',
    componentName: 'PostsEditPage'
  },
  {
    name: 'collaboratePost',
    path: '/collaborateOnPost',
    componentName: 'PostCollaborationEditor',
    getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.query.postId),
  },
  // disabled except during review voting phase
  // {
  //   name:'reviewVoting',
  //   path: '/reviewVoting',
  //   componentName: "ReviewVotingPage"
  // },

  // Sequences
  {
    name: 'sequences.single.old',
    path: '/sequences/:_id',
    componentName: 'SequencesSingle'
  },
  {
    name: 'sequences.single',
    path: '/s/:_id',
    componentName: 'SequencesSingle',
    titleComponentName: 'SequencesPageTitle',
    subtitleComponentName: 'SequencesPageTitle',
  },
  {
    name: 'sequencesEdit',
    path: '/sequencesEdit/:_id',
    componentName: 'SequencesEditForm'
  },
  {
    name: 'sequencesNew',
    path: '/sequencesNew',
    componentName: 'SequencesNewForm',
    title: "New Sequence"
  },
  {
    name: 'sequencesPost',
    path: '/s/:sequenceId/p/:postId',
    componentName: 'SequencesPost',
    titleComponentName: 'PostsPageHeaderTitle',
    subtitleComponentName: 'PostsPageHeaderTitle',
    previewComponentName: 'PostLinkPreviewSequencePost',
    getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params.postId),
  },

  {
    name: 'chaptersEdit',
    path: '/chaptersEdit/:_id',
    componentName: 'ChaptersEditForm',
    title: "Edit Chapter"
  },

  // Collections
  {
    name: 'collections',
    path: '/collections/:_id',
    componentName: 'CollectionsSingle'
  },
  {
    name: 'bookmarks',
    path: '/bookmarks',
    componentName: 'BookmarksPage',
    title: 'Bookmarks',
  },

  // Tags
  {
    name: 'tags',
    path: '/tag/:slug',
    componentName: 'TagPage',
    titleComponentName: 'TagPageTitle',
    subtitleComponentName: 'TagPageTitle',
    previewComponentName: 'TagHoverPreview',
  },
  {
    name: 'tagEdit',
    path: '/tag/:slug/edit',
    componentName: 'EditTagPage',
    titleComponentName: 'TagPageTitle',
    subtitleComponentName: 'TagPageTitle',
  },
  {
    name: 'tagCreate',
    path: '/tag/create',
    componentName: 'NewTagPage',
    title: "New Tag",
    subtitleComponentName: 'TagPageTitle',
  },
  {
    name: 'allTags',
    path: '/tags/all',
    componentName: 'AllTagsPage',
    title: "All Tags",
  },
  {
    name: 'tagVoting',
    path: '/tagVoting',
    componentName: 'TagVoteActivity',
    title: 'Tag Voting Activity'
  },
  {
    name: 'search',
    path: '/search',
    componentName: 'SearchPage',
    title: 'LW Search'
  }
]);


// Because the EA Forum was identical except for the change from /lw/ to /ea/
const legacyRouteAcronym = getSetting('legacyRouteAcronym', 'lw')

addRoute([
  // Legacy (old-LW, also old-EAF) routes
  // Note that there are also server-side-only routes in server/legacy-redirects/routes.js.
  {
    name: 'post.legacy',
    path: `/:section(r)?/:subreddit(all|discussion|lesswrong)?/${legacyRouteAcronym}/:id/:slug?`,
    componentName: "LegacyPostRedirect",
    previewComponentName: "PostLinkPreviewLegacy",
    getPingback: (parsedUrl) => getPostPingbackByLegacyId(parsedUrl, parsedUrl.params.id),
  },
  {
    name: 'comment.legacy',
    path: `/:section(r)?/:subreddit(all|discussion|lesswrong)?/${legacyRouteAcronym}/:id/:slug/:commentId`,
    componentName: "LegacyCommentRedirect",
    previewComponentName: "CommentLinkPreviewLegacy",
    // TODO: Pingback comment
  }
]);

if (getSetting('forumType') !== 'EAForum') {
  addRoute([
    {
      name: 'sequencesHome',
      path: '/library',
      componentName: 'SequencesHome',
      title: "The Library"
    },
    {
      name: 'Sequences',
      path: '/sequences',
      componentName: 'CoreSequences',
      title: "Rationality: A-Z"
    },
    {
      name: 'Rationality',
      path: '/rationality',
      componentName: 'CoreSequences',
      title: "Rationality: A-Z",
      ...rationalitySubtitle
    },
    {
      name: 'Rationality.posts.single',
      path: '/rationality/:slug',
      componentName: 'PostsSingleSlug',
      previewComponentName: 'PostLinkPreviewSlug',
      ...rationalitySubtitle,
      getPingback: (parsedUrl) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug),
    },
  ])
}

if (getSetting('forumType') === 'LessWrong') {
  addRoute([
    {
      name: 'HPMOR',
      path: '/hpmor',
      componentName: 'HPMOR',
      title: "Harry Potter and the Methods of Rationality",
      ...hpmorSubtitle,
    },
    {
      name: 'HPMOR.posts.single',
      path: '/hpmor/:slug',
      componentName: 'PostsSingleSlug',
      previewComponentName: 'PostLinkPreviewSlug',
      ...hpmorSubtitle,
      getPingback: (parsedUrl) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug),
    },

    {
      name: 'Codex',
      path: '/codex',
      componentName: 'Codex',
      title: "The Codex",
      ...codexSubtitle,
    },
    {
      name: 'Codex.posts.single',
      path: '/codex/:slug',
      componentName: 'PostsSingleSlug',
      previewComponentName: 'PostLinkPreviewSlug',
      ...codexSubtitle,
      getPingback: (parsedUrl) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug),
    },
  ]);
}

addRoute([
  {
    name: 'AllComments',
    path: '/allComments',
    componentName: 'AllComments',
    title: "All Comments"
  },
  {
    name: 'Shortform',
    path: '/shortform',
    componentName: 'ShortformPage',
    title: "Shortform"
  },
]);

if (getSetting('hasEvents', true)) {
  addRoute([
    {
      name: 'EventsPast',
      path: '/pastEvents',
      componentName: 'EventsPast',
      title: "Past Events by Day"
    },
    {
      name: 'EventsUpcoming',
      path: '/upcomingEvents',
      componentName: 'EventsUpcoming',
      title: "Upcoming Events by Day"
    },

    {
      name: 'CommunityHome',
      path: '/community',
      componentName: 'CommunityHome',
      title: "Community",
      ...communitySubtitle
    },
    {
      name: 'MeetupsHome',
      path: '/meetups',
      componentName: 'CommunityHome',
      title: "Community"
    },

    {
      name: 'AllLocalGroups',
      path: '/allgroups',
      componentName: 'AllGroupsPage',
      title: "All Local Groups"
    },

    {
      name:'Localgroups.single',
      path: '/groups/:groupId',
      componentName: 'LocalGroupSingle',
      ...communitySubtitle
    },
    {
      name:'events.single',
      path: '/events/:_id/:slug?',
      componentName: 'PostsSingle',
      previewComponentName: 'PostLinkPreview',
      ...communitySubtitle,
      getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
    },
    {
      name: 'groups.post',
      path: '/g/:groupId/p/:_id',
      componentName: 'PostsSingle',
      previewComponentName: 'PostLinkPreview',
      ...communitySubtitle,
      getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
    },
  ]);
}

addRoute([
  {
    name: 'searchTest',
    path: '/searchTest',
    componentName: 'SearchBar'
  },
  {
    name: 'postsListEditorTest',
    path:'/postsListEditorTest',
    componentName: 'PostsListEditor'
  },
  {
    name: 'imageUploadTest',
    path: '/imageUpload',
    componentName: 'ImageUpload'
  },
]);

addRoute([
  {
    name:'posts.single',
    path:'/posts/:_id/:slug?',
    componentName: 'PostsSingle',
    titleComponentName: 'PostsPageHeaderTitle',
    subtitleComponentName: 'PostsPageHeaderTitle',
    previewComponentName: 'PostLinkPreview',
    getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
  },
  {
    name: 'posts.revisioncompare',
    path: '/compare/:_id/:slug',
    componentName: 'PostsCompareRevisions',
    titleComponentName: 'PostsPageHeaderTitle',
  },
  {
    name: 'admin',
    path: '/admin',
    componentName: 'AdminHome',
    title: "Admin"
  },
  {
    name: 'migrations',
    path: '/admin/migrations',
    componentName: 'MigrationsDashboard',
    title: "Migrations"
  },
  {
    name: 'moderation',
    path: '/moderation',
    componentName: 'ModerationLog',
    title: "Moderation Log",
    noIndex: true
  },
  {
    name: 'emailHistory',
    path: '/debug/emailHistory',
    componentName: 'EmailHistoryPage'
  },
  {
    name: 'notificationEmailPreview',
    path: '/debug/notificationEmailPreview',
    componentName: 'NotificationEmailPreviewPage'
  },
]);

addRoute([
  {
    path:'/posts/:_id/:slug/comment/:commentId?',
    name: 'comment.greaterwrong',
    componentName: "PostsSingle",
    titleComponentName: 'PostsPageHeaderTitle',
    subtitleComponentName: 'PostsPageHeaderTitle',
    previewComponentName: "PostCommentLinkPreviewGreaterWrong",
    // TODO: Handle pingbacks leading to comments.
  }
]);

switch (getSetting('forumType')) {
  case 'AlignmentForum':
    addRoute([
      {
        name:'alignment.home',
        path:'/',
        componentName: 'AlignmentForumHome'
      },
      {
        name:'about',
        path:'/about',
        componentName: 'PostsSingleRoute',
        _id:"FoiiRDC3EhjHx7ayY"
      },
      {
        name: 'Meta',
        path: '/meta',
        componentName: 'Meta',
        title: "Meta",
        ...metaSubtitle
      },
    ]);
    break
  case 'EAForum':
    addRoute([
      {
        name: 'home',
        path: '/',
        componentName: 'EAHome'
      },
      {
        name:'about',
        path:'/about',
        componentName: 'PostsSingleRoute',
        _id: getSetting('aboutPostId'),
        getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, getSetting('aboutPostId')),
      },
      {
        name: 'intro',
        path: '/intro',
        componentName: 'PostsSingleRoute',
        _id: getSetting('introPostId'),
        getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, getSetting('introPostId')),
      },
      {
        name: 'contact',
        path:'/contact',
        componentName: 'PostsSingleRoute',
        _id: getSetting('contactPostId'),
        getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, getSetting('contactPostId')),
      },
      {
        name: 'Community',
        path: '/meta',
        componentName: 'Meta',
        title: "Community"
      },
      {
        name: 'eaSequencesHome',
        path: '/sequences',
        componentName: 'EASequencesHome'
      },
      {
        name: "TagsAll",
        path:'/tags',
        redirect: () => `/tags/all`,
      }
      // {
      //   name: 'eaHandbookHome',
      //   path: '/handbook',
      //   componentName: 'EASequencesHome'
      // }
    ]);
    break
  default:
    // Default is Vanilla LW
    addRoute([
      {
        name: 'home',
        path: '/',
        componentName: 'Home2'
      },
      {
        name: 'about',
        path: '/about',
        componentName: 'PostsSingleRoute',
        _id:"bJ2haLkcGeLtTWaD5",
        getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, "bJ2haLkcGeLtTWaD5"),
      },
      {
        name: 'faq',
        path: '/faq',
        componentName: 'PostsSingleRoute',
        _id:"2rWKkWuPrgTMpLRbp",
        getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, "2rWKkWuPrgTMpLRbp"),
      },
      {
        name: 'donate',
        path: '/donate',
        componentName: 'PostsSingleRoute',
        _id:"LcpQQvcpWfPXvW7R9",
        getPingback: (parsedUrl) => getPostPingbackById(parsedUrl, "LcpQQvcpWfPXvW7R9"),
      },
      {
        name: 'Meta',
        path: '/meta',
        componentName: 'Meta',
        title: "Meta"
      },
    ]);
    break;
}

// LW and AF
if (['AlignmentForum', 'LessWrong'].includes(getSetting('forumType'))) {
  addRoute([
    {
      name:'coronavirus.link.db',
      path:'/coronavirus-link-database',
      componentName: 'SpreadsheetPage',
      title: "COVID-19 Link Database"
    },
    {
      name: 'tagIndex',
      path: '/tags',
      componentName: 'PostsSingleRoute',
      _id:"DHJBEsi4XJDw2fRFq"
    }
  ])
}

addRoute(
  {
    name: 'home2',
    path: '/home2',
    componentName: 'Home2',
    title: "Home2 Beta",
  },
  {
    name: 'allPosts',
    path: '/allPosts',
    componentName: 'AllPostsPage',
    title: "All Posts",
  },
  {
    name: 'questions',
    path: '/questions',
    componentName: 'QuestionsPage',
    title: "All Questions",
  },
  {
    name: 'recommendations',
    path: '/recommendations',
    componentName: 'RecommendationsPage',
    title: "Recommendations",
  },
  {
    name: 'emailToken',
    path: '/emailToken/:token',
    componentName: 'EmailTokenPage',
  },
]);
