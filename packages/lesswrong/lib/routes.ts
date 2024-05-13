import { forumTypeSetting, PublicInstanceSetting, hasEventsSetting, taggingNamePluralSetting, taggingNameIsSet, taggingNamePluralCapitalSetting, taggingNameCapitalSetting, isEAForum, taggingNameSetting } from './instanceSettings';
import { blackBarTitle, legacyRouteAcronymSetting } from './publicSettings';
import { addRoute, RouterLocation, Route } from './vulcan-lib/routes';
import { onStartup } from './executionEnvironment';
import { REVIEW_YEAR } from './reviewUtils';
import { forumSelect } from './forumTypeUtils';
import pickBy from 'lodash/pickBy';
import qs from 'qs';
import { getPostPingbackById, getPostPingbackByLegacyId, getPostPingbackBySlug, getUserPingbackBySlug } from './pingback';
import { eaSequencesHomeDescription } from '../components/ea-forum/EASequencesHome';
import { pluralize } from './vulcan-lib';
import { forumSpecificRoutes } from './forumSpecificRoutes';
import { hasPostRecommendations } from './betas';
import {isFriendlyUI} from '../themes/forumTheme'
import { postRouteWillDefinitelyReturn200 } from './collections/posts/helpers';

const knownTagNames = ['tag', 'topic', 'concept']
const useShortAllTagsPath = isFriendlyUI;

/**
 * Get the path for the all tags page
 */
export const getAllTagsPath = () => {
  return useShortAllTagsPath ? `/${taggingNamePluralSetting.get()}` : `/${taggingNamePluralSetting.get()}/all`;
}

/**
 * Get all the paths that should redirect to the all tags page. This is all combinations of
 * known tag names (e.g. 'topics', 'concepts') with and without `/all` at the end.
 */
export const getAllTagsRedirectPaths: () => string[] = () => {
  const pathRoots = knownTagNames.map(tagName => `/${pluralize(tagName)}`)
  const allPossiblePaths = pathRoots.map(root => [root, `${root}/all`])
  const redirectPaths = ['/wiki', ...allPossiblePaths.flat().filter(path => path !== getAllTagsPath())]
  return redirectPaths
}

export const communityPath = isEAForum ? '/groups' : '/community';
const communitySubtitle = { subtitleLink: communityPath, subtitle: isEAForum ? 'Groups' : 'Community' };

const rationalitySubtitle = { subtitleLink: "/rationality", subtitle: "Rationality: A-Z" };
const highlightsSubtitle = { subtitleLink: "/highlights", subtitle: "Sequence Highlights" };

const hpmorSubtitle = { subtitleLink: "/hpmor", subtitle: "HPMoR" };
const codexSubtitle = { subtitleLink: "/codex", subtitle: "SlateStarCodex" };
const leastWrongSubtitle = { subtitleLink: "/leastwrong", subtitle: "The Best of LessWrong" };

const taggingDashboardSubtitle = { subtitleLink: '/tags/dashboard', subtitle: `${taggingNameIsSet.get() ? taggingNamePluralCapitalSetting.get() : 'Wiki-Tag'} Dashboard`}

