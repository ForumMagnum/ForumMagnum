interface AnalyticsEvent {
  type: string
  timestamp: Date
  props: any /*JSON*/
}
interface ContentType {
  type: string|null
  data: any /*ContentTypeData*/
}
interface TagContributor {
  user: DbUser|null
  contributionScore: number
  numCommits: number
  voteCount: number
}
interface TagContributorsList {
  contributors: Array<TagContributor>
  totalCount: number
}
interface SocialPreviewType {
  _id: string|null
  imageId: string|null
  imageUrl: string|null
  text: string|null
}
interface LoginReturnData {
  token: string|null
}
interface Site {
  title: string
  url: string
  logoUrl: string|null
}
interface PostKarmaChange {
  _id: string|null
  scoreChange: number|null
  title: string|null
  slug: string|null
  addedReacts: Array<ReactionChange>
}
interface CommentKarmaChange {
  _id: string|null
  scoreChange: number|null
  description: string|null
  postId: string|null
  tagSlug: string|null
  tagCommentType: string|null
  addedReacts: Array<ReactionChange>
}
interface RevisionsKarmaChange {
  _id: string|null
  scoreChange: number|null
  tagId: string|null
  tagSlug: string|null
  tagName: string|null
  addedReacts: Array<ReactionChange>
}
interface ReactionChange {
  reactionType: string
  userId: string|null
}
interface KarmaChanges {
  totalChange: number|null
  startDate: Date|null
  endDate: Date|null
  nextBatchDate: Date|null
  updateFrequency: string|null
  posts: Array<PostKarmaChange|null>
  comments: Array<CommentKarmaChange|null>
  tagRevisions: Array<RevisionsKarmaChange|null>
}
interface RssPostChangeInfo {
  isChanged: boolean
  newHtml: string
  htmlDiff: string
}
interface EmailPreview {
  to: string|null
  subject: string|null
  html: string|null
  text: string|null
}
interface SubforumMagicFeedQueryResults {
  cutoff: number|null
  endOffset: number
  results: Array<SubforumMagicFeedEntryType>
}
interface SubforumMagicFeedEntryType {
  type: string
  tagSubforumPosts: DbPost|null
  tagSubforumComments: DbComment|null
  tagSubforumStickyComments: DbComment|null
}
interface SubforumTopFeedQueryResults {
  cutoff: number|null
  endOffset: number
  results: Array<SubforumTopFeedEntryType>
}
interface SubforumTopFeedEntryType {
  type: string
  tagSubforumPosts: DbPost|null
  tagSubforumComments: DbComment|null
  tagSubforumStickyComments: DbComment|null
}
interface SubforumRecentCommentsFeedQueryResults {
  cutoff: Date|null
  endOffset: number
  results: Array<SubforumRecentCommentsFeedEntryType>
}
interface SubforumRecentCommentsFeedEntryType {
  type: string
  tagSubforumPosts: DbPost|null
  tagSubforumComments: DbComment|null
  tagSubforumStickyComments: DbComment|null
}
interface SubforumNewFeedQueryResults {
  cutoff: Date|null
  endOffset: number
  results: Array<SubforumNewFeedEntryType>
}
interface SubforumNewFeedEntryType {
  type: string
  tagSubforumPosts: DbPost|null
  tagSubforumComments: DbComment|null
  tagSubforumStickyComments: DbComment|null
}
interface SubforumOldFeedQueryResults {
  cutoff: Date|null
  endOffset: number
  results: Array<SubforumOldFeedEntryType>
}
interface SubforumOldFeedEntryType {
  type: string
  tagSubforumPosts: DbPost|null
  tagSubforumComments: DbComment|null
  tagSubforumStickyComments: DbComment|null
}
interface TagUpdates {
  tag: DbTag
  revisionIds: Array<string>
  commentCount: number|null
  commentIds: Array<string>
  lastRevisedAt: Date|null
  lastCommentedAt: Date|null
  added: number|null
  removed: number|null
  users: Array<DbUser>
}
interface TagWithCommentCount {
  tag: DbTag|null
  commentCount: number
}
interface ElicitUser {
  isQuestionCreator: boolean|null
  displayName: string|null
  _id: string|null
  sourceUserId: string|null
  lwUser: DbUser|null
}
interface ElicitPrediction {
  _id: string|null
  predictionId: string|null
  prediction: number|null
  createdAt: Date|null
  notes: string|null
  creator: ElicitUser|null
  sourceUrl: string|null
  sourceId: string|null
  binaryQuestionId: string|null
}
interface ElicitBlockData {
  _id: string|null
  title: string|null
  notes: string|null
  resolvesBy: Date|null
  resolution: boolean|null
  predictions: Array<ElicitPrediction|null>
}
interface MigrationsDashboardData {
  migrations: Array<MigrationStatus>
}
interface MigrationStatus {
  name: string
  dateWritten: string|null
  runs: Array<MigrationRun>
  lastRun: string|null
}
interface MigrationRun {
  name: string
  started: Date
  finished: Date|null
  succeeded: boolean|null
}
interface RecommendResumeSequence {
  sequence: DbSequence|null
  collection: DbCollection|null
  nextPost: DbPost
  numRead: number|null
  numTotal: number|null
  lastReadTime: Date|null
}
interface CommentsWithReactsResult {
  results: Array<DbComment>
}
interface PopularCommentsResult {
  results: Array<DbComment>
}
interface TopicRecommendation {
  comment: DbComment|null
  yourVote: string|null
  theirVote: string|null
  recommendationReason: string|null
}
interface NotificationCounts {
  checkedAt: Date
  unreadNotifications: number
  unreadPrivateMessages: number
  faviconBadgeNumber: number
}
interface UserReadHistoryResult {
  posts: Array<DbPost>
}
interface DigestPlannerPost {
  post: DbPost|null
  digestPost: DbDigestPost|null
  rating: number|null
}
interface DigestHighlightsResult {
  results: Array<DbPost>
}
interface DigestPostsThisWeekResult {
  results: Array<DbPost>
}
interface CuratedAndPopularThisWeekResult {
  results: Array<DbPost>
}
interface RecentlyActiveDialoguesResult {
  results: Array<DbPost>
}
interface MyDialoguesResult {
  results: Array<DbPost>
}
interface CommentCountTag {
  name: string
  comment_count: number
}
interface TopCommentedTagUser {
  _id: any /*ID*/
  username: string
  displayName: string
  total_power: number
  tag_comment_counts: Array<CommentCountTag>
}
interface UpvotedUser {
  _id: any /*ID*/
  username: string
  displayName: string
  total_power: number
  power_values: string
  vote_counts: number
  total_agreement: number
  agreement_values: string
  recently_active_matchmaking: boolean
}
interface UserDialogueUsefulData {
  dialogueUsers: Array<DbUser|null>
  topUsers: Array<UpvotedUser|null>
  activeDialogueMatchSeekers: Array<DbUser|null>
}
interface NewUserCompletedProfile {
  username: string|null
  slug: string|null
  displayName: string|null
  subscribedToDigest: boolean|null
  usernameUnset: boolean|null
}
interface MostReadTopic {
  slug: string|null
  name: string|null
  shortName: string|null
  count: number|null
}
interface TagReadLikelihoodRatio {
  tagId: string|null
  tagName: string|null
  tagShortName: string|null
  userReadCount: number|null
  readLikelihoodRatio: number|null
}
interface MostReadAuthor {
  _id: string|null
  slug: string|null
  displayName: string|null
  profileImageId: string|null
  count: number|null
  engagementPercentile: number|null
}
interface TopCommentContents {
  html: string|null
}
interface TopComment {
  _id: string|null
  postedAt: Date|null
  postId: string|null
  postTitle: string|null
  postSlug: string|null
  baseScore: number|null
  extendedScore: any /*JSON*/
  contents: TopCommentContents|null
}
interface MostReceivedReact {
  name: string|null
  count: number|null
}
interface CombinedKarmaVals {
  date: Date
  postKarma: number
  commentKarma: number
}
interface WrappedDataByYear {
  engagementPercentile: number|null
  postsReadCount: number|null
  totalSeconds: number|null
  daysVisited: Array<string|null>
  mostReadTopics: Array<MostReadTopic|null>
  relativeMostReadCoreTopics: Array<TagReadLikelihoodRatio|null>
  mostReadAuthors: Array<MostReadAuthor|null>
  topPosts: Array<DbPost|null>
  postCount: number|null
  authorPercentile: number|null
  topComment: TopComment|null
  commentCount: number|null
  commenterPercentile: number|null
  topShortform: DbComment|null
  shortformCount: number|null
  shortformPercentile: number|null
  karmaChange: number|null
  combinedKarmaVals: Array<CombinedKarmaVals|null>
  mostReceivedReacts: Array<MostReceivedReact|null>
}
interface CoronaVirusDataRow {
  accepted: string|null
  imp: string|null
  link: string|null
  shortDescription: string|null
  url: string|null
  description: string|null
  domain: string|null
  type: string|null
  reviewerThoughts: string|null
  foundVia: string|null
  sourceLink: string|null
  sourceLinkDomain: string|null
  lastUpdated: string|null
  title: string|null
  dateAdded: string|null
  category: string|null
}
interface CoronaVirusDataSchema {
  range: string|null
  majorDimension: string|null
  values: Array<CoronaVirusDataRow>
}
interface MozillaHubsData {
  description: string|null
  id: string|null
  previewImage: string|null
  lastActivatedAt: string|null
  lobbyCount: number|null
  memberCount: number|null
  name: string|null
  roomSize: number|null
  sceneId: string|null
  type: string|null
  url: string|null
}
interface ArbitalPageData {
  html: string|null
  title: string|null
}
interface TagHistoryFeedQueryResults {
  cutoff: Date|null
  endOffset: number
  results: Array<TagHistoryFeedEntryType>
}
interface TagHistoryFeedEntryType {
  type: string
  tagCreated: DbTag|null
  tagApplied: DbTagRel|null
  tagRevision: DbRevision|null
  tagDiscussionComment: DbComment|null
}
interface AllTagsActivityFeedQueryResults {
  cutoff: Date|null
  endOffset: number
  results: Array<AllTagsActivityFeedEntryType>
}
interface AllTagsActivityFeedEntryType {
  type: string
  tagCreated: DbTag|null
  tagRevision: DbRevision|null
  tagDiscussionComment: DbComment|null
}
interface RecentDiscussionFeedQueryResults {
  cutoff: Date|null
  endOffset: number
  results: Array<RecentDiscussionFeedEntryType>
}
interface RecentDiscussionFeedEntryType {
  type: string
  postCommented: DbPost|null
  shortformCommented: DbPost|null
  tagDiscussed: DbTag|null
  tagRevised: DbRevision|null
}
interface GivingSeasonHeart {
  userId: string
  displayName: string
  x: number
  y: number
  theta: number
}
interface PetrovDayCheckIfIncomingData {
  launched: boolean|null
  createdAt: Date|null
}
interface PetrovDayLaunchMissileData {
  launchCode: string|null
  createdAt: Date|null
}
interface UniqueClientViewsSeries {
  uniqueClientViews: number|null
  date: Date|null
}
interface PostAnalyticsResult {
  allViews: number|null
  uniqueClientViews: number|null
  uniqueClientViews10Sec: number|null
  medianReadingTime: number|null
  uniqueClientViews5Min: number|null
  uniqueClientViewsSeries: Array<UniqueClientViewsSeries|null>
}
interface PostAnalytics2Result {
  _id: string|null
  title: string|null
  slug: string|null
  postedAt: Date|null
  views: number|null
  uniqueViews: number|null
  reads: number|null
  meanReadingTime: number|null
  karma: number|null
  comments: number|null
}
interface MultiPostAnalyticsResult {
  posts: Array<PostAnalytics2Result|null>
  totalCount: number
}
interface AnalyticsSeriesValue {
  date: Date|null
  views: number|null
  reads: number|null
  karma: number|null
  comments: number|null
}
interface ModeratorIPAddressInfo {
  ip: string
  userIds: Array<string>
}
interface VoteResultElectionCandidate {
  document: DbElectionCandidate
  showVotingPatternWarning: boolean
}
interface VoteResultTagRel {
  document: DbTagRel
  showVotingPatternWarning: boolean
}
interface VoteResultPost {
  document: DbPost
  showVotingPatternWarning: boolean
}
interface VoteResultRevision {
  document: DbRevision
  showVotingPatternWarning: boolean
}
interface VoteResultComment {
  document: DbComment
  showVotingPatternWarning: boolean
}
