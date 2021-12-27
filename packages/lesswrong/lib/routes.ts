import { Posts } from './collections/posts/collection';
import { forumTypeSetting, PublicInstanceSetting, hasEventsSetting } from './instanceSettings';
import { legacyRouteAcronymSetting } from './publicSettings';
import { addRoute, PingbackDocument, RouterLocation } from './vulcan-lib/routes';
import { onStartup } from './executionEnvironment';
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR } from './reviewUtils';


const isEAForum = forumTypeSetting.get() === 'EAForum';
export const communityPath = '/community';
const communitySectionName = isEAForum ? 'Community and Events' : 'Community';

const communitySubtitle = { subtitleLink: communityPath, subtitle: communitySectionName };
const rationalitySubtitle = { subtitleLink: "/rationality", subtitle: "Rationality: A-Z" };

const hpmorSubtitle = { subtitleLink: "/hpmor", subtitle: "HPMoR" };
const codexSubtitle = { subtitleLink: "/codex", subtitle: "SlateStarCodex" };
const bestoflwSubtitle = { subtitleLink: "/bestoflesswrong", subtitle: "Best of LessWrong" };
const metaSubtitle = { subtitleLink: "/meta", subtitle: "Meta" };
const walledGardenPortalSubtitle = { subtitleLink: '/walledGarden', subtitle: "Walled Garden"};
const taggingDashboardSubtitle = { subtitleLink: '/tags/dashboard', subtitle: "Wiki-Tag Dashboard"}
const reviewSubtitle = { subtitleLink: "/reviewVoting", subtitle: `${REVIEW_NAME_IN_SITU} Dashboard`}

const aboutPostIdSetting = new PublicInstanceSetting<string>('aboutPostId', 'bJ2haLkcGeLtTWaD5', "warning") // Post ID for the /about route
const faqPostIdSetting = new PublicInstanceSetting<string>('faqPostId', '2rWKkWuPrgTMpLRbp', "warning") // Post ID for the /faq route
const contactPostIdSetting = new PublicInstanceSetting<string>('contactPostId', "ehcYkvyz7dh9L7Wt8", "warning")
const introPostIdSetting = new PublicInstanceSetting<string | null>('introPostId', null, "optional")
const eaHandbookPostIdSetting = new PublicInstanceSetting<string | null>('eaHandbookPostId', null, "optional")

async function getPostPingbackById(parsedUrl: RouterLocation, postId: string|null): Promise<PingbackDocument|null> {
  if (!postId)
    return null;

  // If the URL contains a hash, it leads to either a comment, a landmark within
  // the post, or a builtin ID.
  // TODO: In the case of a comment, we should generate a comment-specific
  // pingback in addition to the pingback to the post the comment is on.
  // TODO: In the case of a landmark, we want to customize the hover preview to
  // reflect where in the post the link was to.
  return ({ collectionName: "Posts", documentId: postId })
}

async function getPostPingbackByLegacyId(parsedUrl: RouterLocation, legacyId: string) {
  const parsedId = parseInt(legacyId, 36);
  const post = await Posts.findOne({"legacyId": parsedId.toString()});
  if (!post) return null;
  return await getPostPingbackById(parsedUrl, post._id);
}

async function getPostPingbackBySlug(parsedUrl: RouterLocation, slug: string) {
  const post = await Posts.findOne({slug: slug});
  if (!post) return null;
  return await getPostPingbackById(parsedUrl, post._id);
}


const postBackground = "white"