export const aboutPostIdSetting = new PublicInstanceSetting<string>('aboutPostId', 'bJ2haLkcGeLtTWaD5', "warning") // Post ID for the /about route
const faqPostIdSetting = new PublicInstanceSetting<string>('faqPostId', '2rWKkWuPrgTMpLRbp', "warning") // Post ID for the /faq route
const contactPostIdSetting = new PublicInstanceSetting<string>('contactPostId', "ehcYkvyz7dh9L7Wt8", "warning")
const introPostIdSetting = new PublicInstanceSetting<string | null>('introPostId', null, "optional")

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
    titleComponentName: 'UserPageTitle',
    getPingback: getUserPingbackBySlug,
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
    title: "Account Settings",
    background: "white"
  },
  {
    name:'users.drafts',
    path:'/drafts',
    componentName: 'DraftsPage',
    title: "Drafts & Unpublished",
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
    title: "Account Settings",
    background: "white",
  },
  {
    name:'users.abTestGroups',
    path:'/abTestGroups',
    componentName: 'UsersViewABTests',
    title: "A/B Test Groups",
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
    name: 'crosspostLogin',
    path: '/crosspostLogin',
    componentName: 'CrosspostLoginPage',
    title: 'Crosspost Login',
    standalone: true,
  },
  {
    name: 'resendVerificationEmail',
    path: '/resendVerificationEmail',
    componentName: 'ResendVerificationEmailPage',
    title: "Email Verification",
    background: "white"
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
    background: "white",
  },
  // disabled except during review voting phase
  {
    name:'reviewVoting',
    path: '/reviewVoting',
    redirect: () => `/reviewVoting/${REVIEW_YEAR}`,
  },
  // {
  //   name:'reviewVoting2019',
  //   path: '/reviewVoting/2019',
  //   title: "Voting 2019 Review",
  //   componentName: "ReviewVotingPage2019"
  // },
  {
    name:'reviewVotingByYear',
    path: '/reviewVoting/:year',
    title: "Review Voting",
    componentName: "ReviewVotingPage",
    subtitleComponentName: "ReviewHeaderTitle"
  },

  {
    name: 'reviewQuickPage',
    path: '/reviewQuickPage',
    componentName: 'ReviewQuickPage',
    title: "Review Quick Page",
    subtitle: "Quick Review Page"
  },

  {
    name: "newLongformReviewForm",
    path: '/newLongformReview',
    title: "New Longform Review",
    componentName: "NewLongformReviewForm",
  },

  // Sequences
  {
    name: 'sequences.single.old',
    path: '/sequences/:_id',
    componentName: 'SequencesSingle',
    previewComponentName: 'SequencePreview'
  },
  {
    name: 'sequences.single',
    path: '/s/:_id',
    componentName: 'SequencesSingle',
    titleComponentName: 'SequencesPageTitle',
    subtitleComponentName: 'SequencesPageTitle',
    previewComponentName: 'SequencePreview'
  },
  {
    name: 'sequencesEdit',
    path: '/sequencesEdit/:_id',
    componentName: 'SequencesEditForm',
  },
  {
    name: 'sequencesNew',
    path: '/sequencesNew',
    componentName: 'SequencesNewForm',
    title: "New Sequence",
  },
  {
    name: 'sequencesPost',
    path: '/s/:sequenceId/p/:postId',
    componentName: 'SequencesPost',
    titleComponentName: 'PostsPageHeaderTitle',
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
    name: 'highlights',
    path: '/highlights',
    title: "Sequences Highlights",
    componentName: 'SequencesHighlightsCollection'
  },
  {
    name: 'highlights.posts.single',
    path: '/highlights/:slug',
    componentName: 'PostsSingleSlug',
    previewComponentName: 'PostLinkPreviewSlug',
    ...highlightsSubtitle,
    getPingback: (parsedUrl) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug),
    background: postBackground
  },

  // Tags redirects
  {
    name: 'tagVoting',
    path: '/tagVoting',
    redirect: () => `/tagActivity`,
  },

  {
    name: 'search',
    path: '/search',
    componentName: 'SearchPageTabbed',
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

if (taggingNameIsSet.get()) {
  addRoute(
    {
      name: 'tagsSingleCustomName',
      path: `/${taggingNamePluralSetting.get()}/:slug`,
      componentName: 'TagPageRouter',
      titleComponentName: 'TagPageTitle',
      subtitleComponentName: 'TagPageTitle',
      previewComponentName: 'TagHoverPreview',
    },
    {
      name: 'tagsSingleRedirectCustomName',
      path: '/tag/:slug',
      redirect: ({ params }) => `/${taggingNamePluralSetting.get()}/${params.slug}`,
    },
    {
      name: 'tagDiscussionCustomName',
      path: `/${taggingNamePluralSetting.get()}/:slug/discussion`,
      componentName: 'TagDiscussionPage',
      titleComponentName: 'TagPageTitle',
      subtitleComponentName: 'TagPageTitle',
      previewComponentName: 'TagHoverPreview',
      background: "white",
      noIndex: true,
    },
    {
      name: 'tagDiscussionCustomNameRedirect',
      path: '/tag/:slug/discussion',
      redirect: ({params}) => `/${taggingNamePluralSetting.get()}/${params.slug}/discussion`
    },
    {
      name: 'tagHistoryCustomName',
      path: `/${taggingNamePluralSetting.get()}/:slug/history`,
      componentName: 'TagHistoryPage',
      titleComponentName: 'TagHistoryPageTitle',
      subtitleComponentName: 'TagHistoryPageTitle',
      noIndex: true,
    },
    {
      name: 'tagHistoryCustomNameRedirect',
      path: '/tag/:slug/history',
      redirect: ({params}) => `/${taggingNamePluralSetting.get()}/${params.slug}/history`
    },
    {
      name: 'tagEditCustomName',
      path: `/${taggingNamePluralSetting.get()}/:slug/edit`,
      componentName: 'EditTagPage',
      titleComponentName: 'TagPageTitle',
      subtitleComponentName: 'TagPageTitle',
    },
    {
      name: 'tagEditCustomNameRedirect',
      path: '/tag/:slug/edit',
      redirect: ({params}) => `/${taggingNamePluralSetting.get()}/${params.slug}/edit`
    },
    {
      name: 'tagCreateCustomName',
      path: `/${taggingNamePluralSetting.get()}/create`,
      title: `New ${taggingNameCapitalSetting.get()}`,
      componentName: 'NewTagPage',
      subtitleComponentName: 'TagPageTitle',
      background: "white"
    },
    {
      name: 'tagCreateCustomNameRedirect',
      path: '/tag/create',
      redirect: () => `/${taggingNamePluralSetting.get()}/create`
    },
    {
      name: 'randomTagCustomName',
      path: `/${taggingNamePluralSetting.get()}/random`,
      componentName: 'RandomTagPage',
    },
    {
      name: 'randomTagCustomNameRedirect',
      path: '/tags/random',
      redirect: () => `/${taggingNamePluralSetting.get()}/random`
    },
    {
      name: 'tagActivityCustomName',
      path: `/${taggingNamePluralSetting.get()}Activity`,
      componentName: 'TagVoteActivity',
      title: `${taggingNamePluralCapitalSetting.get()} Voting Activity`
    },
    {
      name: 'tagActivityCustomNameRedirect',
      path: '/tagActivity',
      redirect: () => `/${taggingNamePluralSetting.get()}Activity`
    },
    {
      name: 'tagFeedCustomName',
      path: `/${taggingNamePluralSetting.get()}Feed`,
      componentName: 'TagActivityFeed',
      title: `${taggingNamePluralCapitalSetting.get()} Activity`
    },
    {
      name: 'tagFeedCustomNameRedirect',
      path: '/tagFeed',
      redirect: () => `/${taggingNamePluralSetting.get()}Feed`
    },
    {
      name: 'taggingDashboardCustomName',
      path: `/${taggingNamePluralSetting.get()}/dashboard`,
      componentName: "TaggingDashboard",
      title: `${taggingNamePluralCapitalSetting.get()} Dashboard`,
      ...taggingDashboardSubtitle
    },
    {
      name: 'taggingDashboardCustomNameRedirect',
      path: '/tags/dashboard',
      redirect: () => `/${taggingNamePluralSetting.get()}/dashboard`
    }
  )
} else {
  addRoute(
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
      name: 'taggingDashboard',
      path: '/tags/dashboard',
      componentName: "TaggingDashboard",
      title: "Tagging Dashboard",
      ...taggingDashboardSubtitle
    },
  )
}

