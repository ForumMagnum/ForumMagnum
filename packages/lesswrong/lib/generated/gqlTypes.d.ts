interface AnalyticsEvent {
  type: string
  timestamp: Date
  props: any
}
interface LoginReturnData {
  token: string
}
interface TagContributor {
  user: User|null
  contributionScore: number
  numCommits: number
  voteCount: number
}
interface TagContributorsList {
  contributors: Array<any /*TagContributor*/>
  totalCount: number
}
interface Site {
  title: string
  url: string
  logoUrl: string
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
  posts: Array<any /*PostKarmaChange*/>
  comments: Array<any /*CommentKarmaChange*/>
  tagRevisions: Array<any /*RevisionsKarmaChange*/>
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
  migrations: Array<any /*MigrationStatus*/>
}
interface MigrationStatus {
  name: string
  dateWritten: string
  runs: Array<any /*MigrationRun*/>
  lastRun: string
}
interface MigrationRun {
  name: string
  started: Date
  finished: Date
  succeeded: boolean
}
interface EmailPreview {
  to: string
  subject: string
  html: string
  text: string
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
  username: string
  slug: string
  displayName: string
  subscribedToDigest: boolean
  usernameUnset: boolean
}
interface CoronaVirusDataRow {
  accepted: string
  imp: string
  link: string
  shortDescription: string
  url: string
  description: string
  domain: string
  type: string
  reviewerThoughts: string
  foundVia: string
  sourceLink: string
  sourceLinkDomain: string
  lastUpdated: string
  title: string
  dateAdded: string
  category: string
}
interface CoronaVirusDataSchema {
  range: string
  majorDimension: string
  values: Array<any /*CoronaVirusDataRow*/>
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
  html: string
  title: string
}
interface TagHistoryFeedQueryResults {
  cutoff: Date
  endOffset: number
  results: Array<any /*TagHistoryFeedEntryType*/>
}
interface TagHistoryFeedEntryType {
  type: string
  tagCreated: Tag|null
  tagApplied: TagRel|null
  tagRevision: Revision|null
  tagDiscussionComment: Comment|null
}
interface AllTagsActivityFeedQueryResults {
  cutoff: Date
  endOffset: number
  results: Array<any /*AllTagsActivityFeedEntryType*/>
}
interface AllTagsActivityFeedEntryType {
  type: string
  tagCreated: Tag|null
  tagRevision: Revision|null
  tagDiscussionComment: Comment|null
}
interface RecentDiscussionFeedQueryResults {
  cutoff: Date
  endOffset: number
  results: Array<any /*RecentDiscussionFeedEntryType*/>
}
interface RecentDiscussionFeedEntryType {
  type: string
  postCommented: Post|null
  tagDiscussed: Tag|null
  tagRevised: Revision|null
}
interface ElicitUser {
  isQuestionCreator: boolean
  displayName: string
  _id: string
  sourceUserId: string
  lwUser: User|null
}
interface ElicitPrediction {
  _id: string
  predictionId: string
  prediction: number
  createdAt: Date
  notes: string
  creator: any /*ElicitUser*/
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
  predictions: Array<any /*ElicitPrediction*/>
}
interface PetrovDayCheckIfIncomingData {
  launched: boolean
  createdAt: Date
}
interface PetrovDayLaunchMissileData {
  launchCode: string
  createdAt: Date
}
interface UniqueClientViewsSeries {
  uniqueClientViews: number
  date: Date
}
interface PostAnalyticsResult {
  allViews: number
  uniqueClientViews: number
  uniqueClientViews10Sec: number
  medianReadingTime: number
  uniqueClientViews5Min: number
  uniqueClientViewsSeries: Array<any /*UniqueClientViewsSeries*/>
}