const lw18ReviewPosts = [
  ['sketch', 'yeADMcScw8EW9yxpH', 'a-sketch-of-good-communication'],
  ['babble', 'i42Dfoh4HtsCAfXxL', 'babble'],
  ['babble2', 'wQACBmK5bioNCgDoG', 'more-babble'],
  ['prune', 'rYJKvagRYeDM8E9Rf', 'prune'],
  ['validity', 'WQFioaudEH8R7fyhm', 'local-validity-as-a-key-to-sanity-and-civilization'],
  ['alarm', 'B2CfMNfay2P8f2yyc', 'the-loudest-alarm-is-probably-false'],
  ['argument', 'NLBbCQeNLFvBJJkrt', 'varieties-of-argumentative-experience'],
  ['toolbox', 'CPP2uLcaywEokFKQG', 'toolbox-thinking-and-law-thinking'],
  ['technical', 'tKwJQbo6SfWF2ifKh', 'toward-a-new-technical-explanation-of-technical-explanation'],
  ['nameless', '4ZwGqkMTyAvANYEDw', 'naming-the-nameless'],
  ['lotus', 'KwdcMts8P8hacqwrX', 'noticing-the-taste-of-lotus'],
  ['tails', 'asmZvCPHcB4SkSCMW', 'the-tails-coming-apart-as-metaphor-for-life'],
  ['honesty', 'xdwbX9pFEr7Pomaxv', 'meta-honesty-firming-up-honesty-around-its-edge-cases'],
  ['meditation', 'mELQFMi9egPn5EAjK', 'my-attempt-to-explain-looking-insight-meditation-and'],
  ['robust', '2jfiMgKkh7qw9z8Do', 'being-a-robust-agent'],
  ['punish', 'X5RyaEDHNq5qutSHK', 'anti-social-punishment'],
  ['common', '9QxnfMYccz9QRgZ5z', 'the-costly-coordination-mechanism-of-common-knowledge'],
  ['metacognition', 'K4eDzqS2rbcBDsCLZ', 'unrolling-social-metacognition-three-levels-of-meta-are-not'],
  ['web', 'AqbWna2S85pFTsHH4', 'the-intelligent-social-web'],
  ['market', 'a4jRN9nbD79PAhWTB', 'prediction-markets-when-do-they-work'],
  ['spaghetti', 'NQgWL7tvAPgN2LTLn', 'spaghetti-towers'],
  ['knowledge', 'nnNdz7XQrd5bWTgoP', 'on-the-loss-and-preservation-of-knowledge'],
  ['voting', 'D6trAzh6DApKPhbv4', 'a-voting-theory-primer-for-rationalists'],
  ['pavlov', '3rxMBRCYEmHCNDLhu', 'the-pavlov-strategy'],
  ['commons', '2G8j8D5auZKKAjSfY', 'inadequate-equilibria-vs-governance-of-the-commons'],
  ['science', 'v7c47vjta3mavY3QC', 'is-science-slowing-down'],
  ['rescue', 'BhXA6pvAbsFz3gvn4', 'research-rescuers-during-the-holocaust'],
  ['troll', 'CvKnhXTu9BPcdKE4W', 'an-untrollable-mathematician-illustrated'],
  ['long1', 'mFqG58s4NE3EE68Lq', 'why-did-everything-take-so-long'],
  ['long2', 'yxTP9FckrwoMjxPc4', 'why-everything-might-have-taken-so-long'],
  ['clickbait', 'YicoiQurNBxSp7a65', 'is-clickbait-destroying-our-general-intelligence'],
  ['active', 'XYYyzgyuRH5rFN64K', 'what-makes-people-intellectually-active'],
  ['daemon', 'nyCHnY7T5PHPLjxmN', 'open-question-are-minimal-circuits-daemon-free'],
  ['astro', 'Qz6w4GYZpgeDp6ATB', 'beyond-astronomical-waste'],
  ['birthorder1', 'tj8QP2EFdP8p54z6i', 'historical-mathematicians-exhibit-a-birth-order-effect-too'],
  ['birthorder2', 'QTLTic5nZ2DaBtoCv', 'birth-order-effect-found-in-nobel-laureates-in-physics'],
  ['gaming', 'AanbbjYr5zckMKde7', 'specification-gaming-examples-in-ai-1'],
  ['takeoff', 'AfGmsjGPXN97kNp57', 'arguments-about-fast-takeoff'],
  ['rocket', 'Gg9a4y8reWKtLe3Tn', 'the-rocket-alignment-problem'],
  ['agency', 'p7x32SEt43ZMC9r7r', 'embedded-agents'],
  ['faq', 'Djs38EWYZG8o7JMWY', 'paul-s-research-agenda-faq'],
  ['challenges', 'S7csET9CgBtpi7sCh', 'challenges-to-christiano-s-capability-amplification-proposal'],
  ['response', 'Djs38EWYZG8o7JMWY', 'paul-s-research-agenda-faq?commentId=79jM2ecef73zupPR4'],
  ['scale', 'bBdfbWfWxHN9Chjcq', 'robustness-to-scale'],
  ['coherence', 'NxF5G6CJiof6cemTw', 'coherence-arguments-do-not-imply-goal-directed-behavior']
]