// All tags page
addRoute(
  // The page itself
  {
    name: 'tagsAll',
    path: getAllTagsPath(),
    componentName: isEAForum ? 'EAAllTagsPage' : 'AllTagsPage',
    title: isEAForum ? `${taggingNamePluralCapitalSetting.get()} — Main Page` : "Concepts Portal",
    description: isEAForum ? `Browse the core ${taggingNamePluralSetting.get()} discussed on the EA Forum and an organised wiki of key ${taggingNameSetting.get()} pages` : undefined,
  },
  // And all the redirects to it
  ...getAllTagsRedirectPaths().map((path, idx) => ({
    name: `tagsAllRedirect${idx}`,
    path,
    redirect: () => getAllTagsPath(),
  }))
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

const eaLwAfForumSpecificRoutes = forumSelect<Route[]>({
  EAForum: [
    {
      name: 'home',
      path: '/',
      componentName: 'EAHome',
      description: "Research, discussion, and updates on the world's most pressing problems. Including global health and development, animal welfare, AI safety, and biosecurity.",
      enableResourcePrefetch: true,
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
      name:'notifications',
      path:'/notifications',
      componentName: 'NotificationsPage',
      title: "Notifications",
    },
    {
      name: 'handbook',
      path: '/handbook',
      componentName: 'EAIntroCurriculum',
      title: 'The Effective Altruism Handbook',
    },
    {
      name: 'termsOfUse',
      path: '/termsOfUse',
      componentName: 'EATermsOfUsePage',
    },
    {
      name: 'privacyPolicy',
      path: '/privacyPolicy',
      redirect: () => 'https://ev.org/ops/about/privacy-policy',
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
      name: 'BestOf',
      path: '/best-of',
      componentName: 'EABestOfPage',
      title: 'Best of the Forum',
      subtitle: 'Best of the Forum',
      subtitleLink: '/best-of',
    },
    {
      name: 'BestOfCamelCase',
      path: '/bestOf',
      componentName: 'EABestOfPage',
      redirect: () => '/best-of',
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
      name: 'CommunityTag',
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
      title: 'Library',
      description: eaSequencesHomeDescription,
      componentName: 'EASequencesHome'
    },
    {
      name: 'EventsHome',
      path: '/events',
      componentName: 'EventsHome',
      title: 'Events',
      subtitle: 'Events',
      subtitleLink: '/events'
    },
    {
      name: "communityRedirect1",
      path:'/groupsAndEvents',
      redirect: () => communityPath
    },
    {
      name: "communityRedirect2",
      path:'/community',
      redirect: () => communityPath
    },
    {
      name: 'Groups & people',
      path: communityPath,
      componentName: 'Community',
      title: 'Groups & people',
      description: "Discover local and online EA groups, or browse the members of the forum to find people to connect with.",
      ...communitySubtitle
    },
    {
      name: 'CommunityMembersFullMap',
      path: '/community/map',
      componentName: 'CommunityMembersFullMap',
      title: 'Community Members',
      ...communitySubtitle
    },
    {
      name: 'EditMyProfile',
      path: '/profile/edit',
      componentName: 'EditProfileForm',
      title: 'Edit Profile',
      background: 'white',
    },
    {
      name: 'EditProfile',
      path: '/profile/:slug/edit',
      componentName: 'EditProfileForm',
      title: 'Edit Profile',
      background: 'white',
    },
    {
      name: 'ImportProfile',
      path: '/profile/import',
      componentName: 'EAGApplicationImportFormWrapper',
      title: 'Import Profile',
      background: 'white',
    },
    {
      name: "userAnalytics",
      path:'/users/:slug/stats',
      componentName: "AuthorAnalyticsPage",
    },
    {
      name: "myAnalytics",
      path:'/my-stats',
      componentName: "MyAnalyticsPage",
    },
    {
      name: 'EAGApplicationData',
      path: '/api/eag-application-data'
    },
    {
      name: 'subforum',
      path: `/${taggingNamePluralSetting.get()}/:slug/subforum`,
      redirect: (routerLocation: RouterLocation) => {
        const { params: {slug}, query, hash } = routerLocation

        const redirectQuery = pickBy({
          ...query,
          tab: "subforum",
          commentId: query.commentId || hash?.slice(1)
        }, v => v)

        // Redirect to the /subforum2 path, which will always display like a subforum regardless of whether isSubforum is true
        return `/${taggingNamePluralSetting.get()}/${slug}/subforum2?${qs.stringify(redirectQuery)}${hash}`
      }
    },
    {
      name: 'tagsSubforum',
      path: `/${taggingNamePluralSetting.get()}/:slug/subforum2`,
      componentName: 'TagSubforumPage2',
      titleComponentName: 'TagPageTitle',
      subtitleComponentName: 'TagPageTitle',
      previewComponentName: 'TagHoverPreview',
      unspacedGrid: true,
    },
    {
      name: 'EAForumWrapped',
      path: '/wrapped/:year?',
      componentName: 'EAForumWrappedPage',
      title: 'EA Forum Wrapped',
      noFooter: true,
    },
    {
      name: 'Digests',
      path: '/admin/digests',
      componentName: 'Digests',
      title: 'Digests',
      isAdmin: true,
    },
    {
      name: 'EditDigest',
      path: '/admin/digests/:num',
      componentName: 'EditDigest',
      title: 'Edit Digest',
      subtitle: 'Digests',
      subtitleLink: '/admin/digests',
      staticHeader: true,
      isAdmin: true,
    },
    {
      name: 'recommendationsSample',
      path: '/admin/recommendationsSample',
      componentName: 'RecommendationsSamplePage',
      title: "Recommendations Sample",
      isAdmin: true,
    },
    {
      name: 'CookiePolicy',
      path: '/cookiePolicy',
      componentName: 'CookiePolicy',
      title: 'Cookie Policy',
    },
    {
      name: 'bookmarksRedirect',
      path: '/bookmarks',
      redirect: () => '/saved'
    },
    {
      name: 'savedAndRead',
      path: '/saved',
      componentName: 'BookmarksPage',
      title: 'Saved & read',
    },
    {
      name: 'adminForumEvents',
      path: '/adminForumEvents',
      componentName: 'AdminForumEventsPage',
      title: 'Manage forum events',
    },
    {
      name: 'editForumEvent',
      path: '/editForumEvent/:documentId',
      componentName: 'EditForumEventPage',
      title: 'Edit forum event',
    },
    {
      name: 'peopleDirectory',
      path: '/people-directory',
      componentName: 'PeopleDirectoryPage',
      title: 'People directory',
    },
  ],
  LessWrong: [
    {
      name: 'home',
      path: '/',
      componentName: 'LWHome',
      enableResourcePrefetch: true,
      sunshineSidebar: true, 
      ...(blackBarTitle.get() ? { subtitleLink: "/tag/death", headerSubtitle: blackBarTitle.get()! } : {}),
    },
    {
      name: 'dialogues',
      path: '/dialogues',
      componentName: 'DialoguesPage',
      title: "All Dialogues",
    },
    {
      name:'users.dialogueMatching',
      path:'/dialogueMatching',
      componentName: 'DialogueMatchingPage',
      title: "Dialogue Matching",
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
      redirect: () => `/tag/site-meta`,
    },
    {
      name: 'bestoflesswrong',
      path: '/bestoflesswrong',
      redirect: () => `/leastwrong`,
    },
    {
      name: 'leastwrong',
      path: '/leastwrong',
      componentName: 'TopPostsPage',
      title: "The Best of LessWrong",
      background: "#f8f4ee",
      ...leastWrongSubtitle,
    },
    { 
      name: 'books',
      path: '/books',
      componentName: 'Books',
      title: "Books",
    },
    {
      name: 'HPMOR',
      path: '/hpmor',
      componentName: 'HPMOR',
      title: "Harry Potter and the Methods of Rationality",
      ...hpmorSubtitle,
    },
    {
      name: 'Curated',
      path: '/curated',
      redirect: () => `/recommendations`,
    },
    {
      name: 'bookmarks',
      path: '/bookmarks',
      componentName: 'BookmarksPage',
      title: 'Bookmarks',
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
      redirect: () => `/walledGarden`,
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
    {
      name: 'editPaymentInfo',
      path: '/payments/account',
      componentName: 'EditPaymentInfoPage',
      title: "Account Payment Info"
    },
    {
      name: 'paymentsAdmin',
      path: '/payments/admin',
      componentName: 'AdminPaymentsPage',
      title: "Payments Admin"
    },
    {
      name: 'payments',
      path: '/payments',
      redirect: () => `/payments/admin`, // eventually, payments might be a userfacing feature, and we might do something else with this url
    },
    {
      name: 'All Comments with Reacts',
      path: '/allCommentsWithReacts',
      componentName: 'AllReactedCommentsPage',
      title: "All Comments with Reacts"
    },
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
      name: 'reviews2019-old',
      path: '/reviews2019',
      redirect: () => `/reviews/2019`,
    },
    {
      name: 'library',
      path: '/library',
      componentName: 'LibraryPage',
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
      name: 'editor',
      path: '/editor',
      redirect: () => '/tag/guide-to-the-lesswrong-editor',
    },
    {
      name: 'petrovDayPoll',
      path: '/petrovDayPoll',
      componentName: "PetrovDayPoll",
    },
    {
      name: 'petroyDayPoll',
      path: '/petroyDayPoll',
      componentName: "PetrovDayPoll",
      title: "Petrov Day Poll",
    },
  ],
  AlignmentForum: [
    {
      name:'alignment.home',
      path:'/',
      componentName: 'AlignmentForumHome',
      enableResourcePrefetch: true,
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
      redirect: () => `/tag/site-meta`,
    },
    // Can remove these probably - no one is likely visiting on AF, but maybe not worth a 404
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
    },
    {
      name: 'library',
      path: '/library',
      componentName: 'AFLibraryPage',
      enableResourcePrefetch: true,
      title: "The Library"
    },
    {
      name: 'Sequences',
      path: '/sequences',
      enableResourcePrefetch: true,
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
      name: 'bookmarks',
      path: '/bookmarks',
      componentName: 'BookmarksPage',
      title: 'Bookmarks',
    },
  ],
  default: [
    {
      name:'home',
      path:'/',
      componentName: 'LWHome',
      enableResourcePrefetch: true,
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
      name: 'contact',
      path:'/contact',
      componentName: 'PostsSingleRoute',
      _id: contactPostIdSetting.get(),
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, contactPostIdSetting.get()),
      background: postBackground
    },
    {
      name: 'savedAndRead',
      path: '/saved',
      componentName: 'BookmarksPage',
      title: 'Saved & read',
    },
    {
      name:'notifications',
      path:'/notifications',
      componentName: 'NotificationsPage',
      title: "Notifications",
    },
  ],
})

