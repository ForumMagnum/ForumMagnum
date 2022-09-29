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
  user: DbUser|null
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
  _id: string|null
  scoreChange: number|null
  title: string|null
  slug: string|null
}
interface CommentKarmaChange {
  _id: string|null
  scoreChange: number|null
  description: string|null
  postId: string|null
  tagSlug: string|null
}
interface RevisionsKarmaChange {
  _id: string|null
  scoreChange: number|null
  tagId: string|null
  tagSlug: string|null
  tagName: string|null
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
interface EmailPreview {
  to: string
  subject: string
  html: string
  text: string
}
interface TagUpdates {
  tag: DbTag
  revisionIds: Array<string>
  commentCount: number
  commentIds: Array<string>
  lastRevisedAt: Date
  lastCommentedAt: Date|null
  added: number
  removed: number
  users: Array<DbUser>
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
  tagDiscussed: DbTag|null
  tagSubforumCommented: DbTag|null
  tagRevised: DbRevision|null
}
interface ElicitUser {
  isQuestionCreator: boolean
  displayName: string
  _id: string
  sourceUserId: string
  lwUser: DbUser
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
  predictions: Array<ElicitPrediction|null>
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