lw18ReviewPosts.forEach(
  ([shortUrl, id, slug]) =>
  addRoute({
    name: `LessWrong 2018 Review ${id}/${slug}`,
    path: `/2018/${shortUrl}`, 
    redirect: () => `/posts/${id}/${slug}`
  })
)

// User-profile routes
addRoute(
  {
    name:'users.single',
    path:'/users/:slug',
    componentName: 'UsersSingle',
    //titleHoC: userPageTitleHoC,
    titleComponentName: 'UserPageTitle'
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
    componentName: 'UsersAccount',
    background: "white"
  },
  {
    name:'users.manageSubscriptions',
    path:'/manageSubscriptions',
    componentName: 'ViewSubscriptionsPage',
    title: "Manage Subscriptions",
    background: "white"
  },
  {
    name:'users.edit',
    path:'/users/:slug/edit',
    componentName: 'UsersAccount',
    background: "white"
  },
  {
    name:'users.abTestGroups',
    path:'/abTestGroups',
    componentName: 'UsersViewABTests',
  },
  {
    name: "users.banNotice",
    path: "/banNotice",
    componentName: "BannedNotice",
  },

  // Miscellaneous LW2 routes
  {
    name: 'login',
    path: '/login',
    componentName: 'LoginPage',
    title: "Login",
    background: "white"
  },
  {
    name: 'resendVerificationEmail',
    path: '/resendVerificationEmail',
    componentName: 'ResendVerificationEmailPage',
    background: "white"
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
    title: "Private Conversation",
    background: "white",
    initialScroll: "bottom",
  },

  {
    name: 'newPost',
    path: '/newPost',
    componentName: 'PostsNewForm',
    title: "New Post",
    background: "white"
  },
  {
    name: 'editPost',
    path: '/editPost',
    componentName: 'PostsEditPage',
    background: "white"
  },
  {
    name: 'postAnalytics',
    path: '/postAnalytics',
    componentName: 'PostsAnalyticsPage',
    background: "white"
  },
  {
    name: 'collaboratePost',
    path: '/collaborateOnPost',
    componentName: 'PostCollaborationEditor',
    getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.query.postId),
  },
  // disabled except during review voting phase
  {
    name:'reviewVoting',
    path: '/reviewVoting',
    redirect: () => `/reviewVoting/2020`,
  },
  // {
  //   name:'reviewVoting2019',
  //   path: '/reviewVoting/2019',
  //   title: "Voting 2019 Review",
  //   componentName: "ReviewVotingPage2019"
  // },
  {
    name:'reviewVoting2020',
    path: '/reviewVoting/2020',
    title: "Voting 2020 Review",
    componentName: "ReviewVotingPage",
    ...reviewSubtitle
  },

  // Sequences
  {
    name: 'sequences.single.old',
    path: '/sequences/:_id',
    componentName: 'SequencesSingle',
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
    componentName: 'SequencesEditForm',
    background: "white"
  },
  {
    name: 'sequencesNew',
    path: '/sequencesNew',
    componentName: 'SequencesNewForm',
    title: "New Sequence",
    background: "white"
  },
  {
    name: 'sequencesPost',
    path: '/s/:sequenceId/p/:postId',
    componentName: 'SequencesPost',
    titleComponentName: 'PostsPageHeaderTitle',
    subtitleComponentName: 'PostsPageHeaderTitle',
    previewComponentName: 'PostLinkPreviewSequencePost',
    getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.params.postId),
    background: "white"
  },

  {
    name: 'chaptersEdit',
    path: '/chaptersEdit/:_id',
    componentName: 'ChaptersEditForm',
    title: "Edit Chapter",
    background: "white"
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
    name: 'tags.single',
    path: '/tag/:slug',
    componentName: 'TagPage',
    titleComponentName: 'TagPageTitle',
    subtitleComponentName: 'TagPageTitle',
    previewComponentName: 'TagHoverPreview',
  },
  {
    name: 'tagDiscussion',
    path: '/tag/:slug/discussion',
    componentName: 'TagDiscussionPage',
    titleComponentName: 'TagPageTitle',
    subtitleComponentName: 'TagPageTitle',
    previewComponentName: 'TagHoverPreview',
    background: "white"
  },
  {
    name: 'tagHistory',
    path: '/tag/:slug/history',
    componentName: 'TagHistoryPage',
    titleComponentName: 'TagHistoryPageTitle',
    subtitleComponentName: 'TagHistoryPageTitle',
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
    background: "white"
  },
  {
    name: 'randomTag',
    path: '/tags/random',
    componentName: 'RandomTagPage',
  },
  {
    name: 'allTags',
    path: '/tags/all',
    componentName: 'AllTagsPage',
    title: forumTypeSetting.get() === 'EAForum' ? "The EA Forum Wiki" : "Concepts Portal",
  },
  {
    name: "Concepts",
    path:'/concepts',
    redirect: () => `/tags/all`,
  },
  {
    name: 'tagVoting',
    path: '/tagVoting',
    redirect: () => `/tagActivity`,
  },
  {
    name: 'tagActivity',
    path: '/tagActivity',
    componentName: 'TagVoteActivity',
    title: 'Tag Voting Activity'
  },
  {
    name: 'tagFeed',
    path: '/tagFeed',
    componentName: 'TagActivityFeed',
    title: 'Tag Activity'
  },
  {
    name: 'search',
    path: '/search',
    componentName: 'SearchPage',
    title: 'Search',
    background: "white"
  },
  {
    name: 'votesByYear',
    path: '/votesByYear/:year',
    componentName: 'UserSuggestNominations',
    title: "Your Past Votes"
  },
);

