import { 
  forumTypeSetting, PublicInstanceSetting, hasEventsSetting, taggingNamePluralSetting, taggingNameIsSet,
  taggingNamePluralCapitalSetting, taggingNameCapitalSetting, isEAForum, taggingNameSetting, aboutPostIdSetting,
  isLW, isLWorAF, tagUrlBaseSetting, taggingNameCapitalizedWithPluralizationChoice } from './instanceSettings';
import { blackBarTitle, legacyRouteAcronymSetting } from './publicSettings';
import { addRoute, RouterLocation, Route } from './vulcan-lib/routes';
import { BEST_OF_LESSWRONG_PUBLISH_YEAR, REVIEW_YEAR } from './reviewUtils';
import { forumSelect } from './forumTypeUtils';
import pickBy from 'lodash/pickBy';
import qs from 'qs';
import { getPostPingbackById, getPostPingbackByLegacyId, getPostPingbackBySlug, getTagPingbackBySlug, getUserPingbackBySlug } from './pingback';
import EASequencesHome, { eaSequencesHomeDescription } from '../components/ea-forum/EASequencesHome';
import { forumSpecificRoutes } from './forumSpecificRoutes';
import { hasKeywordAlerts, hasPostRecommendations, hasSurveys } from './betas';
import { postRouteWillDefinitelyReturn200 } from './collections/posts/helpers';
import { sequenceRouteWillDefinitelyReturn200 } from './collections/sequences/helpers';
import { tagGetUrl, tagRouteWillDefinitelyReturn200 } from './collections/tags/helpers';
import { GUIDE_PATH_PAGES_MAPPING } from './arbital/paths';
import isEmpty from 'lodash/isEmpty';
import { UserPageTitle } from '@/components/titles/UserPageTitle';
import { SequencesPageTitle } from '@/components/titles/SequencesPageTitle';
import { TagHistoryPageTitle } from '@/components/tagging/TagHistoryPageTitle';
import { LocalgroupPageTitle } from '@/components/titles/LocalgroupPageTitle';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { CommentLinkPreviewLegacy, PostCommentLinkPreviewGreaterWrong, PostLinkPreview, PostLinkPreviewLegacy, PostLinkPreviewSequencePost, PostLinkPreviewSlug, SequencePreview } from '@/components/linkPreview/PostLinkPreview';
import { eaLegacyRedirects } from "./eaLegacyRedirects";
import { TagHoverPreview } from '@/components/tagging/TagHoverPreview';
import AdminGoogleServiceAccount from '@/components/admin/AdminGoogleServiceAccount';
import AdminHome from '@/components/admin/AdminHome';
import AdminSynonymsPage from '@/components/admin/AdminSynonymsPage';
import AdminViewOnboarding from '@/components/admin/AdminViewOnboarding';
import CurationPage from '@/components/admin/CurationPage';
import MigrationsDashboard from '@/components/admin/migrations/MigrationsDashboard';
import RandomUserPage from '@/components/admin/RandomUserPage';
import TwitterAdmin from '@/components/admin/TwitterAdmin';
import AFLibraryPage from '@/components/alignment-forum/AFLibraryPage';
import AlignmentForumHome from '@/components/alignment-forum/AlignmentForumHome';
import AuthorAnalyticsPage from '@/components/analytics/AuthorAnalyticsPage';
import MyAnalyticsPage from '@/components/analytics/MyAnalyticsPage';
import PostsAnalyticsPage from '@/components/analytics/PostsAnalyticsPage';
import BookmarksPage from '@/components/bookmarks/BookmarksPage';
import Book2018Landing from '@/components/books/Book2018Landing';
import Book2019Landing from '@/components/books/Book2019Landing';
import AllComments from '@/components/comments/AllComments';
import LegacyCommentRedirect from '@/components/comments/LegacyCommentRedirect';
import ModeratorComments from '@/components/comments/ModeratorComments';
import UserCommentsReplies from '@/components/comments/UserCommentsReplies';
import CookiePolicy from '@/components/common/CookieBanner/CookiePolicy';
import LWHome from '@/components/common/LWHome';
import SearchBar from '@/components/common/SearchBar';
import Community from '@/components/community/Community';
import CommunityMembersFullMap from '@/components/community/modules/CommunityMembersFullMap';
import DialoguesPage from '@/components/dialogues/DialoguesPage';
import EditDigest from '@/components/ea-forum/digest/EditDigest';
import EABestOfPage from '@/components/ea-forum/EABestOfPage';
import EADigestPage from '@/components/ea-forum/EADigestPage';
import EAHome from '@/components/ea-forum/EAHome';
import EATermsOfUsePage from '@/components/ea-forum/EATermsOfUsePage';
import InstagramLandingPage from '@/components/ea-forum/InstagramLandingPage';
import EAGApplicationImportFormWrapper from '@/components/ea-forum/users/EAGApplicationImportForm';
import EAForumWrappedPage from '@/components/ea-forum/wrapped/EAForumWrappedPage';
import PostCollaborationEditor from '@/components/editor/PostCollaborationEditor';
import EventsHome from '@/components/events/EventsHome';
import AdminForumEventsPage from '@/components/forumEvents/AdminForumEventsPage';
import EditForumEventPage from '@/components/forumEvents/EditForumEventPage';
import GlossaryEditorPage from '@/components/jargon/GlossaryEditorPage';
import PostsWithApprovedJargonPage from '@/components/jargon/PostsWithApprovedJargonPage';
import AutocompleteModelSettings from '@/components/languageModels/AutocompleteModelSettings';
import LlmConversationsViewingPage from '@/components/languageModels/LlmConversationsViewingPage';
import AllGroupsPage from '@/components/localGroups/AllGroupsPage';
import CommunityHome from '@/components/localGroups/CommunityHome';
import GroupsMap from '@/components/localGroups/GroupsMap';
import LocalGroupSingle from '@/components/localGroups/LocalGroupSingle';
import ConversationWrapper from '@/components/messaging/ConversationWrapper';
import InboxWrapper from '@/components/messaging/InboxWrapper';
import MessageUser from '@/components/messaging/MessageUser';
import ModeratorInboxWrapper from '@/components/messaging/ModeratorInboxWrapper';
import ModerationTemplatesPage from '@/components/moderationTemplates/ModerationTemplatesPage';
import NotificationEmailPreviewPage from '@/components/notifications/NotificationEmailPreviewPage';
import NotificationsPage from '@/components/notifications/NotificationsPage/NotificationsPage';
import UltraFeedPage from '@/components/pages/UltraFeedPage';
import AdminPaymentsPage from '@/components/payments/AdminPaymentsPage';
import EditPaymentInfoPage from '@/components/payments/EditPaymentInfoPage';
import PeopleDirectoryPage from '@/components/peopleDirectory/PeopleDirectoryPage';
import AllPostsPage from '@/components/posts/AllPostsPage';
import CurrentOpenThreadPage from '@/components/posts/CurrentOpenThreadPage';
import DraftsPage from '@/components/posts/DraftsPage';
import EventsPast from '@/components/posts/EventsPast';
import EventsUpcoming from '@/components/posts/EventsUpcoming';
import LegacyPostRedirect from '@/components/posts/LegacyPostRedirect';
import PostsCompareRevisions from '@/components/posts/PostsCompareRevisions';
import PostsEditPage from '@/components/posts/PostsEditPage';
import PostsNewForm from '@/components/posts/PostsNewForm';
import PostsSingle from '@/components/posts/PostsSingle';
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import PostsSingleSlug from '@/components/posts/PostsSingleSlug';
import PostsSingleSlugRedirect from '@/components/posts/PostsSingleSlugRedirect';
import QuestionsPage from '@/components/questions/QuestionsPage';
import RecommendationsPage from '@/components/recommendations/RecommendationsPage';
import RecommendationsSamplePage from '@/components/recommendations/RecommendationsSamplePage';
import AnnualReviewPage from '@/components/review/AnnualReviewPage';
import BestOfLessWrongAdmin from '@/components/review/BestOfLessWrongAdmin';
import NewLongformReviewForm from '@/components/review/NewLongformReviewForm';
import Nominations2018 from '@/components/review/Nominations2018';
import Nominations2019 from '@/components/review/Nominations2019';
import ReviewAdminDashboard from '@/components/review/ReviewAdminDashboard';
import Reviews2018 from '@/components/review/Reviews2018';
import Reviews2019 from '@/components/review/Reviews2019';
import UserReviews from '@/components/review/UserReviews';
import PostsRevisionSelect from '@/components/revisions/PostsRevisionSelect';
import TagPageRevisionSelect from '@/components/revisions/TagPageRevisionSelect';
import SearchPageTabbed from '@/components/search/SearchPageTabbed';
import PetrovDayPoll from '@/components/seasonal/petrovDay/PetrovDayPoll';
import Books from '@/components/sequences/Books';
import ChaptersEditForm from '@/components/sequences/ChaptersEditForm';
import Codex from '@/components/sequences/Codex';
import CollectionsSingle from '@/components/sequences/CollectionsSingle';
import CoreSequences from '@/components/sequences/CoreSequences';
import EAIntroCurriculum from '@/components/sequences/EAIntroCurriculum';
import HPMOR from '@/components/sequences/HPMOR';
import LibraryPage from '@/components/sequences/LibraryPage';
import SequencesEditForm from '@/components/sequences/SequencesEditForm';
import SequencesHighlightsCollection from '@/components/sequences/SequencesHighlightsCollection';
import SequencesNewForm from '@/components/sequences/SequencesNewForm';
import SequencesPost from '@/components/sequences/SequencesPost';
import SequencesSingle from '@/components/sequences/SequencesSingle';
import TopPostsPage from '@/components/sequences/TopPostsPage';
import ShortformPage from '@/components/shortform/ShortformPage';
import SpotlightsPage from '@/components/spotlights/SpotlightsPage';
import AllReactedCommentsPage from '@/components/sunshineDashboard/AllReactedCommentsPage';
import { EmailHistoryPage } from '@/components/sunshineDashboard/EmailHistory';
import ModerationAltAccounts from '@/components/sunshineDashboard/ModerationAltAccounts';
import ModerationDashboard from '@/components/sunshineDashboard/ModerationDashboard';
import ModerationLog from '@/components/sunshineDashboard/moderationLog/ModerationLog';
import RecentlyActiveUsers from '@/components/sunshineDashboard/ModeratorUserInfo/RecentlyActiveUsers';
import ModGPTDashboard from '@/components/sunshineDashboard/ModGPTDashboard';
import SurveyAdminPage from '@/components/surveys/SurveyAdminPage';
import SurveyEditPage from '@/components/surveys/SurveyEditPage';
import SurveyScheduleEditPage from '@/components/surveys/SurveyScheduleEditPage';
import ArbitalExplorePage from '@/components/tagging/ArbitalExplorePage';
import EditTagPage from '@/components/tagging/EditTagPage';
import TagHistoryPage from '@/components/tagging/history/TagHistoryPage';
import NewTagPage from '@/components/tagging/NewTagPage';
import RandomTagPage from '@/components/tagging/RandomTagPage';
import TagSubforumPage2 from '@/components/tagging/subforums/TagSubforumPage2';
import TagActivityFeed from '@/components/tagging/TagActivityFeed';
import TagCompareRevisions from '@/components/tagging/TagCompareRevisions';
import TagDiscussionPage from '@/components/tagging/TagDiscussionPage';
import TaggingDashboard from '@/components/tagging/TaggingDashboard';
import TagMergePage from '@/components/tagging/TagMergePage';
import TagPageRouter from '@/components/tagging/TagPageRouter';
import TagVoteActivity from '@/components/tagging/TagVoteActivity';
import UsersAccount from '@/components/users/account/UsersAccount';
import Auth0PasswordResetPage from '@/components/users/Auth0PasswordResetPage';
import BannedNotice from '@/components/users/BannedNotice';
import CrosspostLoginPage from '@/components/users/CrosspostLoginPage';
import EditProfileForm from '@/components/users/EditProfileForm';
import EmailTokenPage from '@/components/users/EmailTokenPage';
import LoginPage from '@/components/users/LoginPage';
import PasswordResetPage from '@/components/users/PasswordResetPage';
import ResendVerificationEmailPage from '@/components/users/ResendVerificationEmailPage';
import UsersSingle from '@/components/users/UsersSingle';
import UsersViewABTests from '@/components/users/UsersViewABTests';
import ViewSubscriptionsPage from '@/components/users/ViewSubscriptionsPage';
import Digests from '@/components/ea-forum/digest/Digests';
import EAAllTagsPage from '@/components/tagging/EAAllTagsPage';
import AllWikiTagsPage from '@/components/tagging/AllWikiTagsPage';
import { communityPath, getAllTagsPath, getAllTagsRedirectPaths } from './pathConstants';
import LeaderboardComponent from '@/components/users/Leaderboard';
import KeywordsPage from '@/components/keywords/KeywordsPage';
import KeywordResultsPage from '@/components/keywords/KeywordResultsPage';
import AdminEventPostEmailPage from '@/components/admin/AdminEventPostEmailPage';