addRoute(...eaLwAfForumSpecificRoutes)

// Inbox routes
addRoute(...forumSelect<Route[]>({
  LWAF: [
    {
      name: 'inbox',
      path: '/inbox',
      componentName: 'InboxWrapper',
      title: "Inbox",
    },
    {
      name: 'conversation',
      path: '/inbox/:_id',
      componentName: 'ConversationWrapper',
      title: "Private Conversation",
      background: "white",
    },
    {
      name: 'moderatorInbox',
      path: '/moderatorInbox',
      componentName: 'ModeratorInboxWrapper',
      title: "Moderator Inbox",
      fullscreen: true,
    },
  ],
  
  default: [
    {
      name: 'inbox',
      path: '/inbox',
      componentName: 'InboxWrapper',
      title: "Inbox",
      fullscreen: true,
    },
    {
      name: 'conversation',
      path: '/inbox/:_id',
      componentName: 'InboxWrapper',
      title: "Inbox",
      fullscreen: true,
    },
    {
      name: 'moderatorInbox',
      path: '/moderatorInbox',
      componentName: 'ModeratorInboxWrapper',
      title: "Moderator Inbox",
      fullscreen: true,
    },
    {
      name: 'moderatorInboxConversation',
      path: '/moderatorInbox/:_id',
      componentName: 'ModeratorInboxWrapper',
      title: "Moderator Inbox",
      fullscreen: true,
    },
  ]
}))