onStartup(() => {
  const legacyRouteAcronym = legacyRouteAcronymSetting.get()
  addRoute(
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
      noIndex: true,
      // TODO: Pingback comment
    }
  );
});

if (forumTypeSetting.get() !== 'EAForum') {
  addRoute(
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
      background: postBackground
    },
    {
      name: 'tagIndex',
      path:'/tags',
      redirect: () => `/tags/all`,
    }
  )
}

if (forumTypeSetting.get() === 'LessWrong') {
  addRoute(
    {
      name: 'bestoflesswrong',
      path: '/bestoflesswrong',
      componentName: 'BestOfLessWrong',
      title: "Best of LessWrong",
      ...bestoflwSubtitle,
    },
    {
      name: 'HPMOR',
      path: '/hpmor',
      componentName: 'HPMOR',
      title: "Harry Potter and the Methods of Rationality",
      ...hpmorSubtitle,
    },
    {
      name: 'Walled Garden',
      path: '/walledGarden',
      componentName: 'WalledGardenHome',
      title: "Walled Garden",
    },
    {
      name: 'Walled Garden Portal',
      path: '/walledGardenPortal',
      componentName: 'WalledGardenPortal',
      title: "Walled Garden Portal",
      ...walledGardenPortalSubtitle,
      disableAutoRefresh: true,
    },
    {
      name: 'HPMOR.posts.single',
      path: '/hpmor/:slug',
      componentName: 'PostsSingleSlug',
      previewComponentName: 'PostLinkPreviewSlug',
      ...hpmorSubtitle,
      getPingback: (parsedUrl) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug),
      background: postBackground
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
      background: postBackground
    },
    {
      name: 'bookLanding',
      path: '/books',
      redirect: () => `/books/2018`,
    },
    {
      name: 'book2018Landing',
      path: '/books/2018',
      componentName: 'Book2018Landing',
      title: "Books: A Map that Reflects the Territory",
      background: "white"
    },
    {
      name: 'book2019Landing',
      path: '/books/2019',
      componentName: 'Book2019Landing',
      title: "Books: Engines of Cognition",
      background: "white"
    },
  );
}

addRoute(
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
);

if (hasEventsSetting.get()) {
  addRoute(
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
      path: communityPath,
      componentName: 'CommunityHome',
      title: communitySectionName,
      ...communitySubtitle
    },
    {
      name: 'MeetupsHome',
      path: '/meetups',
      componentName: 'CommunityHome',
      title: communitySectionName,
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
      titleComponentName: 'LocalgroupPageTitle',
      ...communitySubtitle
    },
    {
      name:'events.single',
      path: '/events/:_id/:slug?',
      componentName: 'PostsSingle',
      titleComponentName: 'PostsPageHeaderTitle',
      previewComponentName: 'PostLinkPreview',
      ...communitySubtitle,
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.params._id),
      background: postBackground
    },
    {
      name: 'groups.post',
      path: '/g/:groupId/p/:_id',
      componentName: 'PostsSingle',
      previewComponentName: 'PostLinkPreview',
      background: postBackground,
      ...communitySubtitle,
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.params._id),
    },
  );

  if(isEAForum) {
    addRoute(
      {
        name: "communityRedirect",
        path:'/groupsAndEvents',
        redirect: () => '/community'
      }
    );
  }
}