const communitySubtitle = { subtitleLink: communityPath, subtitle: isEAForum ? 'Groups' : 'Community' };

const rationalitySubtitle = { subtitleLink: "/rationality", subtitle: "Rationality: A-Z" };
const highlightsSubtitle = { subtitleLink: "/highlights", subtitle: "Sequence Highlights" };

const hpmorSubtitle = { subtitleLink: "/hpmor", subtitle: "HPMoR" };
const codexSubtitle = { subtitleLink: "/codex", subtitle: "SlateStarCodex" };
const leastWrongSubtitle = { subtitleLink: "/leastwrong", subtitle: "The Best of LessWrong" };

const taggingDashboardSubtitle = { subtitleLink: `/${taggingNamePluralSetting.get()}/dashboard`, subtitle: `${taggingNameIsSet.get() ? taggingNamePluralCapitalSetting.get() : 'Wiki-Tag'} Dashboard`}

const faqPostIdSetting = new PublicInstanceSetting<string>('faqPostId', '2rWKkWuPrgTMpLRbp', isLWorAF ? "warning" : "optional") // Post ID for the /faq route
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

if (isLW) {
  addRoute(
    {
      name: 'leaderboard',
      path: '/leaderboard',
      component: LeaderboardComponent,
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
    //   component: ReviewVotingPage2019
    // },
    {
      name:'reviewVotingByYear',
      path: '/reviewVoting/:year',
      title: "Review Voting",
      component: AnnualReviewPage
    },

    {
      name: 'reviewQuickPage',
      path: '/reviewQuickPage',
      redirect: () => `/quickReview/${REVIEW_YEAR}`
    },

    {
      name: 'quickReview',
      path: '/quickReview/:year',
      component: AnnualReviewPage,
      title: "Review Quick Page",
      subtitle: "Quick Review Page"
    },

    {
      name: 'quickReviewRedirect',
      path: '/quickReview',
      redirect: () => `/quickReview/${REVIEW_YEAR}`
    },

    {
      name: "newLongformReviewForm",
      path: '/newLongformReview',
      title: "New Longform Review",
      component: NewLongformReviewForm,
    },

    {
      name: 'searchTest',
      path: '/searchTest',
      component: SearchBar
    },

    // Collections
    {
      name: 'collections',
      path: '/collections/:_id',
      component: CollectionsSingle,
      hasLeftNavigationColumn: isLW,
      navigationFooterBar: true,
    },
    {
      name: 'highlights',
      path: '/highlights',
      title: "Sequences Highlights",
      component: SequencesHighlightsCollection
    },
    {
      name: 'highlights.posts.single',
      path: '/highlights/:slug',
      component: PostsSingleSlug,
      previewComponent: PostLinkPreviewSlug,
      ...highlightsSubtitle,
      getPingback: (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
      background: postBackground
    },

    {
      name: 'votesByYear',
      path: '/votesByYear/:year',
      redirect: ({params}) => `/nominatePosts/${params.year}`
    },
    {
      name: 'nominatePosts',
      path: '/nominatePosts',
      redirect: () => `/nominatePosts/${REVIEW_YEAR}`
    },
    {
      name: 'nominatePostsByYear',
      path: '/nominatePosts/:year',
      title: "Nominate Posts",
      component: AnnualReviewPage
    },
  );
}

// User-profile routes
addRoute(
  {
    name:'users.single',
    path:'/users/:slug',
    component: UsersSingle,
    //titleHoC: userPageTitleHoC,
    titleComponent: UserPageTitle,
    getPingback: getUserPingbackBySlug,
  },
  {
    name:'users.single.user',
    path:'/user/:slug',
    component: UsersSingle
  },
  {
    name: "userOverview",
    path:'/user/:slug/overview',
    redirect: (location) => `/users/${location.params.slug}`,
    component: UsersSingle,
  },
  {
    name:'users.single.u',
    path:'/u/:slug',
    component: UsersSingle
  },
  {
    name:'users.account',
    path:'/account',
    component: UsersAccount,
    title: "Account Settings",
    background: "white",
    hideFromSitemap: true,
  },
  {
    name:'users.drafts',
    path:'/drafts',
    component: DraftsPage,
    title: "Drafts & Unpublished",
    background: "white",
    hideFromSitemap: true,
  },
  {
    name:'users.manageSubscriptions',
    path:'/manageSubscriptions',
    component: ViewSubscriptionsPage,
    title: "Manage Subscriptions",
    background: "white",
    hideFromSitemap: true,
  },
  {
    name:'users.edit',
    path:'/users/:slug/edit',
    component: UsersAccount,
    title: "Account Settings",
    background: "white",
  },
  {
    name:'users.abTestGroups',
    path:'/abTestGroups',
    component: UsersViewABTests,
    title: "A/B Test Groups",
  },
  {
    name: "users.banNotice",
    path: "/banNotice",
    component: BannedNotice,
    hideFromSitemap: true,
  },

  // Miscellaneous LW2 routes
  {
    name: 'login',
    path: '/login',
    component: LoginPage,
    title: "Login",
    background: "white"
  },
  {
    name: 'crosspostLogin',
    path: '/crosspostLogin',
    component: CrosspostLoginPage,
    title: 'Crosspost Login',
    standalone: true,
    noIndex: true,
  },
  {
    name: 'resendVerificationEmail',
    path: '/resendVerificationEmail',
    component: ResendVerificationEmailPage,
    title: "Email Verification",
    background: "white",
    noIndex: true,
  },
  {
    name: 'newPost',
    path: '/newPost',
    component: PostsNewForm,
    title: "New Post",
    background: "white"
  },
  {
    name: 'editPost',
    path: '/editPost',
    component: PostsEditPage,
    background: "white",
    hideFromSitemap: true,
  },
  {
    name: 'postAnalytics',
    path: '/postAnalytics',
    component: PostsAnalyticsPage,
    background: "white",
    hideFromSitemap: true,
  },
  {
    name: 'collaboratePost',
    path: '/collaborateOnPost',
    component: PostCollaborationEditor,
    getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.query.postId),
    background: "white",
    hideFromSitemap: true,
  },

  // Sequences
  {
    name: 'sequences.single.old',
    path: '/sequences/:_id',
    component: SequencesSingle,
    previewComponent: SequencePreview,
  },
  {
    name: 'sequences.single',
    path: '/s/:_id',
    component: SequencesSingle,
    titleComponent: SequencesPageTitle,
    subtitleComponent: SequencesPageTitle,
    previewComponent: SequencePreview,
    enableResourcePrefetch: sequenceRouteWillDefinitelyReturn200,
  },
  {
    name: 'sequencesEdit',
    path: '/sequencesEdit/:_id',
    component: SequencesEditForm,
  },
  {
    name: 'sequencesNew',
    path: '/sequencesNew',
    component: SequencesNewForm,
    title: "New Sequence",
  },
  {
    name: 'sequencesPost',
    path: '/s/:sequenceId/p/:postId',
    component: SequencesPost,
    titleComponent: PostsPageHeaderTitle,
    previewComponent: PostLinkPreviewSequencePost,
    getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.params.postId),
    background: "white"
  },

  {
    name: 'chaptersEdit',
    path: '/chaptersEdit/:_id',
    component: ChaptersEditForm,
    title: "Edit Chapter",
    background: "white"
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
    component: SearchPageTabbed,
    title: 'Search',
    background: "white"
  },
);