addRoute({
  name: 'AllComments',
  path: '/allComments',
  componentName: 'AllComments',
  enableResourcePrefetch: true,
  title: "All Comments"
});

addRoute(
  {
    name: 'Shortform',
    path: '/quicktakes',
    componentName: 'ShortformPage',
    title: "Quick Takes",
  },
  {
    name: 'ShortformRedirect',
    path: '/shortform',
    redirect: () => "/quicktakes",
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
      path: forumTypeSetting.get() === 'EAForum' ? '/community-old' : communityPath,
      componentName: 'CommunityHome',
      title: 'Community',
      ...communitySubtitle
    },
    {
      name: 'MeetupsHome',
      path: '/meetups',
      componentName: 'CommunityHome',
      title: 'Community',
    },

    {
      name: 'AllLocalGroups',
      path: '/allgroups',
      componentName: 'AllGroupsPage',
      title: "All Local Groups"
    },
    
    {
      name: 'GroupsMap',
      path: '/groups-map',
      componentName: 'GroupsMap',
      title: "Groups Map",
      standalone: true
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
      subtitle: forumTypeSetting.get() === 'EAForum' ? 'Events' : 'Community',
      subtitleLink: forumTypeSetting.get() === 'EAForum' ? '/events' : communityPath,
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
    previewComponentName: 'PostLinkPreview',
    getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.params._id),
    background: postBackground,
    noFooter: hasPostRecommendations,
    enableResourcePrefetch: postRouteWillDefinitelyReturn200,
  },
  {
    name:'posts.slug.single',
    path:'/posts/slug/:slug?',
    componentName: 'PostsSingleSlugRedirect',
    titleComponentName: 'PostsPageHeaderTitle',
    previewComponentName: 'PostLinkPreviewSlug',
    getPingback: (parsedUrl) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug),
    background: postBackground,
    noFooter: hasPostRecommendations,
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
  // ----- Admin / Moderation -----
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
    name: 'moderatorActions',
    path: '/admin/moderation',
    componentName: 'ModerationDashboard',
    title: "Moderation Dashboard"
  },
  {
    name: 'tagMergeTool',
    path: '/admin/tagMerge',
    componentName: 'TagMergePage',
    title: `${taggingNameCapitalSetting.get()} merging tool`
  },
  {
    name: 'googleServiceAccount',
    path: '/admin/googleServiceAccount',
    componentName: 'AdminGoogleServiceAccount',
    title: `Google Doc import service account`
  },
  {
    name: 'recentlyActiveUsers',
    path: '/admin/recentlyActiveUsers',
    componentName: 'RecentlyActiveUsers',
    title: "Recently Active Users"
  },
  {
    name: 'moderationTemplates',
    path: '/admin/moderationTemplates',
    componentName: 'ModerationTemplatesPage',
    title: "Moderation Message Templates"
  },
  {
    name: 'ModGPTDashboard',
    path: '/admin/modgpt',
    componentName: 'ModGPTDashboard',
    title: "ModGPT Dashboard"
  },
  {
    name: 'synonyms',
    path: '/admin/synonyms',
    componentName: 'AdminSynonymsPage',
    title: "Search Synonyms"
  },
  {
    name: 'randomUser',
    path: '/admin/random-user',
    componentName: 'RandomUserPage',
    title: "Random User",
  },
  {
    name: 'onboarding',
    path: '/admin/onboarding',
    componentName: 'AdminViewOnboarding',
    title: "Onboarding (for testing purposes)",
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
    name: 'moderatorViewAltAccounts',
    path: '/moderation/altAccounts',
    componentName: 'ModerationAltAccounts',
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
    name: 'SpotlightsPage',
    path: '/spotlights',
    componentName: 'SpotlightsPage',
    title: 'Spotlights Page'
  },
);

addRoute(
  {
    path:'/posts/:_id/:slug/comment/:commentId?',
    name: 'comment.greaterwrong',
    componentName: "PostsSingle",
    titleComponentName: 'PostsPageHeaderTitle',
    previewComponentName: "PostCommentLinkPreviewGreaterWrong",
    noIndex: true,
    // TODO: Handle pingbacks leading to comments.
  }
);

addRoute(
  {
    name: 'allPosts',
    path: '/allPosts',
    componentName: 'AllPostsPage',
    enableResourcePrefetch: true,
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
    name: 'reviewsReroute',
    path: '/reviews',
    redirect: () => `/reviews/${REVIEW_YEAR}`,
  },
  {
    name: 'reviews',
    path:'/reviews/:year',
    componentName: 'ReviewsPage',
    title: "Reviews",
  },
  {
    name: 'reviewAdmin',
    path: '/reviewAdmin',
    redirect: () => `/reviewAdmin/${REVIEW_YEAR}`,
  },
  {
    name: 'reviewAdmin-year',
    path: '/reviewAdmin/:year',
    componentName: 'ReviewAdminDashboard',
    title: "Review Admin Dashboard",
    isAdmin: true,
  }
);

forumSpecificRoutes();
