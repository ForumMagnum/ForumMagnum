interface AnalyticsEvent {
  type: string
  timestamp: Date
  props: any
}
interface ContentType {
  type: string|null
  data: any /*ContentTypeData*/
}
interface LoginReturnData {
  token: string|null
}
interface TagContributor {
  user: User|null
  contributionScore: number
  numCommits: number
  voteCount: number
}
interface TagContributorsList {
  contributors: Array<TagContributor>
  totalCount: number
}
interface Site {
  title: string
  url: string
  logoUrl: string|null
}
interface PostKarmaChange {
  _id: string
  scoreChange: number
  title: string
  slug: string
}
interface CommentKarmaChange {
  _id: string
  scoreChange: number
  description: string
  postId: string
  tagSlug: string
}
interface RevisionsKarmaChange {
  _id: string
  scoreChange: number
  tagId: string
  tagSlug: string
  tagName: string
}
interface KarmaChanges {
  totalChange: number
  startDate: Date
  endDate: Date
  nextBatchDate: Date
  updateFrequency: string
  posts: Array<PostKarmaChange>
  comments: Array<CommentKarmaChange>
  tagRevisions: Array<RevisionsKarmaChange>
}
interface EmailPreview {
  to: string
  subject: string
  html: string
  text: string
}
interface TagUpdates {
  tag: Tag
  revisionIds: Array<string>
  commentCount: number
  commentIds: Array<string>
  lastRevisedAt: Date
  lastCommentedAt: Date
  added: number
  removed: number
  users: Array<User>
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
  sequence: Sequence|null
  collection: Collection|null
  nextPost: Post
  numRead: number
  numTotal: number
  lastReadTime: Date
}
interface NewUserCompletedProfile {
  username: string|null
  slug: string|null
  displayName: string|null
  subscribedToDigest: boolean|null
  usernameUnset: boolean|null
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
  description: string
  id: string
  previewImage: string
  lastActivatedAt: string
  lobbyCount: number
  memberCount: number
  name: string
  roomSize: number
  sceneId: string
  type: string
  url: string
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
  tagCreated: Tag|null
  tagApplied: TagRel|null
  tagRevision: Revision|null
  tagDiscussionComment: Comment|null
}
interface AllTagsActivityFeedQueryResults {
  cutoff: Date|null
  endOffset: number
  results: Array<AllTagsActivityFeedEntryType>
}
interface AllTagsActivityFeedEntryType {
  type: string
  tagCreated: Tag|null
  tagRevision: Revision|null
  tagDiscussionComment: Comment|null
}
interface RecentDiscussionFeedQueryResults {
  cutoff: Date|null
  endOffset: number
  results: Array<RecentDiscussionFeedEntryType>
}
interface RecentDiscussionFeedEntryType {
  type: string
  postCommented: Post|null
  tagDiscussed: Tag|null
  tagSubforumCommented: Tag|null
  tagRevised: Revision|null
}
interface ElicitUser {
  isQuestionCreator: boolean
  displayName: string
  _id: string
  sourceUserId: string
  lwUser: User
}
interface ElicitPrediction {
  _id: string
  predictionId: string
  prediction: number
  createdAt: Date
  notes: string
  creator: ElicitUser
  sourceUrl: string
  sourceId: string
  binaryQuestionId: string
}
interface ElicitBlockData {
  _id: string
  title: string
  notes: string
  resolvesBy: Date
  resolution: boolean
  predictions: Array<ElicitPrediction>
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
  uniqueClientViewsSeries: Array<UniqueClientViewsSeries>
}