addRoute(
  {
    name: 'tagsSingle',
    path: `/${tagUrlBaseSetting.get()}/:slug`,
    component: TagPageRouter,
    titleComponent: TagPageTitle,
    subtitleComponent: TagPageTitle,
    previewComponent: TagHoverPreview,
    enableResourcePrefetch: tagRouteWillDefinitelyReturn200,
    background: isLWorAF ? "white" : undefined,
    getPingback: (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
    redirect: (location) => {
      if (!isLWorAF) {
        return null;
      }

      const { params: { slug }, query } = location;
      if ('startPath' in query && slug in GUIDE_PATH_PAGES_MAPPING) {
        const firstPathPageId = GUIDE_PATH_PAGES_MAPPING[slug as keyof typeof GUIDE_PATH_PAGES_MAPPING][0];
        return tagGetUrl({slug: firstPathPageId}, {pathId: slug});
      }
      return null;
    },
  },
  {
    name: 'tagDiscussion',
    path: `/${tagUrlBaseSetting.get()}/:slug/discussion`,
    component: TagDiscussionPage,
    titleComponent: TagPageTitle,
    subtitleComponent: TagPageTitle,
    previewComponent: TagHoverPreview,
    background: isLWorAF ? "white" : undefined,
    noIndex: isEAForum,
    getPingback: (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  },
  {
    name: 'tagHistory',
    path: `/${tagUrlBaseSetting.get()}/:slug/history`,
    component: TagHistoryPage,
    titleComponent: TagHistoryPageTitle,
    subtitleComponent: TagHistoryPageTitle,
    enableResourcePrefetch: tagRouteWillDefinitelyReturn200,
    noIndex: true,
  },
  {
    name: 'tagEdit',
    path: `/${tagUrlBaseSetting.get()}/:slug/edit`,
    component: EditTagPage,
    titleComponent: TagPageTitle,
    subtitleComponent: TagPageTitle,
  },
  {
    name: 'tagCreate',
    path: `/${tagUrlBaseSetting.get()}/create`,
    title: `New ${taggingNameCapitalSetting.get()}`,
    component: NewTagPage,
    subtitleComponent: TagPageTitle,
    background: "white"
  },
  {
    name: 'randomTag',
    path: `/${tagUrlBaseSetting.get()}/random`,
    component: RandomTagPage,
    hideFromSitemap: true,
  },
  {
    name: 'tagActivity',
    path: `/${tagUrlBaseSetting.get()}Activity`,
    component: TagVoteActivity,
    title: `${taggingNameCapitalizedWithPluralizationChoice.get()} Voting Activity`
  },
  {
    name: 'tagFeed',
    path: `/${tagUrlBaseSetting.get()}Feed`,
    component: TagActivityFeed,
    title: `${taggingNameCapitalizedWithPluralizationChoice.get()} Activity`
  },
  {
    name: 'taggingDashboard',
    path: `/${tagUrlBaseSetting.get()}/dashboard`,
    component: TaggingDashboard,
    title: `${taggingNameCapitalizedWithPluralizationChoice.get()} Dashboard`,
    ...taggingDashboardSubtitle
  }
)

if (tagUrlBaseSetting.get() !== 'tag') {
  addRoute(
    {
      name: 'tagsSingleRedirect',
      path: '/tag/:slug',
      redirect: ({ params }) => `/${tagUrlBaseSetting.get()}/${params.slug}`,
      getPingback: (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
    },
    {
      name: 'tagDiscussionRedirect',
      path: '/tag/:slug/discussion',
      redirect: ({params}) => `/${tagUrlBaseSetting.get()}/${params.slug}/discussion`,
      getPingback: (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
    },
    {
      name: 'tagHistoryRedirect',
      path: '/tag/:slug/history',
      redirect: ({params}) => `/${tagUrlBaseSetting.get()}/${params.slug}/history`
    },
    {
      name: 'tagEditRedirect',
      path: '/tag/:slug/edit',
      redirect: ({params}) => `/${tagUrlBaseSetting.get()}/${params.slug}/edit`
    },
    {
      name: 'tagCreateRedirect',
      path: '/tag/create',
      redirect: () => `/${tagUrlBaseSetting.get()}/create`
    },
    {
      name: 'randomTagRedirect',
      path: '/tags/random',
      redirect: () => `/${taggingNamePluralSetting.get()}/random`
    },
    {
      name: 'tagActivityRedirect',
      path: '/tagActivity',
      redirect: () => `/${tagUrlBaseSetting.get()}Activity`
    },
    {
      name: 'tagFeedRedirect',
      path: '/tagFeed',
      redirect: () => `/${tagUrlBaseSetting.get()}Feed`
    },
    {
      name: 'taggingDashboardRedirect',
      path: '/tags/dashboard',
      redirect: () => `/${tagUrlBaseSetting.get()}/dashboard`
    },
    {
      name: 'tags.revisioncompare.redirect',
      path: `/compare/tag/:slug`,
      redirect: ({params}) => `/compare/${tagUrlBaseSetting.get()}/${params.slug}`
    },
    {
      name: 'tags.revisionselect.redirect',
      path: `/revisions/tag/:slug`,
      redirect: ({params}) => `/revisions/${tagUrlBaseSetting.get()}/${params.slug}`
    }
  )
}

// All tags page
addRoute(
  // The page itself
  {
    name: 'tagsAll',
    path: getAllTagsPath(),
    component: isEAForum ? EAAllTagsPage : AllWikiTagsPage,
    title: isEAForum ? `${taggingNamePluralCapitalSetting.get()} — Main Page` : "Concepts Portal",
    description: isEAForum ? `Browse the core ${taggingNamePluralSetting.get()} discussed on the EA Forum and an organised wiki of key ${taggingNameSetting.get()} pages` : undefined,
    hasLeftNavigationColumn: false,
    navigationFooterBar: true,
  },
  // And all the redirects to it
  ...getAllTagsRedirectPaths().map((path, idx) => ({
    name: `tagsAllRedirect${idx}`,
    path,
    redirect: () => getAllTagsPath(),
  }))
);

if (isLWorAF) {
  addRoute({
    name: 'arbitalExplore',
    title: 'Arbital',
    path: '/arbital',
    component: ArbitalExplorePage,
    navigationFooterBar: true,
  });
}

if (isLWorAF && tagUrlBaseSetting.get() !== 'p') {
  addRoute(
    {
      name: 'slashPtoBaseRedirect',
      path: '/p/:slug',
      redirect: (location) => {
        const { params: { slug }, query } = location;
        const queryString = !isEmpty(query) ? `?${qs.stringify(query)}` : '';
        return `/${tagUrlBaseSetting.get()}/${slug}${queryString}`;
      }
    }
  );
}

export function initLegacyRoutes() {
  const legacyRouteAcronym = legacyRouteAcronymSetting.get()
  addRoute(
    // Legacy (old-LW, also old-EAF) routes
    // Note that there are also server-side-only routes in server/legacy-redirects/routes.js.
    {
      name: 'post.legacy',
      path: `/:section(r)?/:subreddit(all|discussion|lesswrong)?/${legacyRouteAcronym}/:id/:slug?`,
      component: LegacyPostRedirect,
      previewComponent: PostLinkPreviewLegacy,
      getPingback: (parsedUrl, context) => getPostPingbackByLegacyId(parsedUrl, parsedUrl.params.id, context),
    },
    {
      name: 'comment.legacy',
      path: `/:section(r)?/:subreddit(all|discussion|lesswrong)?/${legacyRouteAcronym}/:id/:slug/:commentId`,
      component: LegacyCommentRedirect,
      previewComponent: CommentLinkPreviewLegacy,
      noIndex: true,
      // TODO: Pingback comment
    }
  );

  if (isEAForum) {
    addRoute(...eaLegacyRedirects.map(({from, to}) => ({
      name: `eaLegacyRedirect-${from}`,
      path: from,
      redirect: () => to,
    })));
  }
}

const eaLwAfForumSpecificRoutes = forumSelect<Route[]>({
  EAForum: [
    {
      name: 'home',
      path: '/',
      component: EAHome,
      description: "The EA Forum hosts research, discussion, and updates on the world's most pressing problems. Including global health and development, animal welfare, AI safety, and biosecurity.",
      enableResourcePrefetch: true,
      sunshineSidebar: true,
      hasLeftNavigationColumn: true,
      navigationFooterBar: true,
    },
    {
      name:'about',
      path:'/about',
      component: PostsSingleRoute,
      _id: aboutPostIdSetting.get(),
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, aboutPostIdSetting.get()),
      background: postBackground,
      hideFromSitemap: true,
    },
    {
      name:'notifications',
      path:'/notifications',
      component: NotificationsPage,
      title: "Notifications",
      hideFromSitemap: true,
    },
    {
      name: 'handbook',
      path: '/handbook',
      component: EAIntroCurriculum,
      title: 'The Effective Altruism Handbook',
    },
    {
      name: 'termsOfUse',
      path: '/termsOfUse',
      component: EATermsOfUsePage,
    },
    {
      name: 'privacyPolicy',
      path: '/privacyPolicy',
      redirect: () => 'https://ev.org/ops/about/privacy-policy',
    },
    {
      name: 'intro',
      path: '/intro',
      component: PostsSingleRoute,
      _id: introPostIdSetting.get(),
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, introPostIdSetting.get()),
      background: postBackground
    },
    {
      name: 'BestOf',
      path: '/best-of',
      component: EABestOfPage,
      title: 'Best of the Forum',
      subtitle: 'Best of the Forum',
      subtitleLink: '/best-of',
    },
    {
      name: 'BestOfCamelCase',
      path: '/bestOf',
      component: EABestOfPage,
      redirect: () => '/best-of',
    },
    {
      name: 'digest',
      path: '/digests/:num',
      component: EADigestPage,
    },
    {
      name: 'contact',
      path:'/contact',
      component: PostsSingleRoute,
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
      component: EASequencesHome,
      hasLeftNavigationColumn: true,
      navigationFooterBar: true,
    },
    {
      name: 'EventsHome',
      path: '/events',
      component: EventsHome,
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
      name: 'GroupsHome',
      path: communityPath,
      component: Community,
      title: 'Groups',
      description: "Discover local and online EA groups, or browse the members of the forum to find people to connect with.",
      ...communitySubtitle
    },
    {
      name: 'CommunityMembersFullMap',
      path: '/community/map',
      component: CommunityMembersFullMap,
      title: 'Community Members',
      ...communitySubtitle
    },
    {
      name: 'EditMyProfile',
      path: '/profile/edit',
      component: EditProfileForm,
      title: 'Edit Profile',
      background: 'white',
      hideFromSitemap: true,
    },
    {
      name: 'EditProfile',
      path: '/profile/:slug/edit',
      component: EditProfileForm,
      title: 'Edit Profile',
      background: 'white',
    },
    {
      name: 'ImportProfile',
      path: '/profile/import',
      component: EAGApplicationImportFormWrapper,
      title: 'Import Profile',
      background: 'white',
      hideFromSitemap: true,
    },
    {
      name: "userAnalytics",
      path:'/users/:slug/stats',
      component: AuthorAnalyticsPage,
      background: "white",
    },
    {
      name: "myAnalytics",
      path:'/my-stats',
      component: MyAnalyticsPage,
      hideFromSitemap: true,
    },
    {
      name: "openThread",
      path:'/open-thread',
      component: CurrentOpenThreadPage,
      hideFromSitemap: true,
    },
    {
      name: 'EAGApplicationData',
      path: '/api/eag-application-data',
      hideFromSitemap: true,
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
      component: TagSubforumPage2,
      titleComponent: TagPageTitle,
      subtitleComponent: TagPageTitle,
      previewComponent: TagHoverPreview,
      unspacedGrid: true,
      hasLeftNavigationColumn: true,
      navigationFooterBar: true,
    },
    {
      name: 'EAForumWrapped',
      path: '/wrapped/:year?',
      component: EAForumWrappedPage,
      title: 'EA Forum Wrapped',
      noFooter: true,
    },
    {
      name: 'Instagram landing page',
      path: '/instagram',
      component: InstagramLandingPage,
      title: 'Instagram Links',
      noFooter: true,
    },
    {
      name: 'Twitter tools',
      path: '/admin/twitter',
      component: TwitterAdmin,
      title: 'Twitter tools',
      isAdmin: true,
    },
    {
      name: 'eventPostEmail',
      path: '/admin/event-post-email',
      component: AdminEventPostEmailPage,
      title: 'Send event post email',
      isAdmin: true,
    },
    {
      name: 'Digests',
      path: '/admin/digests',
      component: Digests,
      title: 'Digests',
      isAdmin: true,
    },
    {
      name: 'EditDigest',
      path: '/admin/digests/:num',
      component: EditDigest,
      title: 'Edit Digest',
      subtitle: 'Digests',
      subtitleLink: '/admin/digests',
      staticHeader: true,
      isAdmin: true,
    },
    {
      name: 'recommendationsSample',
      path: '/admin/recommendationsSample',
      component: RecommendationsSamplePage,
      title: "Recommendations Sample",
      isAdmin: true,
    },
    {
      name: 'CookiePolicy',
      path: '/cookiePolicy',
      component: CookiePolicy,
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
      component: BookmarksPage,
      title: 'Saved & read',
      hideFromSitemap: true,
    },
    {
      name: 'adminForumEvents',
      path: '/adminForumEvents',
      component: AdminForumEventsPage,
      title: 'Manage forum events',
      isAdmin: true,
    },
    {
      name: 'editForumEvent',
      path: '/editForumEvent/:documentId',
      component: EditForumEventPage,
      title: 'Edit forum event',
      isAdmin: true,
    },
    {
      name: 'peopleDirectory',
      path: '/people-directory',
      component: PeopleDirectoryPage,
      title: 'People directory',
    },
    {
      name: 'setPassword',
      path: '/setPassword',
      component: Auth0PasswordResetPage,
      title: 'Set password',
      hideFromSitemap: true,
    },
  ],
  LessWrong: [
    {
      name: 'home',
      path: '/',
      component: LWHome,
      enableResourcePrefetch: true,
      sunshineSidebar: true, 
      ...(blackBarTitle.get() ? { subtitleLink: "/tag/death", headerSubtitle: blackBarTitle.get()! } : {}),
      hasLeftNavigationColumn: true,
      navigationFooterBar: true,
    },
    {
      name: 'dialogues',
      path: '/dialogues',
      component: DialoguesPage,
      title: "All Dialogues",
    },
    {
      name:'llmAutocompleteSettings',
      path:'/autocompleteSettings',
      component: AutocompleteModelSettings,
      title: "LLM Autocomplete Model Settings",
    },
    {
      name: 'about',
      path: '/about',
      component: PostsSingleRoute,
      _id: aboutPostIdSetting.get(),
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, aboutPostIdSetting.get()),
      background: postBackground
    },
    {
      name: 'contact',
      path:'/contact',
      component: PostsSingleRoute,
      _id: contactPostIdSetting.get(),
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, contactPostIdSetting.get()),
      background: postBackground
    },
    {
      name: 'faq',
      path: '/faq',
      component: PostsSingleRoute,
      _id: faqPostIdSetting.get(),
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, faqPostIdSetting.get()),
      background: postBackground
    },
    {
      name: 'donate',
      path: '/donate',
      component: PostsSingleRoute,
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
      name: 'bestOfLessWrongAdmin',
      path: '/bestoflesswrongadmin',
      // the "year + 2" is a hack because it's annoying to fetch ReviewWinnerArt by review year
      // instead we fetch by createdAt date for the art, which is generally 2 years after review
      redirect: () => `/bestoflesswrongadmin/${BEST_OF_LESSWRONG_PUBLISH_YEAR + 2}`,
    },
    {
      name: 'bestOfLessWrongAdminYear',
      path: '/bestoflesswrongadmin/:year',
      component: BestOfLessWrongAdmin,
      title: "Best of LessWrong Admin",
    },
    {
      name: 'bestoflesswrong',
      path: '/bestoflesswrong',
      component: TopPostsPage,
      title: "The Best of LessWrong",
      background: "#f8f4ee",
      ...leastWrongSubtitle,
    },
    {
      name: 'bestoflesswrongByYear',
      path: '/bestoflesswrong/:year/:topic',
      component: TopPostsPage,
      title: "The Best of LessWrong",
      background: "#f8f4ee",
      ...leastWrongSubtitle,
    },
    {
      name: 'leastwrong',
      path: '/leastwrong',
      redirect: () => `/bestoflesswrong`,
    },
    { 
      name: 'books',
      path: '/books',
      component: Books,
      title: "Books",
    },
    {
      name: 'HPMOR',
      path: '/hpmor',
      component: HPMOR,
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
      component: BookmarksPage,
      title: 'Bookmarks',
    },
    {
      name: 'HPMOR.posts.single',
      path: '/hpmor/:slug',
      component: PostsSingleSlug,
      previewComponent: PostLinkPreviewSlug,
      ...hpmorSubtitle,
      getPingback: (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
      background: postBackground
    },

    {
      name: 'Codex',
      path: '/codex',
      component: Codex,
      title: "The Codex",
      ...codexSubtitle,
    },
    {
      name: 'Codex.posts.single',
      path: '/codex/:slug',
      component: PostsSingleSlug,
      previewComponent: PostLinkPreviewSlug,
      ...codexSubtitle,
      getPingback: (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
      background: postBackground
    },
    {
      name: 'book2018Landing',
      path: '/books/2018',
      component: Book2018Landing,
      title: "Books: A Map that Reflects the Territory",
      background: "white"
    },
    {
      name: 'book2019Landing',
      path: '/books/2019',
      component: Book2019Landing,
      title: "Books: Engines of Cognition",
      background: "white"
    },
    {
      name: 'editPaymentInfo',
      path: '/payments/account',
      component: EditPaymentInfoPage,
      title: "Account Payment Info"
    },
    {
      name: 'paymentsAdmin',
      path: '/payments/admin',
      component: AdminPaymentsPage,
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
      component: AllReactedCommentsPage,
      title: "All Comments with Reacts"
    },
    {
      name: 'nominations2018-old',
      path: '/nominations2018',
      redirect: () => `/nominations/2018`,
    },
    {
      name: 'nominations2018',
      path: '/nominations/2018',
      component: Nominations2018,
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
      component: Nominations2019,
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
      component: LibraryPage,
      title: "The Library",
      hasLeftNavigationColumn: true,
      navigationFooterBar: true,
    },
    {
      name: 'Sequences',
      path: '/sequences',
      component: CoreSequences,
      title: "Rationality: A-Z",
    },
    {
      name: 'Rationality',
      path: '/rationality',
      component: CoreSequences,
      title: "Rationality: A-Z",
      ...rationalitySubtitle
    },
    {
      name: 'Rationality.posts.single',
      path: '/rationality/:slug',
      component: PostsSingleSlug,
      previewComponent: PostLinkPreviewSlug,
      ...rationalitySubtitle,
      getPingback: (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
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
      component: PetrovDayPoll,
    },
    {
      name: 'petroyDayPoll',
      path: '/petroyDayPoll',
      component: PetrovDayPoll,
      title: "Petrov Day Poll",
    },
    {
      name: 'feed',
      path: '/feed',
      component: UltraFeedPage,
      title: "LessWrong Feed",
      subtitle: "The Feed",
      hasLeftNavigationColumn: false,
      navigationFooterBar: false,
    },
  ],
  AlignmentForum: [
    {
      name:'alignment.home',
      path:'/',
      component: AlignmentForumHome,
      enableResourcePrefetch: true,
      sunshineSidebar: true,
      hasLeftNavigationColumn: true,
      navigationFooterBar: true,
    },
    {
      name: 'bestoflesswrong',
      path: '/bestoflesswrong',
      component: TopPostsPage,
      title: "The Best of LessWrong",
      background: "#f8f4ee",
      ...leastWrongSubtitle,
    },
    {
      name:'about',
      path:'/about',
      component: PostsSingleRoute,
      _id: aboutPostIdSetting.get()
    },
    {
      name: 'faq',
      path: '/faq',
      component: PostsSingleRoute,
      _id: faqPostIdSetting.get(),
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, faqPostIdSetting.get()),
      background: postBackground
    },
    {
      name: 'Meta',
      path: '/meta',
      redirect: () => `/tag/site-meta`,
    },
    {
      name: 'nominations2018-old',
      path: '/nominations2018',
      redirect: () => `/nominations/2018`,
    },
    {
      name: 'nominations2018',
      path: '/nominations/2018',
      component: Nominations2018,
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
      component: Nominations2019,
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
      component: Reviews2018,
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
      component: Reviews2019,
      title: "2019 Reviews",
    },
    {
      name: 'library',
      path: '/library',
      component: AFLibraryPage,
      enableResourcePrefetch: true,
      title: "The Library",
      hasLeftNavigationColumn: true,
      navigationFooterBar: true,
    },
    {
      name: 'Sequences',
      path: '/sequences',
      enableResourcePrefetch: true,
      component: CoreSequences,
      title: "Rationality: A-Z",
    },
    {
      name: 'Rationality',
      path: '/rationality',
      component: CoreSequences,
      title: "Rationality: A-Z",
      ...rationalitySubtitle
    },
    {
      name: 'Rationality.posts.single',
      path: '/rationality/:slug',
      component: PostsSingleSlug,
      previewComponent: PostLinkPreviewSlug,
      ...rationalitySubtitle,
      getPingback: (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
      background: postBackground
    },
    {
      name: 'bookmarks',
      path: '/bookmarks',
      component: BookmarksPage,
      title: 'Bookmarks',
    },
  ],
  default: [
    {
      name:'home',
      path:'/',
      component: LWHome,
      enableResourcePrefetch: true,
      sunshineSidebar: true,
      hasLeftNavigationColumn: true,
      navigationFooterBar: true,
    },
    {
      name:'about',
      path:'/about',
      component: PostsSingleRoute,
      _id: aboutPostIdSetting.get()
    },
    {
      name: 'faq',
      path: '/faq',
      component: PostsSingleRoute,
      _id: faqPostIdSetting.get(),
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, faqPostIdSetting.get()),
      background: postBackground
    },
    {
      name: 'contact',
      path:'/contact',
      component: PostsSingleRoute,
      _id: contactPostIdSetting.get(),
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, contactPostIdSetting.get()),
      background: postBackground
    },
    {
      name: 'savedAndRead',
      path: '/saved',
      component: BookmarksPage,
      title: 'Saved & read',
    },
    {
      name:'notifications',
      path:'/notifications',
      component: NotificationsPage,
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
      component: InboxWrapper,
      title: "Inbox",
    },
    {
      name: 'conversation',
      path: '/inbox/:_id',
      component: ConversationWrapper,
      title: "Private Conversation",
      background: "white",
    },
    {
      name: 'moderatorInbox',
      path: '/moderatorInbox',
      component: ModeratorInboxWrapper,
      title: "Moderator Inbox",
      fullscreen: true,
    },
  ],
  default: [
    {
      name: 'inbox',
      path: '/inbox',
      component: InboxWrapper,
      title: "Inbox",
      fullscreen: true,
      hideFromSitemap: true,
    },
    {
      name: 'conversation',
      path: '/inbox/:_id',
      component: InboxWrapper,
      title: "Inbox",
      fullscreen: true,
      hideFromSitemap: true,
    },
    {
      name: 'moderatorInbox',
      path: '/moderatorInbox',
      component: ModeratorInboxWrapper,
      title: "Moderator Inbox",
      fullscreen: true,
      hideFromSitemap: true,
    },
    {
      name: 'moderatorInboxConversation',
      path: '/moderatorInbox/:_id',
      component: ModeratorInboxWrapper,
      title: "Moderator Inbox",
      fullscreen: true,
      hideFromSitemap: true,
    },
  ]
}))