addRoute(
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
);

addRoute(
  {
    name:'posts.single',
    path:'/posts/:_id/:slug?',
    componentName: 'PostsSingle',
    titleComponentName: 'PostsPageHeaderTitle',
    subtitleComponentName: 'PostsPageHeaderTitle',
    previewComponentName: 'PostLinkPreview',
    getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.params._id),
    background: postBackground
  },
  {
    name: 'posts.revisioncompare',
    path: '/compare/post/:_id/:slug',
    componentName: 'PostsCompareRevisions',
    titleComponentName: 'PostsPageHeaderTitle',
  },
  {
    name: 'tags.revisioncompare',
    path: '/compare/tag/:slug',
    componentName: 'TagCompareRevisions',
    titleComponentName: 'PostsPageHeaderTitle',
  },
  {
    name: 'post.revisionsselect',
    path: '/revisions/post/:_id/:slug',
    componentName: 'PostsRevisionSelect',
    titleComponentName: 'PostsPageHeaderTitle',
  },
  {
    name: 'tag.revisionsselect',
    path: '/revisions/tag/:slug',
    componentName: 'TagPageRevisionSelect',
    titleComponentName: 'TagPageTitle',
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
    name: 'moderatorComments',
    path: '/moderatorComments',
    componentName: 'ModeratorComments',
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
  {
    name: 'taggingDashboard',
    path: '/tags/dashboard',
    componentName: "TaggingDashboard",
    title: "Tagging Dashboard",
    ...taggingDashboardSubtitle
  },
);

addRoute(
  {
    path:'/posts/:_id/:slug/comment/:commentId?',
    name: 'comment.greaterwrong',
    componentName: "PostsSingle",
    titleComponentName: 'PostsPageHeaderTitle',
    subtitleComponentName: 'PostsPageHeaderTitle',
    previewComponentName: "PostCommentLinkPreviewGreaterWrong",
    noIndex: true,
    // TODO: Handle pingbacks leading to comments.
  }
);

switch (forumTypeSetting.get()) {
  case 'AlignmentForum':
    addRoute(
      {
        name:'alignment.home',
        path:'/',
        componentName: 'AlignmentForumHome',
        sunshineSidebar: true //TODO: remove this in production?
      },
      {
        name:'about',
        path:'/about',
        componentName: 'PostsSingleRoute',
        _id: aboutPostIdSetting.get()
      },
      {
        name: 'faq',
        path: '/faq',
        componentName: 'PostsSingleRoute',
        _id: faqPostIdSetting.get(),
        getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, faqPostIdSetting.get()),
        background: postBackground
      },
      {
        name: 'Meta',
        path: '/meta',
        componentName: 'Meta',
        title: "Meta",
        ...metaSubtitle
      },
    );
    break
  case 'EAForum':
    addRoute(
      {
        name: 'home',
        path: '/',
        componentName: 'EAHome',
        sunshineSidebar: true
      },
      {
        name:'about',
        path:'/about',
        componentName: 'PostsSingleRoute',
        _id: aboutPostIdSetting.get(),
        getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, aboutPostIdSetting.get()),
        background: postBackground
      },
      {
        name:'handbook',
        path:'/handbook',
        componentName: 'PostsSingleRoute',
        _id: eaHandbookPostIdSetting.get(),
        getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, eaHandbookPostIdSetting.get()),
        background: postBackground
      },
      {
        name: 'intro',
        path: '/intro',
        componentName: 'PostsSingleRoute',
        _id: introPostIdSetting.get(),
        getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, introPostIdSetting.get()),
        background: postBackground
      },
      {
        name: 'contact',
        path:'/contact',
        componentName: 'PostsSingleRoute',
        _id: contactPostIdSetting.get(),
        getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, contactPostIdSetting.get()),
        background: postBackground
      },
      {
        name: 'Community',
        path: '/meta',
        redirect: () => `/tag/community`,
      },
      {
        name: 'eaSequencesRedirect',
        path: '/sequences',
        redirect: () => '/library'
      },
      {
        name: 'eaLibrary',
        path: '/library',
        componentName: 'EASequencesHome'
      },
      {
        name: "TagsAll",
        path:'/tags',
        redirect: () => `/tags/all`,
      },
    );
    break
  default:
    // Default is Vanilla LW
    addRoute(
      {
        name: 'home',
        path: '/',
        componentName: 'Home2',
        sunshineSidebar: true
      },
      {
        name: 'about',
        path: '/about',
        componentName: 'PostsSingleRoute',
        _id: aboutPostIdSetting.get(),
        getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, aboutPostIdSetting.get()),
        background: postBackground
      },
      {
        name: 'contact',
        path:'/contact',
        componentName: 'PostsSingleRoute',
        _id: contactPostIdSetting.get(),
        getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, contactPostIdSetting.get()),
        background: postBackground
      },
      {
        name: 'faq',
        path: '/faq',
        componentName: 'PostsSingleRoute',
        _id: faqPostIdSetting.get(),
        getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, faqPostIdSetting.get()),
        background: postBackground
      },
      {
        name: 'donate',
        path: '/donate',
        componentName: 'PostsSingleRoute',
        _id:"LcpQQvcpWfPXvW7R9",
        getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, "LcpQQvcpWfPXvW7R9"),
        background: postBackground
      },
      {
        name: 'Meta',
        path: '/meta',
        componentName: 'Meta',
        title: "Meta"
      },
    );
    break;
}