addRoute({
  name: 'userInitiateConversation',
  path: '/message/:slug',
  component: MessageUser,
})

addRoute({
  name: 'AllComments',
  path: '/allComments',
  component: AllComments,
  enableResourcePrefetch: true,
  title: "All Comments"
});

addRoute(
  {
    name: 'Shortform',
    path: '/quicktakes',
    component: ShortformPage,
    title: "Quick Takes",
    hasLeftNavigationColumn: true,
    navigationFooterBar: true,
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
      component: EventsPast,
      title: "Past Events by Day"
    },
    {
      name: 'EventsUpcoming',
      path: '/upcomingEvents',
      component: EventsUpcoming,
      title: "Upcoming Events by Day"
    },
    {
      name: 'CommunityHome',
      path: forumTypeSetting.get() === 'EAForum' ? '/community-old' : communityPath,
      component: CommunityHome,
      title: 'Community',
      navigationFooterBar: true,
      ...communitySubtitle,
      hideFromSitemap: true,
    },
    {
      name: 'MeetupsHome',
      path: '/meetups',
      component: CommunityHome,
      title: 'Community',
    },

    {
      name: 'AllLocalGroups',
      path: '/allgroups',
      component: AllGroupsPage,
      title: "All Local Groups"
    },
    
    {
      name: 'GroupsMap',
      path: '/groups-map',
      component: GroupsMap,
      title: "Groups Map",
      standalone: true
    },

    {
      name:'Localgroups.single',
      path: '/groups/:groupId',
      component: LocalGroupSingle,
      titleComponent: LocalgroupPageTitle,
      ...communitySubtitle
    },
    {
      name:'events.single',
      path: '/events/:_id/:slug?',
      component: PostsSingle,
      titleComponent: PostsPageHeaderTitle,
      previewComponent: PostLinkPreview,
      subtitle: forumTypeSetting.get() === 'EAForum' ? 'Events' : 'Community',
      subtitleLink: forumTypeSetting.get() === 'EAForum' ? '/events' : communityPath,
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.params._id),
      background: postBackground,
      noFooter: hasPostRecommendations,
    },
    {
      name: 'groups.post',
      path: '/g/:groupId/p/:_id',
      component: PostsSingle,
      previewComponent: PostLinkPreview,
      background: postBackground,
      ...communitySubtitle,
      getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.params._id),
      noFooter: hasPostRecommendations,
    },
  );
}

addRoute(
  {
    name:'posts.single',
    path:'/posts/:_id/:slug?',
    component: PostsSingle,
    titleComponent: PostsPageHeaderTitle,
    previewComponent: PostLinkPreview,
    getPingback: async (parsedUrl) => await getPostPingbackById(parsedUrl, parsedUrl.params._id),
    background: postBackground,
    noFooter: hasPostRecommendations,
    enableResourcePrefetch: postRouteWillDefinitelyReturn200,
    swrCaching: "logged-out"
  },
  {
    name:'posts.slug.single',
    path:'/posts/slug/:slug?',
    component: PostsSingleSlugRedirect,
    titleComponent: PostsPageHeaderTitle,
    previewComponent: PostLinkPreviewSlug,
    getPingback: (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
    background: postBackground,
    noFooter: hasPostRecommendations,
  },
  {
    name: 'posts.revisioncompare',
    path: '/compare/post/:_id/:slug',
    component: PostsCompareRevisions,
    titleComponent: PostsPageHeaderTitle,
  },
  {
    name: 'tags.revisioncompare',
    path: `/compare/${tagUrlBaseSetting.get()}/:slug`,
    component: TagCompareRevisions,
    titleComponent: PostsPageHeaderTitle,
  },
  {
    name: 'post.revisionsselect',
    path: '/revisions/post/:_id/:slug',
    component: PostsRevisionSelect,
    titleComponent: PostsPageHeaderTitle,
  },
  {
    name: 'tag.revisionsselect',
    path: `/revisions/${tagUrlBaseSetting.get()}/:slug`,
    component: TagPageRevisionSelect,
    titleComponent: TagPageTitle,
  },
  // ----- Admin / Moderation -----
  {
    name: 'admin',
    path: '/admin',
    component: AdminHome,
    title: "Admin",
    isAdmin: true,
  },
  {
    name: 'migrations',
    path: '/admin/migrations',
    component: MigrationsDashboard,
    title: "Migrations",
    isAdmin: true,
  },
  {
    name: 'moderatorActions',
    path: '/admin/moderation',
    component: ModerationDashboard,
    title: "Moderation Dashboard",
    isAdmin: true,
  },
  {
    name: 'tagMergeTool',
    path: '/admin/tagMerge',
    component: TagMergePage,
    title: `${taggingNameCapitalSetting.get()} merging tool`,
    isAdmin: true,
  },
  {
    name: 'googleServiceAccount',
    path: '/admin/googleServiceAccount',
    component: AdminGoogleServiceAccount,
    title: `Google Doc import service account`,
    isAdmin: true,
  },
  {
    name: 'recentlyActiveUsers',
    path: '/admin/recentlyActiveUsers',
    component: RecentlyActiveUsers,
    title: "Recently Active Users",
    isAdmin: true,
  },
  {
    name: 'moderationTemplates',
    path: '/admin/moderationTemplates',
    component: ModerationTemplatesPage,
    title: "Moderation Message Templates",
    isAdmin: true,
  },
  {
    name: 'ModGPTDashboard',
    path: '/admin/modgpt',
    component: ModGPTDashboard,
    title: "ModGPT Dashboard",
    isAdmin: true,
  },
  {
    name: 'synonyms',
    path: '/admin/synonyms',
    component: AdminSynonymsPage,
    title: "Search Synonyms",
    isAdmin: true,
  },
  {
    name: 'randomUser',
    path: '/admin/random-user',
    component: RandomUserPage,
    title: "Random User",
    isAdmin: true,
  },
  {
    name: 'onboarding',
    path: '/admin/onboarding',
    component: AdminViewOnboarding,
    title: "Onboarding (for testing purposes)",
    isAdmin: true,
  },
  {
    name: 'moderation',
    path: '/moderation',
    component: ModerationLog,
    title: "Moderation Log",
    noIndex: true
  },
  {
    name: 'moderatorComments',
    path: '/moderatorComments',
    component: ModeratorComments,
  },
  {
    name: 'moderatorViewAltAccounts',
    path: '/moderation/altAccounts',
    component: ModerationAltAccounts,
    hideFromSitemap: true,
  },
  {
    name: 'emailHistory',
    path: '/debug/emailHistory',
    component: EmailHistoryPage,
    isAdmin: true,
  },
  {
    name: 'notificationEmailPreview',
    path: '/debug/notificationEmailPreview',
    component: NotificationEmailPreviewPage,
    isAdmin: true,
  },
  {
    name: 'SpotlightsPage',
    path: '/spotlights',
    component: SpotlightsPage,
    title: 'Spotlights Page',
    hideFromSitemap: true,
  },
  {
    name: 'llmConversationsViewer',
    path: '/admin/llmConversations',
    component: LlmConversationsViewingPage,
    title: 'LLM Conversations Viewer',
    subtitle: 'LLM Conversations',
    noFooter: true,
    noIndex: true,
  }
);

addRoute(
  {
    path:'/posts/:_id/:slug/comment/:commentId?',
    name: 'comment.greaterwrong',
    component: PostsSingle,
    titleComponent: PostsPageHeaderTitle,
    previewComponent: PostCommentLinkPreviewGreaterWrong,
    noIndex: true,
    noFooter: hasPostRecommendations,
    // TODO: Handle pingbacks leading to comments.
  }
);

addRoute(
  {
    name: 'admin.curation',
    path:'/admin/curation',
    component: CurationPage,
    title: "Curation Dashboard",
    noIndex: true,
  }
);

addRoute(
  {
    name: 'allPosts',
    path: '/allPosts',
    component: AllPostsPage,
    enableResourcePrefetch: true,
    title: "All Posts",
    hasLeftNavigationColumn: true,
    navigationFooterBar: true,
  },
  {
    name: 'questions',
    path: '/questions',
    component: QuestionsPage,
    title: "All Questions",
    hasLeftNavigationColumn: true,
    navigationFooterBar: true,
  },
  {
    name: 'recommendations',
    path: '/recommendations',
    component: RecommendationsPage,
    title: "Recommendations",
  },
  {
    name: 'emailToken',
    path: '/emailToken/:token',
    component: EmailTokenPage,
  },
  {
    name: 'password-reset',
    path: '/resetPassword/:token',
    component: PasswordResetPage,
  },
  {
    name: 'nominations',
    path: '/nominations',
    redirect: () => `/reviewVoting/${REVIEW_YEAR}`,
  },
  {
    name: 'userReviewsByYear',
    path:'/users/:slug/reviews/:year',
    component: UserReviews,
    title: "User Reviews",
  },
  {
    name: 'userReplies',
    path:'/users/:slug/replies',
    component: UserCommentsReplies,
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
    component: AnnualReviewPage,
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
    component: ReviewAdminDashboard,
    title: "Review Admin Dashboard",
    isAdmin: true,
  }
);

//jargon routes
if (isLW) {
  addRoute({
    title: "Glossary Editor",
    name: 'glossaryEditor',
    path: '/glossaryEditor',
    component: GlossaryEditorPage,
  }, {
    title: "Posts with approved jargon",
    name: 'postsWithApprovedJargon',
    path: '/postsWithApprovedJargon',
    component: PostsWithApprovedJargonPage,
  });
}

if (hasKeywordAlerts) {
  addRoute(
    {
      name: "keywords",
      path: "/keywords",
      component: KeywordsPage,
      title: "Keyword alerts",
      hideFromSitemap: true,
    },
    {
      name: "keywordResults",
      path: "/keywords/:keyword",
      component: KeywordResultsPage,
      title: "Keyword results",
    },
  );
}

if (hasSurveys) {
  addRoute(
    {
      name: "surveys",
      path: "/admin/surveys",
      component: SurveyAdminPage,
      title: "Surveys",
      isAdmin: true,
    },
    {
      name: "editSurvey",
      path: "/survey/:id/edit",
      component: SurveyEditPage,
      title: "Edit survey",
      isAdmin: true,
    },
    {
      name: "newSurveySchedule",
      path: "/surveySchedule",
      component: SurveyScheduleEditPage,
      title: "New survey schedule",
      isAdmin: true,
    },
    {
      name: "editSurveySchedule",
      path: "/surveySchedule/:id",
      component: SurveyScheduleEditPage,
      title: "Edit survey schedule",
      isAdmin: true,
    },
  );
}

forumSpecificRoutes();