if (['AlignmentForum', 'LessWrong'].includes(forumTypeSetting.get())) {
  addRoute(
    {
      name:'coronavirus.link.db',
      path:'/coronavirus-link-database',
      componentName: 'SpreadsheetPage',
      title: "COVID-19 Link Database",
    },
    {
      name: 'nominations2018-old',
      path: '/nominations2018',
      redirect: () => `/nominations/2018`,
    },
    {
      name: 'nominations2018',
      path: '/nominations/2018',
      componentName: 'Nominations2018',
      title: "2018 Nominations",
    },
    {
      name: 'nominations2019-old',
      path: '/nominations2019',
      redirect: () => `/nominations/2019`,
    },
    {
      name: 'nominations2019',
      path: '/nominations/2019',
      componentName: 'Nominations2019',
      title: "2019 Nominations",
    },
    {
      name: 'userReviews',
      path:'/users/:slug/reviews',
      redirect: (location) => `/users/${location.params.slug}/reviews/2019`,
    },
    {
      name: 'reviews2018-old',
      path: '/reviews2018',
      redirect: () => `/reviews/2018`,
    },
    {
      name: 'reviews2018',
      path: '/reviews/2018',
      componentName: 'Reviews2018',
      title: "2018 Reviews",
    },
    {
      name: 'reviews2019-old',
      path: '/reviews2019',
      redirect: () => `/reviews/2019`,
    },
    {
      name: 'reviews2019',
      path: '/reviews/2019',
      componentName: 'Reviews2019',
      title: "2019 Reviews",
    }
  )
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
  {
    name: 'password-reset',
    path: '/resetPassword/:token',
    componentName: 'PasswordResetPage',
  },
  {
    name: 'nominations',
    path: '/nominations',
    redirect: () => `/reviewVoting/${REVIEW_YEAR}`,
  },
  {
    name: 'userReviewsByYear',
    path:'/users/:slug/reviews/:year',
    componentName: 'UserReviews',
    title: "User Reviews",
  },
  {
    name: 'userReplies',
    path:'/users/:slug/replies',
    componentName: 'UserCommentsReplies',
    title: "User Comment Replies",
  },
  {
    name: 'reviews',
    path: '/reviews',
    redirect: () => `/reviewVoting/${REVIEW_YEAR}`,
  },
  {
    name: 'reviews-2020',
    path: '/reviews/2020',
    redirect: () => `/reviewVoting/2020`,
  },
  {
    name: 'reviewAdmin',
    path: '/reviewAdmin',
    componentName: 'ReviewAdminDashboard',
    title: "Review Admin Dashboard",
  }
);
