export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  ContentTypeData: { input: any; output: any; }
  Date: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type AdvisorRequest = {
  __typename?: 'AdvisorRequest';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  interestedInMetaculus: Maybe<Scalars['Boolean']['output']>;
  jobAds: Maybe<Scalars['JSON']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum AdvisorRequestOrderByInput {
  Foobar = 'foobar'
}

export type AdvisorRequestOutput = {
  __typename?: 'AdvisorRequestOutput';
  data: Maybe<AdvisorRequest>;
};

export type AdvisorRequestSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<AdvisorRequestSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<AdvisorRequestSelectorInput>>>;
};

export type AdvisorRequestSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type AllTagsActivityFeedEntryType = {
  __typename?: 'AllTagsActivityFeedEntryType';
  tagCreated: Maybe<Tag>;
  tagDiscussionComment: Maybe<Comment>;
  tagRevision: Maybe<Revision>;
  type: Scalars['String']['output'];
};

export type AllTagsActivityFeedQueryResults = {
  __typename?: 'AllTagsActivityFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<AllTagsActivityFeedEntryType>>;
};

export type AnalyticsSeriesValue = {
  __typename?: 'AnalyticsSeriesValue';
  comments: Maybe<Scalars['Int']['output']>;
  date: Maybe<Scalars['Date']['output']>;
  karma: Maybe<Scalars['Int']['output']>;
  reads: Maybe<Scalars['Int']['output']>;
  views: Maybe<Scalars['Int']['output']>;
};

export type ArbitalCaches = {
  __typename?: 'ArbitalCaches';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum ArbitalCachesOrderByInput {
  Foobar = 'foobar'
}

export type ArbitalCachesOutput = {
  __typename?: 'ArbitalCachesOutput';
  data: Maybe<ArbitalCaches>;
};

export type ArbitalCachesSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ArbitalCachesSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ArbitalCachesSelectorInput>>>;
};

export type ArbitalCachesSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ArbitalLinkedPage = {
  __typename?: 'ArbitalLinkedPage';
  _id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type ArbitalLinkedPages = {
  __typename?: 'ArbitalLinkedPages';
  children: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  faster: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  lessTechnical: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  moreTechnical: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  parents: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  requirements: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  slower: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  teaches: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
};

export type ArbitalPageData = {
  __typename?: 'ArbitalPageData';
  html: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type ArbitalTagContentRel = {
  __typename?: 'ArbitalTagContentRel';
  _id: Scalars['String']['output'];
  childCollectionName: Maybe<Scalars['String']['output']>;
  childDocumentId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  isStrong: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  level: Maybe<Scalars['Float']['output']>;
  parentCollectionName: Maybe<Scalars['String']['output']>;
  parentDocumentId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

export enum ArbitalTagContentRelOrderByInput {
  Foobar = 'foobar'
}

export type ArbitalTagContentRelOutput = {
  __typename?: 'ArbitalTagContentRelOutput';
  data: Maybe<ArbitalTagContentRel>;
};

export type ArbitalTagContentRelSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ArbitalTagContentRelSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ArbitalTagContentRelSelectorInput>>>;
};

export type ArbitalTagContentRelSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type AutosaveContentType = {
  type: InputMaybe<Scalars['String']['input']>;
  value: InputMaybe<Scalars['ContentTypeData']['input']>;
};

export type Ban = {
  __typename?: 'Ban';
  _id: Scalars['String']['output'];
  comment: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  expirationDate: Maybe<Scalars['Date']['output']>;
  ip: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  properties: Maybe<Scalars['JSON']['output']>;
  reason: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum BanOrderByInput {
  Foobar = 'foobar'
}

export type BanOutput = {
  __typename?: 'BanOutput';
  data: Maybe<Ban>;
};

export type BanSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<BanSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<BanSelectorInput>>>;
};

export type BanSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Book = {
  __typename?: 'Book';
  _id: Scalars['String']['output'];
  collectionId: Maybe<Scalars['String']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  displaySequencesAsGrid: Maybe<Scalars['Boolean']['output']>;
  hideProgressBar: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  number: Maybe<Scalars['Float']['output']>;
  postIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  postedAt: Maybe<Scalars['Date']['output']>;
  posts: Array<Post>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  sequenceIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  sequences: Array<Sequence>;
  showChapters: Maybe<Scalars['Boolean']['output']>;
  subtitle: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  tocTitle: Maybe<Scalars['String']['output']>;
};


export type BookContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum BookOrderByInput {
  Foobar = 'foobar'
}

export type BookOutput = {
  __typename?: 'BookOutput';
  data: Maybe<Book>;
};

export type BookSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<BookSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<BookSelectorInput>>>;
};

export type BookSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Chapter = {
  __typename?: 'Chapter';
  _id: Scalars['String']['output'];
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  number: Maybe<Scalars['Float']['output']>;
  postIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  posts: Array<Post>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  sequence: Sequence;
  sequenceId: Maybe<Scalars['String']['output']>;
  subtitle: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};


export type ChapterContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum ChapterOrderByInput {
  Foobar = 'foobar'
}

export type ChapterOutput = {
  __typename?: 'ChapterOutput';
  data: Maybe<Chapter>;
};

export type ChapterSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ChapterSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ChapterSelectorInput>>>;
};

export type ChapterSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type CkEditorUserSession = {
  __typename?: 'CkEditorUserSession';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  endedAt: Maybe<Scalars['Date']['output']>;
  endedBy: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum CkEditorUserSessionOrderByInput {
  Foobar = 'foobar'
}

export type CkEditorUserSessionOutput = {
  __typename?: 'CkEditorUserSessionOutput';
  data: Maybe<CkEditorUserSession>;
};

export type CkEditorUserSessionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<CkEditorUserSessionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<CkEditorUserSessionSelectorInput>>>;
};

export type CkEditorUserSessionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ClientId = {
  __typename?: 'ClientId';
  _id: Scalars['String']['output'];
  clientId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  firstSeenLandingPage: Maybe<Scalars['String']['output']>;
  firstSeenReferrer: Maybe<Scalars['String']['output']>;
  invalidated: Maybe<Scalars['Boolean']['output']>;
  lastSeenAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  timesSeen: Maybe<Scalars['Float']['output']>;
  userIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  users: Array<User>;
};

export enum ClientIdOrderByInput {
  Foobar = 'foobar'
}

export type ClientIdOutput = {
  __typename?: 'ClientIdOutput';
  data: Maybe<ClientId>;
};

export type ClientIdSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ClientIdSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ClientIdSelectorInput>>>;
};

export type ClientIdSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type CoauthorStatus = {
  __typename?: 'CoauthorStatus';
  confirmed: Maybe<Scalars['Boolean']['output']>;
  requested: Maybe<Scalars['Boolean']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type Collection = {
  __typename?: 'Collection';
  _id: Scalars['String']['output'];
  books: Maybe<Array<Maybe<Book>>>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  firstPageLink: Maybe<Scalars['String']['output']>;
  gridImageId: Maybe<Scalars['String']['output']>;
  hideStartReadingButton: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  noindex: Maybe<Scalars['Boolean']['output']>;
  postsCount: Scalars['Int']['output'];
  readPostsCount: Scalars['Int']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};


export type CollectionContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum CollectionOrderByInput {
  Foobar = 'foobar'
}

export type CollectionOutput = {
  __typename?: 'CollectionOutput';
  data: Maybe<Collection>;
};

export type CollectionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<CollectionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<CollectionSelectorInput>>>;
};

export type CollectionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type CombinedKarmaVals = {
  __typename?: 'CombinedKarmaVals';
  commentKarma: Scalars['Int']['output'];
  date: Scalars['Date']['output'];
  postKarma: Scalars['Int']['output'];
};

export type Comment = {
  __typename?: 'Comment';
  _id: Scalars['String']['output'];
  af: Maybe<Scalars['Boolean']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afDate: Maybe<Scalars['Date']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
  agentFoundationsId: Maybe<Scalars['String']['output']>;
  allVotes: Maybe<Array<Maybe<Vote>>>;
  answer: Maybe<Scalars['Boolean']['output']>;
  author: Maybe<Scalars['String']['output']>;
  authorIsUnreviewed: Maybe<Scalars['Boolean']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  debateResponse: Maybe<Scalars['Boolean']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  deletedByUser: Maybe<User>;
  deletedByUserId: Maybe<Scalars['String']['output']>;
  deletedDate: Maybe<Scalars['Date']['output']>;
  deletedPublic: Maybe<Scalars['Boolean']['output']>;
  deletedReason: Maybe<Scalars['String']['output']>;
  descendentCount: Maybe<Scalars['Float']['output']>;
  directChildrenCount: Maybe<Scalars['Float']['output']>;
  emojiReactors: Maybe<Scalars['JSON']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  forumEvent: Maybe<ForumEvent>;
  forumEventId: Maybe<Scalars['String']['output']>;
  forumEventMetadata: Maybe<Scalars['JSON']['output']>;
  hideAuthor: Maybe<Scalars['Boolean']['output']>;
  hideKarma: Maybe<Scalars['Boolean']['output']>;
  hideModeratorHat: Maybe<Scalars['Boolean']['output']>;
  htmlBody: Maybe<Scalars['String']['output']>;
  isPinnedOnProfile: Maybe<Scalars['Boolean']['output']>;
  lastEditedAt: Maybe<Scalars['Date']['output']>;
  lastSubthreadActivity: Maybe<Scalars['Date']['output']>;
  latestChildren: Maybe<Array<Maybe<Comment>>>;
  legacy: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  legacyId: Maybe<Scalars['String']['output']>;
  legacyParentId: Maybe<Scalars['String']['output']>;
  legacyPoll: Maybe<Scalars['Boolean']['output']>;
  modGPTAnalysis: Maybe<Scalars['String']['output']>;
  modGPTRecommendation: Maybe<Scalars['String']['output']>;
  moderatorHat: Maybe<Scalars['Boolean']['output']>;
  moveToAlignmentUser: Maybe<User>;
  moveToAlignmentUserId: Maybe<Scalars['String']['output']>;
  needsReview: Maybe<Scalars['Boolean']['output']>;
  nominatedForReview: Maybe<Scalars['String']['output']>;
  originalDialogue: Maybe<Post>;
  originalDialogueId: Maybe<Scalars['String']['output']>;
  pageUrl: Maybe<Scalars['String']['output']>;
  pageUrlRelative: Maybe<Scalars['String']['output']>;
  parentAnswer: Maybe<Comment>;
  parentAnswerId: Maybe<Scalars['String']['output']>;
  parentComment: Maybe<Comment>;
  parentCommentId: Maybe<Scalars['String']['output']>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  post: Maybe<Post>;
  postId: Maybe<Scalars['String']['output']>;
  postVersion: Maybe<Scalars['String']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
  promoted: Maybe<Scalars['Boolean']['output']>;
  promotedAt: Maybe<Scalars['Date']['output']>;
  promotedByUser: Maybe<User>;
  promotedByUserId: Maybe<Scalars['String']['output']>;
  referrer: Maybe<Scalars['String']['output']>;
  rejected: Maybe<Scalars['Boolean']['output']>;
  rejectedByUser: Maybe<User>;
  rejectedByUserId: Maybe<Scalars['String']['output']>;
  rejectedReason: Maybe<Scalars['String']['output']>;
  relevantTagIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  relevantTags: Array<Tag>;
  repliesBlockedUntil: Maybe<Scalars['Date']['output']>;
  retracted: Maybe<Scalars['Boolean']['output']>;
  reviewForAlignmentUserId: Maybe<Scalars['String']['output']>;
  reviewedByUser: Maybe<User>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  reviewingForReview: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  shortform: Maybe<Scalars['Boolean']['output']>;
  shortformFrontpage: Maybe<Scalars['Boolean']['output']>;
  spam: Maybe<Scalars['Boolean']['output']>;
  subforumStickyPriority: Maybe<Scalars['Float']['output']>;
  suggestForAlignmentUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  suggestForAlignmentUsers: Array<User>;
  tag: Maybe<Tag>;
  tagCommentType: Maybe<Scalars['String']['output']>;
  tagId: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  topLevelComment: Maybe<Comment>;
  topLevelCommentId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userAgent: Maybe<Scalars['String']['output']>;
  userIP: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  votingSystem: Scalars['String']['output'];
  wordCount: Maybe<Scalars['Int']['output']>;
};


export type CommentContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type CommentCountTag = {
  __typename?: 'CommentCountTag';
  comment_count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type CommentKarmaChange = {
  __typename?: 'CommentKarmaChange';
  _id: Maybe<Scalars['String']['output']>;
  addedReacts: Maybe<Array<ReactionChange>>;
  commentId: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  eaAddedReacts: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  postSlug: Maybe<Scalars['String']['output']>;
  postTitle: Maybe<Scalars['String']['output']>;
  scoreChange: Maybe<Scalars['Int']['output']>;
  tagCommentType: Maybe<Scalars['String']['output']>;
  tagName: Maybe<Scalars['String']['output']>;
  tagSlug: Maybe<Scalars['String']['output']>;
};

export type CommentModeratorAction = {
  __typename?: 'CommentModeratorAction';
  _id: Scalars['String']['output'];
  active: Scalars['Boolean']['output'];
  comment: Comment;
  commentId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  endedAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

export enum CommentModeratorActionOrderByInput {
  Foobar = 'foobar'
}

export type CommentModeratorActionOutput = {
  __typename?: 'CommentModeratorActionOutput';
  data: Maybe<CommentModeratorAction>;
};

export type CommentModeratorActionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<CommentModeratorActionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<CommentModeratorActionSelectorInput>>>;
};

export type CommentModeratorActionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export enum CommentOrderByInput {
  Foobar = 'foobar'
}

export type CommentOutput = {
  __typename?: 'CommentOutput';
  data: Maybe<Comment>;
};

export type CommentSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<CommentSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<CommentSelectorInput>>>;
};

export type CommentSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type CommentsWithReactsResult = {
  __typename?: 'CommentsWithReactsResult';
  results: Array<Comment>;
};

export type ContentType = {
  __typename?: 'ContentType';
  data: Maybe<Scalars['ContentTypeData']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

export type Conversation = {
  __typename?: 'Conversation';
  _id: Scalars['String']['output'];
  af: Maybe<Scalars['Boolean']['output']>;
  archivedBy: Array<User>;
  archivedByIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  createdAt: Maybe<Scalars['Date']['output']>;
  hasUnreadMessages: Maybe<Scalars['Boolean']['output']>;
  latestActivity: Maybe<Scalars['Date']['output']>;
  latestMessage: Maybe<Message>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  messageCount: Maybe<Scalars['Float']['output']>;
  moderator: Maybe<Scalars['Boolean']['output']>;
  participantIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  participants: Array<User>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export enum ConversationOrderByInput {
  Foobar = 'foobar'
}

export type ConversationOutput = {
  __typename?: 'ConversationOutput';
  data: Maybe<Conversation>;
};

export type ConversationSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ConversationSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ConversationSelectorInput>>>;
};

export type ConversationSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type CoronaVirusDataRow = {
  __typename?: 'CoronaVirusDataRow';
  accepted: Maybe<Scalars['String']['output']>;
  category: Maybe<Scalars['String']['output']>;
  dateAdded: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  domain: Maybe<Scalars['String']['output']>;
  foundVia: Maybe<Scalars['String']['output']>;
  imp: Maybe<Scalars['String']['output']>;
  lastUpdated: Maybe<Scalars['String']['output']>;
  link: Maybe<Scalars['String']['output']>;
  reviewerThoughts: Maybe<Scalars['String']['output']>;
  shortDescription: Maybe<Scalars['String']['output']>;
  sourceLink: Maybe<Scalars['String']['output']>;
  sourceLinkDomain: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

export type CoronaVirusDataSchema = {
  __typename?: 'CoronaVirusDataSchema';
  majorDimension: Maybe<Scalars['String']['output']>;
  range: Maybe<Scalars['String']['output']>;
  values: Maybe<Array<CoronaVirusDataRow>>;
};

export type CreateAdvisorRequestDataInput = {
  interestedInMetaculus: InputMaybe<Scalars['Boolean']['input']>;
  jobAds: InputMaybe<Scalars['JSON']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateAdvisorRequestInput = {
  data: CreateAdvisorRequestDataInput;
};

export type CreateArbitalCachesDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateArbitalCachesInput = {
  data: CreateArbitalCachesDataInput;
};

export type CreateArbitalTagContentRelDataInput = {
  childCollectionName: Scalars['String']['input'];
  childDocumentId: Scalars['String']['input'];
  isStrong: Scalars['Boolean']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  level: Scalars['Float']['input'];
  parentCollectionName: Scalars['String']['input'];
  parentDocumentId: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CreateArbitalTagContentRelInput = {
  data: CreateArbitalTagContentRelDataInput;
};

export type CreateBanDataInput = {
  comment: InputMaybe<Scalars['String']['input']>;
  expirationDate: Scalars['Date']['input'];
  ip: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  properties: InputMaybe<Scalars['JSON']['input']>;
  reason: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateBanInput = {
  data: CreateBanDataInput;
};

export type CreateBookDataInput = {
  collectionId: Scalars['String']['input'];
  contents: InputMaybe<Scalars['JSON']['input']>;
  displaySequencesAsGrid: InputMaybe<Scalars['Boolean']['input']>;
  hideProgressBar: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  number: InputMaybe<Scalars['Float']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sequenceIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  showChapters: InputMaybe<Scalars['Boolean']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  tocTitle: InputMaybe<Scalars['String']['input']>;
};

export type CreateBookInput = {
  data: CreateBookDataInput;
};

export type CreateChapterDataInput = {
  contents: InputMaybe<Scalars['JSON']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  number: InputMaybe<Scalars['Float']['input']>;
  postIds: Array<InputMaybe<Scalars['String']['input']>>;
  sequenceId: InputMaybe<Scalars['String']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type CreateChapterInput = {
  data: CreateChapterDataInput;
};

export type CreateCkEditorUserSessionDataInput = {
  documentId: Scalars['String']['input'];
  endedAt: InputMaybe<Scalars['Date']['input']>;
  endedBy: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateCkEditorUserSessionInput = {
  data: CreateCkEditorUserSessionDataInput;
};

export type CreateClientIdDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateClientIdInput = {
  data: CreateClientIdDataInput;
};

export type CreateCollectionDataInput = {
  contents: InputMaybe<Scalars['JSON']['input']>;
  createdAt: InputMaybe<Scalars['Date']['input']>;
  firstPageLink: InputMaybe<Scalars['String']['input']>;
  gridImageId: InputMaybe<Scalars['String']['input']>;
  hideStartReadingButton: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateCollectionInput = {
  data: CreateCollectionDataInput;
};

export type CreateCommentDataInput = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  afDate: InputMaybe<Scalars['Date']['input']>;
  agentFoundationsId: InputMaybe<Scalars['String']['input']>;
  answer: InputMaybe<Scalars['Boolean']['input']>;
  authorIsUnreviewed: InputMaybe<Scalars['Boolean']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  debateResponse: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  deletedByUserId: InputMaybe<Scalars['String']['input']>;
  deletedDate: InputMaybe<Scalars['Date']['input']>;
  deletedPublic: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason: InputMaybe<Scalars['String']['input']>;
  forumEventId: InputMaybe<Scalars['String']['input']>;
  forumEventMetadata: InputMaybe<Scalars['JSON']['input']>;
  hideKarma: InputMaybe<Scalars['Boolean']['input']>;
  hideModeratorHat: InputMaybe<Scalars['Boolean']['input']>;
  isPinnedOnProfile: InputMaybe<Scalars['Boolean']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  legacyParentId: InputMaybe<Scalars['String']['input']>;
  legacyPoll: InputMaybe<Scalars['Boolean']['input']>;
  modGPTAnalysis: InputMaybe<Scalars['String']['input']>;
  modGPTRecommendation: InputMaybe<Scalars['String']['input']>;
  moderatorHat: InputMaybe<Scalars['Boolean']['input']>;
  needsReview: InputMaybe<Scalars['Boolean']['input']>;
  nominatedForReview: InputMaybe<Scalars['String']['input']>;
  originalDialogueId: InputMaybe<Scalars['String']['input']>;
  parentAnswerId: InputMaybe<Scalars['String']['input']>;
  parentCommentId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  promotedByUserId: InputMaybe<Scalars['String']['input']>;
  rejected: InputMaybe<Scalars['Boolean']['input']>;
  rejectedByUserId: InputMaybe<Scalars['String']['input']>;
  rejectedReason: InputMaybe<Scalars['String']['input']>;
  relevantTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  retracted: InputMaybe<Scalars['Boolean']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  reviewingForReview: InputMaybe<Scalars['String']['input']>;
  shortform: InputMaybe<Scalars['Boolean']['input']>;
  shortformFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  spam: InputMaybe<Scalars['Boolean']['input']>;
  subforumStickyPriority: InputMaybe<Scalars['Float']['input']>;
  tagCommentType: InputMaybe<Scalars['String']['input']>;
  tagId: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  topLevelCommentId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateCommentInput = {
  data: CreateCommentDataInput;
};

export type CreateCommentModeratorActionDataInput = {
  commentId: InputMaybe<Scalars['String']['input']>;
  endedAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  type: Scalars['String']['input'];
};

export type CreateCommentModeratorActionInput = {
  data: CreateCommentModeratorActionDataInput;
};

export type CreateConversationDataInput = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  archivedByIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  moderator: InputMaybe<Scalars['Boolean']['input']>;
  participantIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type CreateConversationInput = {
  data: CreateConversationDataInput;
};

export type CreateCronHistoryDataInput = {
  _id: Scalars['String']['input'];
  finishedAt: InputMaybe<Scalars['Date']['input']>;
  intendedAt: Scalars['Date']['input'];
  name: Scalars['String']['input'];
  result: InputMaybe<Scalars['JSON']['input']>;
  startedAt: Scalars['Date']['input'];
};

export type CreateCronHistoryInput = {
  data: CreateCronHistoryDataInput;
};

export type CreateCurationEmailDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateCurationEmailInput = {
  data: CreateCurationEmailDataInput;
};

export type CreateCurationNoticeDataInput = {
  commentId: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateCurationNoticeInput = {
  data: CreateCurationNoticeDataInput;
};

export type CreateDatabaseMetadataDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateDatabaseMetadataInput = {
  data: CreateDatabaseMetadataDataInput;
};

export type CreateDebouncerEventsDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateDebouncerEventsInput = {
  data: CreateDebouncerEventsDataInput;
};

export type CreateDialogueCheckDataInput = {
  checked: Scalars['Boolean']['input'];
  checkedAt: Scalars['Date']['input'];
  hideInRecommendations: Scalars['Boolean']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  targetUserId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateDialogueCheckInput = {
  data: CreateDialogueCheckDataInput;
};

export type CreateDialogueMatchPreferenceDataInput = {
  asyncPreference: Scalars['String']['input'];
  calendlyLink: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  dialogueCheckId: Scalars['String']['input'];
  formatNotes: Scalars['String']['input'];
  generatedDialogueId: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  syncPreference: Scalars['String']['input'];
  topicNotes: Scalars['String']['input'];
  topicPreferences: Array<InputMaybe<Scalars['JSON']['input']>>;
};

export type CreateDialogueMatchPreferenceInput = {
  data: CreateDialogueMatchPreferenceDataInput;
};

export type CreateDigestDataInput = {
  endDate: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  num: Scalars['Float']['input'];
  onsiteImageId: InputMaybe<Scalars['String']['input']>;
  onsitePrimaryColor: InputMaybe<Scalars['String']['input']>;
  publishedDate: InputMaybe<Scalars['Date']['input']>;
  startDate: Scalars['Date']['input'];
};

export type CreateDigestInput = {
  data: CreateDigestDataInput;
};

export type CreateDigestPostDataInput = {
  digestId: Scalars['String']['input'];
  emailDigestStatus: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  onsiteDigestStatus: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};

export type CreateDigestPostInput = {
  data: CreateDigestPostDataInput;
};

export type CreateElectionCandidateDataInput = {
  amountRaised: InputMaybe<Scalars['Float']['input']>;
  description: Scalars['String']['input'];
  electionName: Scalars['String']['input'];
  fundraiserLink: InputMaybe<Scalars['String']['input']>;
  gwwcId: InputMaybe<Scalars['String']['input']>;
  gwwcLink: InputMaybe<Scalars['String']['input']>;
  href: Scalars['String']['input'];
  isElectionFundraiser: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  logoSrc: Scalars['String']['input'];
  name: Scalars['String']['input'];
  tagId: Scalars['String']['input'];
  targetAmount: InputMaybe<Scalars['Float']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateElectionCandidateInput = {
  data: CreateElectionCandidateDataInput;
};

export type CreateElectionVoteDataInput = {
  compareState: InputMaybe<Scalars['JSON']['input']>;
  electionName: Scalars['String']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  submissionComments: InputMaybe<Scalars['JSON']['input']>;
  submittedAt: InputMaybe<Scalars['Date']['input']>;
  userExplanation: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
  userOtherComments: InputMaybe<Scalars['String']['input']>;
  vote: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateElectionVoteInput = {
  data: CreateElectionVoteDataInput;
};

export type CreateElicitQuestionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  resolution: InputMaybe<Scalars['String']['input']>;
  resolvesBy: InputMaybe<Scalars['Date']['input']>;
  title: Scalars['String']['input'];
};

export type CreateElicitQuestionInput = {
  data: CreateElicitQuestionDataInput;
};

export type CreateElicitQuestionPredictionDataInput = {
  _id: Scalars['String']['input'];
  binaryQuestionId: Scalars['String']['input'];
  createdAt: Scalars['Date']['input'];
  creator: Scalars['JSON']['input'];
  isDeleted: Scalars['Boolean']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  prediction: InputMaybe<Scalars['Float']['input']>;
  sourceId: InputMaybe<Scalars['String']['input']>;
  sourceUrl: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateElicitQuestionPredictionInput = {
  data: CreateElicitQuestionPredictionDataInput;
};

export type CreateEmailTokensDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateEmailTokensInput = {
  data: CreateEmailTokensDataInput;
};

export type CreateFeaturedResourceDataInput = {
  body: Scalars['String']['input'];
  ctaText: Scalars['String']['input'];
  ctaUrl: Scalars['String']['input'];
  expiresAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  title: Scalars['String']['input'];
};

export type CreateFeaturedResourceInput = {
  data: CreateFeaturedResourceDataInput;
};

export type CreateFieldChangeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateFieldChangeInput = {
  data: CreateFieldChangeDataInput;
};

export type CreateForumEventDataInput = {
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  bannerTextColor: Scalars['String']['input'];
  commentPrompt: InputMaybe<Scalars['String']['input']>;
  contrastColor: InputMaybe<Scalars['String']['input']>;
  customComponent: InputMaybe<Scalars['String']['input']>;
  darkColor: Scalars['String']['input'];
  endDate: Scalars['Date']['input'];
  eventFormat: InputMaybe<Scalars['String']['input']>;
  frontpageDescription: InputMaybe<Scalars['JSON']['input']>;
  frontpageDescriptionMobile: InputMaybe<Scalars['JSON']['input']>;
  includesPoll: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  lightColor: Scalars['String']['input'];
  maxStickersPerUser: InputMaybe<Scalars['Float']['input']>;
  pollAgreeWording: InputMaybe<Scalars['String']['input']>;
  pollDisagreeWording: InputMaybe<Scalars['String']['input']>;
  pollQuestion: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  postPageDescription: InputMaybe<Scalars['JSON']['input']>;
  publicData: InputMaybe<Scalars['JSON']['input']>;
  startDate: Scalars['Date']['input'];
  tagId: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreateForumEventInput = {
  data: CreateForumEventDataInput;
};

export type CreateGardenCodeDataInput = {
  afOnly: InputMaybe<Scalars['Boolean']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  fbLink: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  startTime: InputMaybe<Scalars['Date']['input']>;
  title: Scalars['String']['input'];
  type: InputMaybe<Scalars['String']['input']>;
};

export type CreateGardenCodeInput = {
  data: CreateGardenCodeDataInput;
};

export type CreateGoogleServiceAccountSessionDataInput = {
  active: Scalars['Boolean']['input'];
  email: Scalars['String']['input'];
  estimatedExpiry: Scalars['Date']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  refreshToken: Scalars['String']['input'];
  revoked: Scalars['Boolean']['input'];
};

export type CreateGoogleServiceAccountSessionInput = {
  data: CreateGoogleServiceAccountSessionDataInput;
};

export type CreateImagesDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateImagesInput = {
  data: CreateImagesDataInput;
};

export type CreateJargonTermDataInput = {
  altTerms: Array<InputMaybe<Scalars['String']['input']>>;
  approved: InputMaybe<Scalars['Boolean']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  term: Scalars['String']['input'];
};

export type CreateJargonTermInput = {
  data: CreateJargonTermDataInput;
};

export type CreateLwEventDataInput = {
  documentId: InputMaybe<Scalars['String']['input']>;
  important: InputMaybe<Scalars['Boolean']['input']>;
  intercom: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  properties: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateLwEventInput = {
  data: CreateLwEventDataInput;
};

export type CreateLegacyDataDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateLegacyDataInput = {
  data: CreateLegacyDataDataInput;
};

export type CreateLlmConversationDataInput = {
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  model: Scalars['String']['input'];
  systemPrompt: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateLlmConversationInput = {
  data: CreateLlmConversationDataInput;
};

export type CreateLlmMessageDataInput = {
  content: Scalars['String']['input'];
  conversationId: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  role: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateLlmMessageInput = {
  data: CreateLlmMessageDataInput;
};

export type CreateLocalgroupDataInput = {
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contactInfo: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  facebookLink: InputMaybe<Scalars['String']['input']>;
  facebookPageLink: InputMaybe<Scalars['String']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  inactive: InputMaybe<Scalars['Boolean']['input']>;
  isOnline: InputMaybe<Scalars['Boolean']['input']>;
  lastActivity: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  meetupLink: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  nameInAnotherLanguage: InputMaybe<Scalars['String']['input']>;
  organizerIds: Array<InputMaybe<Scalars['String']['input']>>;
  slackLink: InputMaybe<Scalars['String']['input']>;
  types: Array<InputMaybe<Scalars['String']['input']>>;
  website: InputMaybe<Scalars['String']['input']>;
};

export type CreateLocalgroupInput = {
  data: CreateLocalgroupDataInput;
};

export type CreateManifoldProbabilitiesCacheDataInput = {
  isResolved: Scalars['Boolean']['input'];
  lastUpdated: Scalars['Date']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  marketId: Scalars['String']['input'];
  probability: Scalars['Float']['input'];
  url: InputMaybe<Scalars['String']['input']>;
  year: Scalars['Float']['input'];
};

export type CreateManifoldProbabilitiesCacheInput = {
  data: CreateManifoldProbabilitiesCacheDataInput;
};

export type CreateMessageDataInput = {
  contents: InputMaybe<Scalars['JSON']['input']>;
  conversationId: Scalars['String']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  noEmail: InputMaybe<Scalars['Boolean']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateMessageInput = {
  data: CreateMessageDataInput;
};

export type CreateMigrationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateMigrationInput = {
  data: CreateMigrationDataInput;
};

export type CreateModerationTemplateDataInput = {
  collectionName: Scalars['String']['input'];
  contents: InputMaybe<Scalars['JSON']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  order: InputMaybe<Scalars['Float']['input']>;
};

export type CreateModerationTemplateInput = {
  data: CreateModerationTemplateDataInput;
};

export type CreateModeratorActionDataInput = {
  endedAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  type: Scalars['String']['input'];
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateModeratorActionInput = {
  data: CreateModeratorActionDataInput;
};

export type CreateMultiDocumentDataInput = {
  collectionName: Scalars['String']['input'];
  contents: InputMaybe<Scalars['JSON']['input']>;
  fieldName: Scalars['String']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  parentDocumentId: Scalars['String']['input'];
  tabSubtitle: InputMaybe<Scalars['String']['input']>;
  tabTitle: Scalars['String']['input'];
  title: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateMultiDocumentInput = {
  data: CreateMultiDocumentDataInput;
};

export type CreateNotificationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  viewed: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateNotificationInput = {
  data: CreateNotificationDataInput;
};

export type CreatePageCacheEntryDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreatePageCacheEntryInput = {
  data: CreatePageCacheEntryDataInput;
};

export type CreatePetrovDayActionDataInput = {
  actionType: Scalars['String']['input'];
  data: InputMaybe<Scalars['JSON']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
};

export type CreatePetrovDayActionInput = {
  data: CreatePetrovDayActionDataInput;
};

export type CreatePetrovDayLaunchDataInput = {
  hashedLaunchCode: InputMaybe<Scalars['String']['input']>;
  launchCode: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreatePetrovDayLaunchInput = {
  data: CreatePetrovDayLaunchDataInput;
};

export type CreatePodcastDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreatePodcastEpisodeDataInput = {
  episodeLink: Scalars['String']['input'];
  externalEpisodeId: Scalars['String']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  podcastId: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreatePodcastEpisodeInput = {
  data: CreatePodcastEpisodeDataInput;
};

export type CreatePodcastInput = {
  data: CreatePodcastDataInput;
};

export type CreatePostDataInput = {
  activateRSVPs: InputMaybe<Scalars['Boolean']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
  afDate: InputMaybe<Scalars['Date']['input']>;
  afSticky: InputMaybe<Scalars['Boolean']['input']>;
  agentFoundationsId: InputMaybe<Scalars['String']['input']>;
  authorIsUnreviewed: InputMaybe<Scalars['Boolean']['input']>;
  autoFrontpage: InputMaybe<Scalars['String']['input']>;
  bannedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  canonicalBookId: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug: InputMaybe<Scalars['String']['input']>;
  canonicalNextPostSlug: InputMaybe<Scalars['String']['input']>;
  canonicalPrevPostSlug: InputMaybe<Scalars['String']['input']>;
  canonicalSequenceId: InputMaybe<Scalars['String']['input']>;
  canonicalSource: InputMaybe<Scalars['String']['input']>;
  coauthorStatuses: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  collabEditorDialogue: InputMaybe<Scalars['Boolean']['input']>;
  collectionTitle: InputMaybe<Scalars['String']['input']>;
  commentSortOrder: InputMaybe<Scalars['String']['input']>;
  commentsLocked: InputMaybe<Scalars['Boolean']['input']>;
  commentsLockedToAccountsCreatedAfter: InputMaybe<Scalars['Date']['input']>;
  contactInfo: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  curatedDate: InputMaybe<Scalars['Date']['input']>;
  customHighlight: InputMaybe<Scalars['JSON']['input']>;
  debate: InputMaybe<Scalars['Boolean']['input']>;
  defaultRecommendation: InputMaybe<Scalars['Boolean']['input']>;
  disableRecommendation: InputMaybe<Scalars['Boolean']['input']>;
  disableSidenotes: InputMaybe<Scalars['Boolean']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  endTime: InputMaybe<Scalars['Date']['input']>;
  eventImageId: InputMaybe<Scalars['String']['input']>;
  eventRegistrationLink: InputMaybe<Scalars['String']['input']>;
  eventType: InputMaybe<Scalars['String']['input']>;
  facebookLink: InputMaybe<Scalars['String']['input']>;
  feedId: InputMaybe<Scalars['String']['input']>;
  feedLink: InputMaybe<Scalars['String']['input']>;
  fmCrosspost: InputMaybe<Scalars['JSON']['input']>;
  forceAllowType3Audio: InputMaybe<Scalars['Boolean']['input']>;
  frontpageDate: InputMaybe<Scalars['Date']['input']>;
  generateDraftJargon: InputMaybe<Scalars['Boolean']['input']>;
  globalEvent: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  groupId: InputMaybe<Scalars['String']['input']>;
  hasCoauthorPermission: InputMaybe<Scalars['Boolean']['input']>;
  hiddenRelatedQuestion: InputMaybe<Scalars['Boolean']['input']>;
  hideAuthor: InputMaybe<Scalars['Boolean']['input']>;
  hideCommentKarma: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPopularComments: InputMaybe<Scalars['Boolean']['input']>;
  hideFromRecentDiscussions: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageComments: InputMaybe<Scalars['Boolean']['input']>;
  ignoreRateLimits: InputMaybe<Scalars['Boolean']['input']>;
  isEvent: InputMaybe<Scalars['Boolean']['input']>;
  joinEventLink: InputMaybe<Scalars['String']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  legacySpam: InputMaybe<Scalars['Boolean']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  manifoldReviewMarketId: InputMaybe<Scalars['String']['input']>;
  meetupLink: InputMaybe<Scalars['String']['input']>;
  meta: InputMaybe<Scalars['Boolean']['input']>;
  metaDate: InputMaybe<Scalars['Date']['input']>;
  metaSticky: InputMaybe<Scalars['Boolean']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  moderationStyle: InputMaybe<Scalars['String']['input']>;
  nextDayReminderSent: InputMaybe<Scalars['Boolean']['input']>;
  noIndex: InputMaybe<Scalars['Boolean']['input']>;
  onlineEvent: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToEstablishedAccounts: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToLoggedIn: InputMaybe<Scalars['Boolean']['input']>;
  organizerIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  originalPostRelationSourceId: InputMaybe<Scalars['String']['input']>;
  podcastEpisodeId: InputMaybe<Scalars['String']['input']>;
  postCategory: InputMaybe<Scalars['String']['input']>;
  postedAt: InputMaybe<Scalars['Date']['input']>;
  question: InputMaybe<Scalars['Boolean']['input']>;
  readTimeMinutesOverride: InputMaybe<Scalars['Float']['input']>;
  rejected: InputMaybe<Scalars['Boolean']['input']>;
  rejectedByUserId: InputMaybe<Scalars['String']['input']>;
  rejectedReason: InputMaybe<Scalars['String']['input']>;
  reviewForAlignmentUserId: InputMaybe<Scalars['String']['input']>;
  reviewForCuratedUserId: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  shareWithUsers: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sharingSettings: InputMaybe<Scalars['JSON']['input']>;
  shortform: InputMaybe<Scalars['Boolean']['input']>;
  sideCommentVisibility: InputMaybe<Scalars['String']['input']>;
  socialPreview: InputMaybe<Scalars['JSON']['input']>;
  socialPreviewImageAutoUrl: InputMaybe<Scalars['String']['input']>;
  socialPreviewImageId: InputMaybe<Scalars['String']['input']>;
  startTime: InputMaybe<Scalars['Date']['input']>;
  status: InputMaybe<Scalars['Float']['input']>;
  sticky: InputMaybe<Scalars['Boolean']['input']>;
  stickyPriority: InputMaybe<Scalars['Int']['input']>;
  subforumTagId: InputMaybe<Scalars['String']['input']>;
  submitToFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  suggestForAlignmentUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  suggestForCuratedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  swrCachingEnabled: InputMaybe<Scalars['Boolean']['input']>;
  tagRelevance: InputMaybe<Scalars['JSON']['input']>;
  title: Scalars['String']['input'];
  types: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  unlisted: InputMaybe<Scalars['Boolean']['input']>;
  url: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  wasEverUndrafted: InputMaybe<Scalars['Boolean']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
};

export type CreatePostEmbeddingDataInput = {
  embeddings: Array<InputMaybe<Scalars['Float']['input']>>;
  lastGeneratedAt: Scalars['Date']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  model: Scalars['String']['input'];
  postHash: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};

export type CreatePostEmbeddingInput = {
  data: CreatePostEmbeddingDataInput;
};

export type CreatePostInput = {
  data: CreatePostDataInput;
};

export type CreatePostRecommendationDataInput = {
  clickedAt: InputMaybe<Scalars['Date']['input']>;
  clientId: InputMaybe<Scalars['String']['input']>;
  lastRecommendedAt: Scalars['Date']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  recommendationCount: Scalars['Int']['input'];
  strategyName: Scalars['String']['input'];
  strategySettings: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreatePostRecommendationInput = {
  data: CreatePostRecommendationDataInput;
};

export type CreatePostRelationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
  sourcePostId: Scalars['String']['input'];
  targetPostId: Scalars['String']['input'];
  type: InputMaybe<Scalars['String']['input']>;
};

export type CreatePostRelationInput = {
  data: CreatePostRelationDataInput;
};

export type CreatePostViewTimeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreatePostViewTimeInput = {
  data: CreatePostViewTimeDataInput;
};

export type CreatePostViewsDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreatePostViewsInput = {
  data: CreatePostViewsDataInput;
};

export type CreateRssFeedDataInput = {
  displayFullContent: InputMaybe<Scalars['Boolean']['input']>;
  importAsDraft: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  nickname: InputMaybe<Scalars['String']['input']>;
  ownedByUser: InputMaybe<Scalars['Boolean']['input']>;
  rawFeed: InputMaybe<Scalars['JSON']['input']>;
  setCanonicalUrl: InputMaybe<Scalars['Boolean']['input']>;
  url: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateRssFeedInput = {
  data: CreateRssFeedDataInput;
};

export type CreateReadStatusDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateReadStatusInput = {
  data: CreateReadStatusDataInput;
};

export type CreateRecommendationsCacheDataInput = {
  attributionId: Scalars['String']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  scenario: Scalars['String']['input'];
  source: Scalars['String']['input'];
  ttlMs: Scalars['Float']['input'];
  userId: Scalars['String']['input'];
};

export type CreateRecommendationsCacheInput = {
  data: CreateRecommendationsCacheDataInput;
};

export type CreateReportDataInput = {
  claimedUserId: InputMaybe<Scalars['String']['input']>;
  commentId: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  link: Scalars['String']['input'];
  postId: InputMaybe<Scalars['String']['input']>;
  reportedAsSpam: InputMaybe<Scalars['Boolean']['input']>;
  reportedUserId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type CreateReportInput = {
  data: CreateReportDataInput;
};

export type CreateReviewVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateReviewVoteInput = {
  data: CreateReviewVoteDataInput;
};

export type CreateReviewWinnerArtDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  splashArtImagePrompt: Scalars['String']['input'];
  splashArtImageUrl: Scalars['String']['input'];
};

export type CreateReviewWinnerArtInput = {
  data: CreateReviewWinnerArtDataInput;
};

export type CreateReviewWinnerDataInput = {
  category: Scalars['String']['input'];
  curatedOrder: InputMaybe<Scalars['Float']['input']>;
  isAI: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  reviewRanking: Scalars['Float']['input'];
  reviewYear: Scalars['Float']['input'];
};

export type CreateReviewWinnerInput = {
  data: CreateReviewWinnerDataInput;
};

export type CreateRevisionDataInput = {
  commitMessage: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  updateType: InputMaybe<Scalars['String']['input']>;
};

export type CreateRevisionInput = {
  data: CreateRevisionDataInput;
};

export type CreateSequenceDataInput = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  curatedOrder: InputMaybe<Scalars['Float']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  gridImageId: InputMaybe<Scalars['String']['input']>;
  hidden: InputMaybe<Scalars['Boolean']['input']>;
  hideFromAuthorPage: InputMaybe<Scalars['Boolean']['input']>;
  isDeleted: InputMaybe<Scalars['Boolean']['input']>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
  userId: InputMaybe<Scalars['String']['input']>;
  userProfileOrder: InputMaybe<Scalars['Float']['input']>;
};

export type CreateSequenceInput = {
  data: CreateSequenceDataInput;
};

export type CreateSessionDataInput = {
  _id: Scalars['String']['input'];
  expires: InputMaybe<Scalars['Date']['input']>;
  lastModified: InputMaybe<Scalars['Date']['input']>;
  session: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateSessionInput = {
  data: CreateSessionDataInput;
};

export type CreateSideCommentCacheDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateSideCommentCacheInput = {
  data: CreateSideCommentCacheDataInput;
};

export type CreateSplashArtCoordinateDataInput = {
  leftFlipped: InputMaybe<Scalars['Boolean']['input']>;
  leftHeightPct: Scalars['Float']['input'];
  leftWidthPct: Scalars['Float']['input'];
  leftXPct: Scalars['Float']['input'];
  leftYPct: Scalars['Float']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  middleFlipped: InputMaybe<Scalars['Boolean']['input']>;
  middleHeightPct: Scalars['Float']['input'];
  middleWidthPct: Scalars['Float']['input'];
  middleXPct: Scalars['Float']['input'];
  middleYPct: Scalars['Float']['input'];
  reviewWinnerArtId: Scalars['String']['input'];
  rightFlipped: Scalars['Boolean']['input'];
  rightHeightPct: Scalars['Float']['input'];
  rightWidthPct: Scalars['Float']['input'];
  rightXPct: Scalars['Float']['input'];
  rightYPct: Scalars['Float']['input'];
};

export type CreateSplashArtCoordinateInput = {
  data: CreateSplashArtCoordinateDataInput;
};

export type CreateSpotlightDataInput = {
  customSubtitle: InputMaybe<Scalars['String']['input']>;
  customTitle: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['JSON']['input']>;
  documentId: Scalars['String']['input'];
  documentType: Scalars['String']['input'];
  draft: Scalars['Boolean']['input'];
  duration: Scalars['Float']['input'];
  headerTitle: InputMaybe<Scalars['String']['input']>;
  headerTitleLeftColor: InputMaybe<Scalars['String']['input']>;
  headerTitleRightColor: InputMaybe<Scalars['String']['input']>;
  imageFade: InputMaybe<Scalars['Boolean']['input']>;
  imageFadeColor: InputMaybe<Scalars['String']['input']>;
  lastPromotedAt: Scalars['Date']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  position: InputMaybe<Scalars['Float']['input']>;
  showAuthor: InputMaybe<Scalars['Boolean']['input']>;
  spotlightDarkImageId: InputMaybe<Scalars['String']['input']>;
  spotlightImageId: InputMaybe<Scalars['String']['input']>;
  spotlightSplashImageUrl: InputMaybe<Scalars['String']['input']>;
  subtitleUrl: InputMaybe<Scalars['String']['input']>;
};

export type CreateSpotlightInput = {
  data: CreateSpotlightDataInput;
};

export type CreateSubscriptionDataInput = {
  collectionName: Scalars['String']['input'];
  documentId: Scalars['String']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  state: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CreateSubscriptionInput = {
  data: CreateSubscriptionDataInput;
};

export type CreateSurveyDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
};

export type CreateSurveyInput = {
  data: CreateSurveyDataInput;
};

export type CreateSurveyQuestionDataInput = {
  format: Scalars['String']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  order: Scalars['Float']['input'];
  question: Scalars['String']['input'];
  surveyId: Scalars['String']['input'];
};

export type CreateSurveyQuestionInput = {
  data: CreateSurveyQuestionDataInput;
};

export type CreateSurveyResponseDataInput = {
  clientId: Scalars['String']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  response: Scalars['JSON']['input'];
  surveyId: Scalars['String']['input'];
  surveyScheduleId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateSurveyResponseInput = {
  data: CreateSurveyResponseDataInput;
};

export type CreateSurveyScheduleDataInput = {
  clientIds: Array<InputMaybe<Scalars['String']['input']>>;
  deactivated: InputMaybe<Scalars['Boolean']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
  impressionsLimit: InputMaybe<Scalars['Float']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  maxKarma: InputMaybe<Scalars['Float']['input']>;
  maxVisitorPercentage: InputMaybe<Scalars['Float']['input']>;
  minKarma: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  startDate: InputMaybe<Scalars['Date']['input']>;
  surveyId: Scalars['String']['input'];
  target: Scalars['String']['input'];
};

export type CreateSurveyScheduleInput = {
  data: CreateSurveyScheduleDataInput;
};

export type CreateTagDataInput = {
  adminOnly: InputMaybe<Scalars['Boolean']['input']>;
  autoTagModel: InputMaybe<Scalars['String']['input']>;
  autoTagPrompt: InputMaybe<Scalars['String']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  canEditUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  canVoteOnRels: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  core: InputMaybe<Scalars['Boolean']['input']>;
  coreTagId: InputMaybe<Scalars['String']['input']>;
  defaultOrder: InputMaybe<Scalars['Float']['input']>;
  description: InputMaybe<Scalars['JSON']['input']>;
  descriptionTruncationCount: InputMaybe<Scalars['Float']['input']>;
  forceAllowType3Audio: InputMaybe<Scalars['Boolean']['input']>;
  introSequenceId: InputMaybe<Scalars['String']['input']>;
  isPostType: InputMaybe<Scalars['Boolean']['input']>;
  isSubforum: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  parentTagId: InputMaybe<Scalars['String']['input']>;
  postsDefaultSortOrder: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  shortName: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  squareImageId: InputMaybe<Scalars['String']['input']>;
  subTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  subforumIntroPostId: InputMaybe<Scalars['String']['input']>;
  subforumModeratorIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  subforumWelcomeText: InputMaybe<Scalars['JSON']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  suggestedAsFilter: InputMaybe<Scalars['Boolean']['input']>;
  tagFlagsIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  wikiGrade: InputMaybe<Scalars['Int']['input']>;
  wikiOnly: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateTagFlagDataInput = {
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  order: InputMaybe<Scalars['Float']['input']>;
};

export type CreateTagFlagInput = {
  data: CreateTagFlagDataInput;
};

export type CreateTagInput = {
  data: CreateTagDataInput;
};

export type CreateTagRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  tagId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateTagRelInput = {
  data: CreateTagRelDataInput;
};

export type CreateTweetDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateTweetInput = {
  data: CreateTweetDataInput;
};

export type CreateTypingIndicatorDataInput = {
  documentId: Scalars['String']['input'];
  lastUpdated: Scalars['Date']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateTypingIndicatorInput = {
  data: CreateTypingIndicatorDataInput;
};

export type CreateUserActivityDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateUserActivityInput = {
  data: CreateUserActivityDataInput;
};

export type CreateUserDataInput = {
  acceptedTos: InputMaybe<Scalars['Boolean']['input']>;
  acknowledgedNewUserGuidelines: InputMaybe<Scalars['Boolean']['input']>;
  afSubmittedApplication: InputMaybe<Scalars['Boolean']['input']>;
  allCommentingDisabled: InputMaybe<Scalars['Boolean']['input']>;
  allPostsFilter: InputMaybe<Scalars['String']['input']>;
  allPostsHideCommunity: InputMaybe<Scalars['Boolean']['input']>;
  allPostsIncludeEvents: InputMaybe<Scalars['Boolean']['input']>;
  allPostsOpenSettings: InputMaybe<Scalars['Boolean']['input']>;
  allPostsShowLowKarma: InputMaybe<Scalars['Boolean']['input']>;
  allPostsSorting: InputMaybe<Scalars['String']['input']>;
  allPostsTimeframe: InputMaybe<Scalars['String']['input']>;
  allowDatadogSessionReplay: InputMaybe<Scalars['Boolean']['input']>;
  autoSubscribeAsOrganizer: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_comments: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_posts: InputMaybe<Scalars['Boolean']['input']>;
  banned: InputMaybe<Scalars['Date']['input']>;
  bannedPersonalUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  bannedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  biography: InputMaybe<Scalars['JSON']['input']>;
  blueskyProfileURL: InputMaybe<Scalars['String']['input']>;
  careerStage: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  collapseModerationGuidelines: InputMaybe<Scalars['Boolean']['input']>;
  commentSorting: InputMaybe<Scalars['String']['input']>;
  commentingOnOtherUsersDisabled: InputMaybe<Scalars['Boolean']['input']>;
  conversationsDisabled: InputMaybe<Scalars['Boolean']['input']>;
  criticismTipsDismissed: InputMaybe<Scalars['Boolean']['input']>;
  currentFrontpageFilter: InputMaybe<Scalars['String']['input']>;
  deleteContent: InputMaybe<Scalars['Boolean']['input']>;
  displayName: InputMaybe<Scalars['String']['input']>;
  draftsListShowArchived: InputMaybe<Scalars['Boolean']['input']>;
  draftsListShowShared: InputMaybe<Scalars['Boolean']['input']>;
  draftsListSorting: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  emailSubscribedToCurated: InputMaybe<Scalars['Boolean']['input']>;
  expandedFrontpageSections: InputMaybe<Scalars['JSON']['input']>;
  facebookProfileURL: InputMaybe<Scalars['String']['input']>;
  fmCrosspostUserId: InputMaybe<Scalars['String']['input']>;
  frontpageFilterSettings: InputMaybe<Scalars['JSON']['input']>;
  frontpageSelectedTab: InputMaybe<Scalars['String']['input']>;
  githubProfileURL: InputMaybe<Scalars['String']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  groups: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hideActiveDialogueUsers: InputMaybe<Scalars['Boolean']['input']>;
  hideCommunitySection: InputMaybe<Scalars['Boolean']['input']>;
  hideDialogueFacilitation: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPeopleDirectory: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2019Ad: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2020Ad: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBookAd: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageFilterSettingsDesktop: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageMap: InputMaybe<Scalars['Boolean']['input']>;
  hideHomeRHS: InputMaybe<Scalars['Boolean']['input']>;
  hideIntercom: InputMaybe<Scalars['Boolean']['input']>;
  hideJobAdUntil: InputMaybe<Scalars['Date']['input']>;
  hideMeetupsPoke: InputMaybe<Scalars['Boolean']['input']>;
  hideNavigationSidebar: InputMaybe<Scalars['Boolean']['input']>;
  hidePostsRecommendations: InputMaybe<Scalars['Boolean']['input']>;
  hideSubscribePoke: InputMaybe<Scalars['Boolean']['input']>;
  hideSunshineSidebar: InputMaybe<Scalars['Boolean']['input']>;
  hideTaggingProgressBar: InputMaybe<Scalars['Boolean']['input']>;
  howICanHelpOthers: InputMaybe<Scalars['JSON']['input']>;
  howOthersCanHelpMe: InputMaybe<Scalars['JSON']['input']>;
  inactiveSurveyEmailSentAt: InputMaybe<Scalars['Date']['input']>;
  isAdmin: InputMaybe<Scalars['Boolean']['input']>;
  jobTitle: InputMaybe<Scalars['String']['input']>;
  karmaChangeBatchStart: InputMaybe<Scalars['Date']['input']>;
  karmaChangeLastOpened: InputMaybe<Scalars['Date']['input']>;
  karmaChangeNotifierSettings: InputMaybe<Scalars['JSON']['input']>;
  lastNotificationsCheck: InputMaybe<Scalars['Date']['input']>;
  lastUsedTimezone: InputMaybe<Scalars['String']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  linkedinProfileURL: InputMaybe<Scalars['String']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  mapLocation: InputMaybe<Scalars['JSON']['input']>;
  mapMarkerText: InputMaybe<Scalars['String']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  moderationStyle: InputMaybe<Scalars['String']['input']>;
  moderatorAssistance: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotifications: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotificationsLocation: InputMaybe<Scalars['JSON']['input']>;
  nearbyEventsNotificationsRadius: InputMaybe<Scalars['Float']['input']>;
  nearbyPeopleNotificationThreshold: InputMaybe<Scalars['Float']['input']>;
  noCollapseCommentsFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsPosts: InputMaybe<Scalars['Boolean']['input']>;
  noExpandUnreadCommentsReview: InputMaybe<Scalars['Boolean']['input']>;
  noKibitz: InputMaybe<Scalars['Boolean']['input']>;
  noSingleLineComments: InputMaybe<Scalars['Boolean']['input']>;
  notificationAddedAsCoauthor: InputMaybe<Scalars['JSON']['input']>;
  notificationAlignmentSubmissionApproved: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnDraft: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnSubscribedPost: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateCommentsOnSubscribedPost: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateReplies: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMatch: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMessages: InputMaybe<Scalars['JSON']['input']>;
  notificationEventInRadius: InputMaybe<Scalars['JSON']['input']>;
  notificationGroupAdministration: InputMaybe<Scalars['JSON']['input']>;
  notificationKarmaPowersGained: InputMaybe<Scalars['JSON']['input']>;
  notificationNewDialogueChecks: InputMaybe<Scalars['JSON']['input']>;
  notificationNewMention: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsInGroups: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsNominatedReview: InputMaybe<Scalars['JSON']['input']>;
  notificationPrivateMessage: InputMaybe<Scalars['JSON']['input']>;
  notificationPublishedDialogueMessages: InputMaybe<Scalars['JSON']['input']>;
  notificationRSVPs: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToMyComments: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToSubscribedComments: InputMaybe<Scalars['JSON']['input']>;
  notificationSharedWithMe: InputMaybe<Scalars['JSON']['input']>;
  notificationShortformContent: InputMaybe<Scalars['JSON']['input']>;
  notificationSubforumUnread: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedSequencePost: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedTagPost: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserComment: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserPost: InputMaybe<Scalars['JSON']['input']>;
  notificationYourTurnMatchForm: InputMaybe<Scalars['JSON']['input']>;
  nullifyVotes: InputMaybe<Scalars['Boolean']['input']>;
  optedInToDialogueFacilitation: InputMaybe<Scalars['Boolean']['input']>;
  optedOutOfSurveys: InputMaybe<Scalars['Boolean']['input']>;
  organization: InputMaybe<Scalars['String']['input']>;
  organizerOfGroupIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  petrovOptOut: InputMaybe<Scalars['Boolean']['input']>;
  postGlossariesPinned: InputMaybe<Scalars['Boolean']['input']>;
  postingDisabled: InputMaybe<Scalars['Boolean']['input']>;
  previousDisplayName: InputMaybe<Scalars['String']['input']>;
  profileTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  profileUpdatedAt: Scalars['Date']['input'];
  programParticipation: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  revealChecksToAdmins: InputMaybe<Scalars['Boolean']['input']>;
  reviewForAlignmentForumUserId: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  shortformFeedId: InputMaybe<Scalars['String']['input']>;
  showCommunityInRecentDiscussion: InputMaybe<Scalars['Boolean']['input']>;
  showDialoguesList: Scalars['Boolean']['input'];
  showHideKarmaOption: InputMaybe<Scalars['Boolean']['input']>;
  showMatches: Scalars['Boolean']['input'];
  showMyDialogues: Scalars['Boolean']['input'];
  showPostAuthorCard: InputMaybe<Scalars['Boolean']['input']>;
  showRecommendedPartners: Scalars['Boolean']['input'];
  subforumPreferredLayout: InputMaybe<Scalars['String']['input']>;
  subscribedToDigest: InputMaybe<Scalars['Boolean']['input']>;
  theme: InputMaybe<Scalars['JSON']['input']>;
  twitterProfileURL: InputMaybe<Scalars['String']['input']>;
  twitterProfileURLAdmin: InputMaybe<Scalars['String']['input']>;
  unsubscribeFromAll: InputMaybe<Scalars['Boolean']['input']>;
  userSurveyEmailSentAt: InputMaybe<Scalars['Date']['input']>;
  username: InputMaybe<Scalars['String']['input']>;
  viewUnreviewedComments: InputMaybe<Scalars['Boolean']['input']>;
  voteBanned: InputMaybe<Scalars['Boolean']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
  whenConfirmationEmailSent: InputMaybe<Scalars['Date']['input']>;
};

export type CreateUserEagDetailDataInput = {
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateUserEagDetailInput = {
  data: CreateUserEagDetailDataInput;
};

export type CreateUserInput = {
  data: CreateUserDataInput;
};

export type CreateUserJobAdDataInput = {
  adState: Scalars['String']['input'];
  jobName: Scalars['String']['input'];
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  reminderSetAt: InputMaybe<Scalars['Date']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateUserJobAdInput = {
  data: CreateUserJobAdDataInput;
};

export type CreateUserMostValuablePostDataInput = {
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateUserMostValuablePostInput = {
  data: CreateUserMostValuablePostDataInput;
};

export type CreateUserRateLimitDataInput = {
  actionsPerInterval: Scalars['Float']['input'];
  endedAt: InputMaybe<Scalars['Date']['input']>;
  intervalLength: Scalars['Float']['input'];
  intervalUnit: Scalars['String']['input'];
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  type: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateUserRateLimitInput = {
  data: CreateUserRateLimitDataInput;
};

export type CreateUserTagRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  subforumEmailNotifications: InputMaybe<Scalars['Boolean']['input']>;
  subforumHideIntroPost: InputMaybe<Scalars['Boolean']['input']>;
  subforumShowUnreadInSidebar: InputMaybe<Scalars['Boolean']['input']>;
  tagId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateUserTagRelInput = {
  data: CreateUserTagRelDataInput;
};

export type CreateVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateVoteInput = {
  data: CreateVoteDataInput;
};

export type CronHistory = {
  __typename?: 'CronHistory';
  _id: Maybe<Scalars['String']['output']>;
  finishedAt: Maybe<Scalars['Date']['output']>;
  intendedAt: Maybe<Scalars['Date']['output']>;
  name: Maybe<Scalars['String']['output']>;
  result: Maybe<Scalars['JSON']['output']>;
  startedAt: Maybe<Scalars['Date']['output']>;
};

export enum CronHistoryOrderByInput {
  Foobar = 'foobar'
}

export type CronHistoryOutput = {
  __typename?: 'CronHistoryOutput';
  data: Maybe<CronHistory>;
};

export type CronHistorySelectorInput = {
  AND: InputMaybe<Array<InputMaybe<CronHistorySelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<CronHistorySelectorInput>>>;
};

export type CronHistorySelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type CrossedKarmaThresholdResult = {
  __typename?: 'CrossedKarmaThresholdResult';
  results: Array<Post>;
};

export type CuratedAndPopularThisWeekResult = {
  __typename?: 'CuratedAndPopularThisWeekResult';
  results: Array<Post>;
};

export type CurationEmail = {
  __typename?: 'CurationEmail';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum CurationEmailOrderByInput {
  Foobar = 'foobar'
}

export type CurationEmailOutput = {
  __typename?: 'CurationEmailOutput';
  data: Maybe<CurationEmail>;
};

export type CurationEmailSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<CurationEmailSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<CurationEmailSelectorInput>>>;
};

export type CurationEmailSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type CurationNotice = {
  __typename?: 'CurationNotice';
  _id: Scalars['String']['output'];
  comment: Maybe<Comment>;
  commentId: Maybe<Scalars['String']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  post: Maybe<Post>;
  postId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};


export type CurationNoticeContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum CurationNoticeOrderByInput {
  Foobar = 'foobar'
}

export type CurationNoticeOutput = {
  __typename?: 'CurationNoticeOutput';
  data: Maybe<CurationNotice>;
};

export type CurationNoticeSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<CurationNoticeSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<CurationNoticeSelectorInput>>>;
};

export type CurationNoticeSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type DatabaseMetadata = {
  __typename?: 'DatabaseMetadata';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum DatabaseMetadataOrderByInput {
  Foobar = 'foobar'
}

export type DatabaseMetadataOutput = {
  __typename?: 'DatabaseMetadataOutput';
  data: Maybe<DatabaseMetadata>;
};

export type DatabaseMetadataSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<DatabaseMetadataSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<DatabaseMetadataSelectorInput>>>;
};

export type DatabaseMetadataSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type DebouncerEvents = {
  __typename?: 'DebouncerEvents';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum DebouncerEventsOrderByInput {
  Foobar = 'foobar'
}

export type DebouncerEventsOutput = {
  __typename?: 'DebouncerEventsOutput';
  data: Maybe<DebouncerEvents>;
};

export type DebouncerEventsSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<DebouncerEventsSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<DebouncerEventsSelectorInput>>>;
};

export type DebouncerEventsSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type DeleteAdvisorRequestInput = {
  selector: AdvisorRequestSelectorUniqueInput;
};

export type DeleteArbitalCachesInput = {
  selector: ArbitalCachesSelectorUniqueInput;
};

export type DeleteArbitalTagContentRelInput = {
  selector: ArbitalTagContentRelSelectorUniqueInput;
};

export type DeleteBanInput = {
  selector: BanSelectorUniqueInput;
};

export type DeleteBookInput = {
  selector: BookSelectorUniqueInput;
};

export type DeleteChapterInput = {
  selector: ChapterSelectorUniqueInput;
};

export type DeleteCkEditorUserSessionInput = {
  selector: CkEditorUserSessionSelectorUniqueInput;
};

export type DeleteClientIdInput = {
  selector: ClientIdSelectorUniqueInput;
};

export type DeleteCollectionInput = {
  selector: CollectionSelectorUniqueInput;
};

export type DeleteCommentInput = {
  selector: CommentSelectorUniqueInput;
};

export type DeleteCommentModeratorActionInput = {
  selector: CommentModeratorActionSelectorUniqueInput;
};

export type DeleteConversationInput = {
  selector: ConversationSelectorUniqueInput;
};

export type DeleteCronHistoryInput = {
  selector: CronHistorySelectorUniqueInput;
};

export type DeleteCurationEmailInput = {
  selector: CurationEmailSelectorUniqueInput;
};

export type DeleteCurationNoticeInput = {
  selector: CurationNoticeSelectorUniqueInput;
};

export type DeleteDatabaseMetadataInput = {
  selector: DatabaseMetadataSelectorUniqueInput;
};

export type DeleteDebouncerEventsInput = {
  selector: DebouncerEventsSelectorUniqueInput;
};

export type DeleteDialogueCheckInput = {
  selector: DialogueCheckSelectorUniqueInput;
};

export type DeleteDialogueMatchPreferenceInput = {
  selector: DialogueMatchPreferenceSelectorUniqueInput;
};

export type DeleteDigestInput = {
  selector: DigestSelectorUniqueInput;
};

export type DeleteDigestPostInput = {
  selector: DigestPostSelectorUniqueInput;
};

export type DeleteElectionCandidateInput = {
  selector: ElectionCandidateSelectorUniqueInput;
};

export type DeleteElectionVoteInput = {
  selector: ElectionVoteSelectorUniqueInput;
};

export type DeleteElicitQuestionInput = {
  selector: ElicitQuestionSelectorUniqueInput;
};

export type DeleteElicitQuestionPredictionInput = {
  selector: ElicitQuestionPredictionSelectorUniqueInput;
};

export type DeleteEmailTokensInput = {
  selector: EmailTokensSelectorUniqueInput;
};

export type DeleteFeaturedResourceInput = {
  selector: FeaturedResourceSelectorUniqueInput;
};

export type DeleteFieldChangeInput = {
  selector: FieldChangeSelectorUniqueInput;
};

export type DeleteForumEventInput = {
  selector: ForumEventSelectorUniqueInput;
};

export type DeleteGardenCodeInput = {
  selector: GardenCodeSelectorUniqueInput;
};

export type DeleteGoogleServiceAccountSessionInput = {
  selector: GoogleServiceAccountSessionSelectorUniqueInput;
};

export type DeleteImagesInput = {
  selector: ImagesSelectorUniqueInput;
};

export type DeleteJargonTermInput = {
  selector: JargonTermSelectorUniqueInput;
};

export type DeleteLwEventInput = {
  selector: LwEventSelectorUniqueInput;
};

export type DeleteLegacyDataInput = {
  selector: LegacyDataSelectorUniqueInput;
};

export type DeleteLlmConversationInput = {
  selector: LlmConversationSelectorUniqueInput;
};

export type DeleteLlmMessageInput = {
  selector: LlmMessageSelectorUniqueInput;
};

export type DeleteLocalgroupInput = {
  selector: LocalgroupSelectorUniqueInput;
};

export type DeleteManifoldProbabilitiesCacheInput = {
  selector: ManifoldProbabilitiesCacheSelectorUniqueInput;
};

export type DeleteMessageInput = {
  selector: MessageSelectorUniqueInput;
};

export type DeleteMigrationInput = {
  selector: MigrationSelectorUniqueInput;
};

export type DeleteModerationTemplateInput = {
  selector: ModerationTemplateSelectorUniqueInput;
};

export type DeleteModeratorActionInput = {
  selector: ModeratorActionSelectorUniqueInput;
};

export type DeleteMultiDocumentInput = {
  selector: MultiDocumentSelectorUniqueInput;
};

export type DeleteNotificationInput = {
  selector: NotificationSelectorUniqueInput;
};

export type DeletePageCacheEntryInput = {
  selector: PageCacheEntrySelectorUniqueInput;
};

export type DeletePetrovDayActionInput = {
  selector: PetrovDayActionSelectorUniqueInput;
};

export type DeletePetrovDayLaunchInput = {
  selector: PetrovDayLaunchSelectorUniqueInput;
};

export type DeletePodcastEpisodeInput = {
  selector: PodcastEpisodeSelectorUniqueInput;
};

export type DeletePodcastInput = {
  selector: PodcastSelectorUniqueInput;
};

export type DeletePostEmbeddingInput = {
  selector: PostEmbeddingSelectorUniqueInput;
};

export type DeletePostInput = {
  selector: PostSelectorUniqueInput;
};

export type DeletePostRecommendationInput = {
  selector: PostRecommendationSelectorUniqueInput;
};

export type DeletePostRelationInput = {
  selector: PostRelationSelectorUniqueInput;
};

export type DeletePostViewTimeInput = {
  selector: PostViewTimeSelectorUniqueInput;
};

export type DeletePostViewsInput = {
  selector: PostViewsSelectorUniqueInput;
};

export type DeleteRssFeedInput = {
  selector: RssFeedSelectorUniqueInput;
};

export type DeleteReadStatusInput = {
  selector: ReadStatusSelectorUniqueInput;
};

export type DeleteRecommendationsCacheInput = {
  selector: RecommendationsCacheSelectorUniqueInput;
};

export type DeleteReportInput = {
  selector: ReportSelectorUniqueInput;
};

export type DeleteReviewVoteInput = {
  selector: ReviewVoteSelectorUniqueInput;
};

export type DeleteReviewWinnerArtInput = {
  selector: ReviewWinnerArtSelectorUniqueInput;
};

export type DeleteReviewWinnerInput = {
  selector: ReviewWinnerSelectorUniqueInput;
};

export type DeleteRevisionInput = {
  selector: RevisionSelectorUniqueInput;
};

export type DeleteSequenceInput = {
  selector: SequenceSelectorUniqueInput;
};

export type DeleteSessionInput = {
  selector: SessionSelectorUniqueInput;
};

export type DeleteSideCommentCacheInput = {
  selector: SideCommentCacheSelectorUniqueInput;
};

export type DeleteSplashArtCoordinateInput = {
  selector: SplashArtCoordinateSelectorUniqueInput;
};

export type DeleteSpotlightInput = {
  selector: SpotlightSelectorUniqueInput;
};

export type DeleteSubscriptionInput = {
  selector: SubscriptionSelectorUniqueInput;
};

export type DeleteSurveyInput = {
  selector: SurveySelectorUniqueInput;
};

export type DeleteSurveyQuestionInput = {
  selector: SurveyQuestionSelectorUniqueInput;
};

export type DeleteSurveyResponseInput = {
  selector: SurveyResponseSelectorUniqueInput;
};

export type DeleteSurveyScheduleInput = {
  selector: SurveyScheduleSelectorUniqueInput;
};

export type DeleteTagFlagInput = {
  selector: TagFlagSelectorUniqueInput;
};

export type DeleteTagInput = {
  selector: TagSelectorUniqueInput;
};

export type DeleteTagRelInput = {
  selector: TagRelSelectorUniqueInput;
};

export type DeleteTweetInput = {
  selector: TweetSelectorUniqueInput;
};

export type DeleteTypingIndicatorInput = {
  selector: TypingIndicatorSelectorUniqueInput;
};

export type DeleteUserActivityInput = {
  selector: UserActivitySelectorUniqueInput;
};

export type DeleteUserEagDetailInput = {
  selector: UserEagDetailSelectorUniqueInput;
};

export type DeleteUserInput = {
  selector: UserSelectorUniqueInput;
};

export type DeleteUserJobAdInput = {
  selector: UserJobAdSelectorUniqueInput;
};

export type DeleteUserMostValuablePostInput = {
  selector: UserMostValuablePostSelectorUniqueInput;
};

export type DeleteUserRateLimitInput = {
  selector: UserRateLimitSelectorUniqueInput;
};

export type DeleteUserTagRelInput = {
  selector: UserTagRelSelectorUniqueInput;
};

export type DeleteVoteInput = {
  selector: VoteSelectorUniqueInput;
};

export type DialogueCheck = {
  __typename?: 'DialogueCheck';
  _id: Scalars['String']['output'];
  checked: Maybe<Scalars['Boolean']['output']>;
  checkedAt: Maybe<Scalars['Date']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  hideInRecommendations: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  matchPreference: Maybe<DialogueMatchPreference>;
  reciprocalMatchPreference: Maybe<DialogueMatchPreference>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  targetUserId: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum DialogueCheckOrderByInput {
  Foobar = 'foobar'
}

export type DialogueCheckOutput = {
  __typename?: 'DialogueCheckOutput';
  data: Maybe<DialogueCheck>;
};

export type DialogueCheckSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<DialogueCheckSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<DialogueCheckSelectorInput>>>;
};

export type DialogueCheckSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type DialogueMatchPreference = {
  __typename?: 'DialogueMatchPreference';
  _id: Scalars['String']['output'];
  asyncPreference: Maybe<Scalars['String']['output']>;
  calendlyLink: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  dialogueCheck: Maybe<DialogueCheck>;
  dialogueCheckId: Maybe<Scalars['String']['output']>;
  formatNotes: Maybe<Scalars['String']['output']>;
  generatedDialogueId: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  syncPreference: Maybe<Scalars['String']['output']>;
  topicNotes: Maybe<Scalars['String']['output']>;
  topicPreferences: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
};

export enum DialogueMatchPreferenceOrderByInput {
  Foobar = 'foobar'
}

export type DialogueMatchPreferenceOutput = {
  __typename?: 'DialogueMatchPreferenceOutput';
  data: Maybe<DialogueMatchPreference>;
};

export type DialogueMatchPreferenceSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<DialogueMatchPreferenceSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<DialogueMatchPreferenceSelectorInput>>>;
};

export type DialogueMatchPreferenceSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Digest = {
  __typename?: 'Digest';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  endDate: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  num: Maybe<Scalars['Float']['output']>;
  onsiteImageId: Maybe<Scalars['String']['output']>;
  onsitePrimaryColor: Maybe<Scalars['String']['output']>;
  publishedDate: Maybe<Scalars['Date']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  startDate: Maybe<Scalars['Date']['output']>;
};

export type DigestHighlightsResult = {
  __typename?: 'DigestHighlightsResult';
  results: Array<Post>;
};

export enum DigestOrderByInput {
  Foobar = 'foobar'
}

export type DigestOutput = {
  __typename?: 'DigestOutput';
  data: Maybe<Digest>;
};

export type DigestPlannerPost = {
  __typename?: 'DigestPlannerPost';
  digestPost: Maybe<DigestPost>;
  post: Maybe<Post>;
  rating: Maybe<Scalars['Int']['output']>;
};

export type DigestPost = {
  __typename?: 'DigestPost';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  digest: Digest;
  digestId: Maybe<Scalars['String']['output']>;
  emailDigestStatus: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  onsiteDigestStatus: Maybe<Scalars['String']['output']>;
  post: Post;
  postId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum DigestPostOrderByInput {
  Foobar = 'foobar'
}

export type DigestPostOutput = {
  __typename?: 'DigestPostOutput';
  data: Maybe<DigestPost>;
};

export type DigestPostSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<DigestPostSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<DigestPostSelectorInput>>>;
};

export type DigestPostSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type DigestPostsThisWeekResult = {
  __typename?: 'DigestPostsThisWeekResult';
  results: Array<Post>;
};

export type DigestSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<DigestSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<DigestSelectorInput>>>;
};

export type DigestSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type DocumentDeletion = {
  __typename?: 'DocumentDeletion';
  createdAt: Scalars['Date']['output'];
  docFields: Maybe<MultiDocument>;
  documentId: Scalars['String']['output'];
  netChange: Scalars['String']['output'];
  type: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type ElectionCandidate = {
  __typename?: 'ElectionCandidate';
  _id: Scalars['String']['output'];
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
  amountRaised: Maybe<Scalars['Float']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  electionName: Maybe<Scalars['String']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  fundraiserLink: Maybe<Scalars['String']['output']>;
  gwwcId: Maybe<Scalars['String']['output']>;
  gwwcLink: Maybe<Scalars['String']['output']>;
  href: Maybe<Scalars['String']['output']>;
  isElectionFundraiser: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  logoSrc: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  postCount: Maybe<Scalars['Float']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  tag: Maybe<Tag>;
  tagId: Maybe<Scalars['String']['output']>;
  targetAmount: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
};

export enum ElectionCandidateOrderByInput {
  Foobar = 'foobar'
}

export type ElectionCandidateOutput = {
  __typename?: 'ElectionCandidateOutput';
  data: Maybe<ElectionCandidate>;
};

export type ElectionCandidateSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ElectionCandidateSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ElectionCandidateSelectorInput>>>;
};

export type ElectionCandidateSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ElectionVote = {
  __typename?: 'ElectionVote';
  _id: Scalars['String']['output'];
  compareState: Maybe<Scalars['JSON']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  electionName: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  submissionComments: Maybe<Scalars['JSON']['output']>;
  submittedAt: Maybe<Scalars['Date']['output']>;
  user: User;
  userExplanation: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  userOtherComments: Maybe<Scalars['String']['output']>;
  vote: Maybe<Scalars['JSON']['output']>;
};

export enum ElectionVoteOrderByInput {
  Foobar = 'foobar'
}

export type ElectionVoteOutput = {
  __typename?: 'ElectionVoteOutput';
  data: Maybe<ElectionVote>;
};

export type ElectionVoteSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ElectionVoteSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ElectionVoteSelectorInput>>>;
};

export type ElectionVoteSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ElicitBlockData = {
  __typename?: 'ElicitBlockData';
  _id: Maybe<Scalars['String']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  predictions: Maybe<Array<Maybe<ElicitPrediction>>>;
  resolution: Maybe<Scalars['Boolean']['output']>;
  resolvesBy: Maybe<Scalars['Date']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type ElicitPrediction = {
  __typename?: 'ElicitPrediction';
  _id: Maybe<Scalars['String']['output']>;
  binaryQuestionId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  creator: Maybe<ElicitUser>;
  notes: Maybe<Scalars['String']['output']>;
  prediction: Maybe<Scalars['Float']['output']>;
  predictionId: Maybe<Scalars['String']['output']>;
  sourceId: Maybe<Scalars['String']['output']>;
  sourceUrl: Maybe<Scalars['String']['output']>;
};

export type ElicitQuestion = {
  __typename?: 'ElicitQuestion';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  resolution: Maybe<Scalars['String']['output']>;
  resolvesBy: Maybe<Scalars['Date']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export enum ElicitQuestionOrderByInput {
  Foobar = 'foobar'
}

export type ElicitQuestionOutput = {
  __typename?: 'ElicitQuestionOutput';
  data: Maybe<ElicitQuestion>;
};

export type ElicitQuestionPrediction = {
  __typename?: 'ElicitQuestionPrediction';
  _id: Maybe<Scalars['String']['output']>;
  binaryQuestionId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  creator: Maybe<Scalars['JSON']['output']>;
  isDeleted: Maybe<Scalars['Boolean']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  prediction: Maybe<Scalars['Float']['output']>;
  predictionId: Maybe<Scalars['String']['output']>;
  question: ElicitQuestion;
  sourceId: Maybe<Scalars['String']['output']>;
  sourceUrl: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum ElicitQuestionPredictionOrderByInput {
  Foobar = 'foobar'
}

export type ElicitQuestionPredictionOutput = {
  __typename?: 'ElicitQuestionPredictionOutput';
  data: Maybe<ElicitQuestionPrediction>;
};

export type ElicitQuestionPredictionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ElicitQuestionPredictionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ElicitQuestionPredictionSelectorInput>>>;
};

export type ElicitQuestionPredictionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ElicitQuestionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ElicitQuestionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ElicitQuestionSelectorInput>>>;
};

export type ElicitQuestionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ElicitUser = {
  __typename?: 'ElicitUser';
  _id: Maybe<Scalars['String']['output']>;
  displayName: Maybe<Scalars['String']['output']>;
  isQuestionCreator: Maybe<Scalars['Boolean']['output']>;
  lwUser: Maybe<User>;
  sourceUserId: Maybe<Scalars['String']['output']>;
};

export type EmailPreview = {
  __typename?: 'EmailPreview';
  html: Maybe<Scalars['String']['output']>;
  subject: Maybe<Scalars['String']['output']>;
  text: Maybe<Scalars['String']['output']>;
  to: Maybe<Scalars['String']['output']>;
};

export type EmailTokens = {
  __typename?: 'EmailTokens';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum EmailTokensOrderByInput {
  Foobar = 'foobar'
}

export type EmailTokensOutput = {
  __typename?: 'EmailTokensOutput';
  data: Maybe<EmailTokens>;
};

export type EmailTokensSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<EmailTokensSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<EmailTokensSelectorInput>>>;
};

export type EmailTokensSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ExternalPost = {
  __typename?: 'ExternalPost';
  _id: Scalars['String']['output'];
  coauthorStatuses: Maybe<Array<Maybe<CoauthorStatus>>>;
  content: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  draft: Maybe<Scalars['Boolean']['output']>;
  modifiedAt: Maybe<Scalars['Date']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type ExternalPostImportData = {
  __typename?: 'ExternalPostImportData';
  alreadyExists: Maybe<Scalars['Boolean']['output']>;
  post: Maybe<ExternalPost>;
};

export type FeaturedResource = {
  __typename?: 'FeaturedResource';
  _id: Scalars['String']['output'];
  body: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  ctaText: Maybe<Scalars['String']['output']>;
  ctaUrl: Maybe<Scalars['String']['output']>;
  expiresAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export enum FeaturedResourceOrderByInput {
  Foobar = 'foobar'
}

export type FeaturedResourceOutput = {
  __typename?: 'FeaturedResourceOutput';
  data: Maybe<FeaturedResource>;
};

export type FeaturedResourceSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<FeaturedResourceSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<FeaturedResourceSelectorInput>>>;
};

export type FeaturedResourceSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type FieldChange = {
  __typename?: 'FieldChange';
  _id: Scalars['String']['output'];
  changeGroup: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  fieldName: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  newValue: Maybe<Scalars['JSON']['output']>;
  oldValue: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum FieldChangeOrderByInput {
  Foobar = 'foobar'
}

export type FieldChangeOutput = {
  __typename?: 'FieldChangeOutput';
  data: Maybe<FieldChange>;
};

export type FieldChangeSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<FieldChangeSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<FieldChangeSelectorInput>>>;
};

export type FieldChangeSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ForumEvent = {
  __typename?: 'ForumEvent';
  _id: Scalars['String']['output'];
  bannerImageId: Maybe<Scalars['String']['output']>;
  bannerTextColor: Maybe<Scalars['String']['output']>;
  commentPrompt: Maybe<Scalars['String']['output']>;
  contrastColor: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  customComponent: Maybe<Scalars['String']['output']>;
  darkColor: Maybe<Scalars['String']['output']>;
  endDate: Maybe<Scalars['Date']['output']>;
  eventFormat: Maybe<Scalars['String']['output']>;
  frontpageDescription: Maybe<Revision>;
  frontpageDescriptionMobile: Maybe<Revision>;
  frontpageDescriptionMobile_latest: Maybe<Scalars['String']['output']>;
  frontpageDescription_latest: Maybe<Scalars['String']['output']>;
  includesPoll: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  lightColor: Maybe<Scalars['String']['output']>;
  maxStickersPerUser: Maybe<Scalars['Float']['output']>;
  pollAgreeWording: Maybe<Scalars['String']['output']>;
  pollDisagreeWording: Maybe<Scalars['String']['output']>;
  pollQuestion: Maybe<Revision>;
  pollQuestion_latest: Maybe<Scalars['String']['output']>;
  post: Maybe<Post>;
  postId: Maybe<Scalars['String']['output']>;
  postPageDescription: Maybe<Revision>;
  postPageDescription_latest: Maybe<Scalars['String']['output']>;
  publicData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  startDate: Maybe<Scalars['Date']['output']>;
  tag: Maybe<Tag>;
  tagId: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  voteCount: Scalars['Int']['output'];
};


export type ForumEventFrontpageDescriptionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type ForumEventFrontpageDescriptionMobileArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type ForumEventPollQuestionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type ForumEventPostPageDescriptionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum ForumEventOrderByInput {
  Foobar = 'foobar'
}

export type ForumEventOutput = {
  __typename?: 'ForumEventOutput';
  data: Maybe<ForumEvent>;
};

export type ForumEventSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ForumEventSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ForumEventSelectorInput>>>;
};

export type ForumEventSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type GardenCode = {
  __typename?: 'GardenCode';
  _id: Scalars['String']['output'];
  afOnly: Maybe<Scalars['Boolean']['output']>;
  code: Maybe<Scalars['String']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  endTime: Maybe<Scalars['Date']['output']>;
  fbLink: Maybe<Scalars['String']['output']>;
  hidden: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  startTime: Maybe<Scalars['Date']['output']>;
  title: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};


export type GardenCodeContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum GardenCodeOrderByInput {
  Foobar = 'foobar'
}

export type GardenCodeOutput = {
  __typename?: 'GardenCodeOutput';
  data: Maybe<GardenCode>;
};

export type GardenCodeSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<GardenCodeSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<GardenCodeSelectorInput>>>;
};

export type GardenCodeSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type GivingSeasonHeart = {
  __typename?: 'GivingSeasonHeart';
  displayName: Scalars['String']['output'];
  theta: Scalars['Float']['output'];
  userId: Scalars['String']['output'];
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type GoogleServiceAccountSession = {
  __typename?: 'GoogleServiceAccountSession';
  _id: Scalars['String']['output'];
  active: Maybe<Scalars['Boolean']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  email: Maybe<Scalars['String']['output']>;
  estimatedExpiry: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  refreshToken: Maybe<Scalars['String']['output']>;
  revoked: Maybe<Scalars['Boolean']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum GoogleServiceAccountSessionOrderByInput {
  Foobar = 'foobar'
}

export type GoogleServiceAccountSessionOutput = {
  __typename?: 'GoogleServiceAccountSessionOutput';
  data: Maybe<GoogleServiceAccountSession>;
};

export type GoogleServiceAccountSessionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<GoogleServiceAccountSessionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<GoogleServiceAccountSessionSelectorInput>>>;
};

export type GoogleServiceAccountSessionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type GoogleVertexPostsResult = {
  __typename?: 'GoogleVertexPostsResult';
  results: Array<VertexRecommendedPost>;
};

export type Images = {
  __typename?: 'Images';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum ImagesOrderByInput {
  Foobar = 'foobar'
}

export type ImagesOutput = {
  __typename?: 'ImagesOutput';
  data: Maybe<Images>;
};

export type ImagesSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ImagesSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ImagesSelectorInput>>>;
};

export type ImagesSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type JargonTerm = {
  __typename?: 'JargonTerm';
  _id: Scalars['String']['output'];
  altTerms: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  approved: Maybe<Scalars['Boolean']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  humansAndOrAIEdited: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  post: Maybe<Post>;
  postId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  term: Maybe<Scalars['String']['output']>;
};


export type JargonTermContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum JargonTermOrderByInput {
  Foobar = 'foobar'
}

export type JargonTermOutput = {
  __typename?: 'JargonTermOutput';
  data: Maybe<JargonTerm>;
};

export type JargonTermSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<JargonTermSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<JargonTermSelectorInput>>>;
};

export type JargonTermSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type KarmaChanges = {
  __typename?: 'KarmaChanges';
  comments: Maybe<Array<Maybe<CommentKarmaChange>>>;
  endDate: Maybe<Scalars['Date']['output']>;
  nextBatchDate: Maybe<Scalars['Date']['output']>;
  posts: Maybe<Array<Maybe<PostKarmaChange>>>;
  startDate: Maybe<Scalars['Date']['output']>;
  tagRevisions: Maybe<Array<Maybe<RevisionsKarmaChange>>>;
  thisWeeksKarmaChanges: Maybe<KarmaChangesSimple>;
  todaysKarmaChanges: Maybe<KarmaChangesSimple>;
  totalChange: Maybe<Scalars['Int']['output']>;
  updateFrequency: Maybe<Scalars['String']['output']>;
};

export type KarmaChangesSimple = {
  __typename?: 'KarmaChangesSimple';
  comments: Maybe<Array<Maybe<CommentKarmaChange>>>;
  posts: Maybe<Array<Maybe<PostKarmaChange>>>;
  tagRevisions: Maybe<Array<Maybe<RevisionsKarmaChange>>>;
};

export type LwEvent = {
  __typename?: 'LWEvent';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  important: Maybe<Scalars['Boolean']['output']>;
  intercom: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  name: Maybe<Scalars['String']['output']>;
  properties: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum LwEventOrderByInput {
  Foobar = 'foobar'
}

export type LwEventOutput = {
  __typename?: 'LWEventOutput';
  data: Maybe<LwEvent>;
};

export type LwEventSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<LwEventSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<LwEventSelectorInput>>>;
};

export type LwEventSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type LatLng = {
  __typename?: 'LatLng';
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
};

export type LegacyData = {
  __typename?: 'LegacyData';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum LegacyDataOrderByInput {
  Foobar = 'foobar'
}

export type LegacyDataOutput = {
  __typename?: 'LegacyDataOutput';
  data: Maybe<LegacyData>;
};

export type LegacyDataSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<LegacyDataSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<LegacyDataSelectorInput>>>;
};

export type LegacyDataSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type LlmConversation = {
  __typename?: 'LlmConversation';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  lastUpdatedAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  messages: Maybe<Array<Maybe<LlmMessage>>>;
  model: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  systemPrompt: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  totalCharacterCount: Maybe<Scalars['Int']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum LlmConversationOrderByInput {
  Foobar = 'foobar'
}

export type LlmConversationOutput = {
  __typename?: 'LlmConversationOutput';
  data: Maybe<LlmConversation>;
};

export type LlmConversationSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<LlmConversationSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<LlmConversationSelectorInput>>>;
};

export type LlmConversationSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type LlmMessage = {
  __typename?: 'LlmMessage';
  _id: Scalars['String']['output'];
  content: Maybe<Scalars['String']['output']>;
  conversationId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  role: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum LlmMessageOrderByInput {
  Foobar = 'foobar'
}

export type LlmMessageOutput = {
  __typename?: 'LlmMessageOutput';
  data: Maybe<LlmMessage>;
};

export type LlmMessageSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<LlmMessageSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<LlmMessageSelectorInput>>>;
};

export type LlmMessageSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Localgroup = {
  __typename?: 'Localgroup';
  _id: Scalars['String']['output'];
  bannerImageId: Maybe<Scalars['String']['output']>;
  categories: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  contactInfo: Maybe<Scalars['String']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  facebookLink: Maybe<Scalars['String']['output']>;
  facebookPageLink: Maybe<Scalars['String']['output']>;
  googleLocation: Maybe<Scalars['JSON']['output']>;
  inactive: Maybe<Scalars['Boolean']['output']>;
  isOnline: Maybe<Scalars['Boolean']['output']>;
  lastActivity: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  location: Maybe<Scalars['String']['output']>;
  meetupLink: Maybe<Scalars['String']['output']>;
  mongoLocation: Maybe<Scalars['JSON']['output']>;
  name: Maybe<Scalars['String']['output']>;
  nameInAnotherLanguage: Maybe<Scalars['String']['output']>;
  organizerIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  organizers: Array<User>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  slackLink: Maybe<Scalars['String']['output']>;
  types: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  website: Maybe<Scalars['String']['output']>;
};


export type LocalgroupContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum LocalgroupOrderByInput {
  Foobar = 'foobar'
}

export type LocalgroupOutput = {
  __typename?: 'LocalgroupOutput';
  data: Maybe<Localgroup>;
};

export type LocalgroupSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<LocalgroupSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<LocalgroupSelectorInput>>>;
};

export type LocalgroupSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type LoginReturnData = {
  __typename?: 'LoginReturnData';
  token: Maybe<Scalars['String']['output']>;
};

export type ManifoldProbabilitiesCache = {
  __typename?: 'ManifoldProbabilitiesCache';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  isResolved: Maybe<Scalars['Boolean']['output']>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  marketId: Maybe<Scalars['String']['output']>;
  probability: Maybe<Scalars['Float']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  url: Maybe<Scalars['String']['output']>;
  year: Maybe<Scalars['Float']['output']>;
};

export enum ManifoldProbabilitiesCacheOrderByInput {
  Foobar = 'foobar'
}

export type ManifoldProbabilitiesCacheOutput = {
  __typename?: 'ManifoldProbabilitiesCacheOutput';
  data: Maybe<ManifoldProbabilitiesCache>;
};

export type ManifoldProbabilitiesCacheSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ManifoldProbabilitiesCacheSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ManifoldProbabilitiesCacheSelectorInput>>>;
};

export type ManifoldProbabilitiesCacheSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Message = {
  __typename?: 'Message';
  _id: Scalars['String']['output'];
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  conversation: Conversation;
  conversationId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  noEmail: Maybe<Scalars['Boolean']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};


export type MessageContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum MessageOrderByInput {
  Foobar = 'foobar'
}

export type MessageOutput = {
  __typename?: 'MessageOutput';
  data: Maybe<Message>;
};

export type MessageSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<MessageSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<MessageSelectorInput>>>;
};

export type MessageSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Migration = {
  __typename?: 'Migration';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum MigrationOrderByInput {
  Foobar = 'foobar'
}

export type MigrationOutput = {
  __typename?: 'MigrationOutput';
  data: Maybe<Migration>;
};

export type MigrationRun = {
  __typename?: 'MigrationRun';
  finished: Maybe<Scalars['Date']['output']>;
  name: Scalars['String']['output'];
  started: Scalars['Date']['output'];
  succeeded: Maybe<Scalars['Boolean']['output']>;
};

export type MigrationSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<MigrationSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<MigrationSelectorInput>>>;
};

export type MigrationSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type MigrationStatus = {
  __typename?: 'MigrationStatus';
  dateWritten: Maybe<Scalars['String']['output']>;
  lastRun: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  runs: Maybe<Array<MigrationRun>>;
};

export type MigrationsDashboardData = {
  __typename?: 'MigrationsDashboardData';
  migrations: Maybe<Array<MigrationStatus>>;
};

export type ModerationTemplate = {
  __typename?: 'ModerationTemplate';
  _id: Scalars['String']['output'];
  collectionName: Maybe<Scalars['String']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  name: Maybe<Scalars['String']['output']>;
  order: Maybe<Scalars['Float']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};


export type ModerationTemplateContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum ModerationTemplateOrderByInput {
  Foobar = 'foobar'
}

export type ModerationTemplateOutput = {
  __typename?: 'ModerationTemplateOutput';
  data: Maybe<ModerationTemplate>;
};

export type ModerationTemplateSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ModerationTemplateSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ModerationTemplateSelectorInput>>>;
};

export type ModerationTemplateSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ModeratorAction = {
  __typename?: 'ModeratorAction';
  _id: Scalars['String']['output'];
  active: Scalars['Boolean']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  endedAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  type: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum ModeratorActionOrderByInput {
  Foobar = 'foobar'
}

export type ModeratorActionOutput = {
  __typename?: 'ModeratorActionOutput';
  data: Maybe<ModeratorAction>;
};

export type ModeratorActionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ModeratorActionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ModeratorActionSelectorInput>>>;
};

export type ModeratorActionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ModeratorIpAddressInfo = {
  __typename?: 'ModeratorIPAddressInfo';
  ip: Scalars['String']['output'];
  userIds: Array<Scalars['String']['output']>;
};

export type MostReadAuthor = {
  __typename?: 'MostReadAuthor';
  _id: Maybe<Scalars['String']['output']>;
  count: Maybe<Scalars['Int']['output']>;
  displayName: Maybe<Scalars['String']['output']>;
  engagementPercentile: Maybe<Scalars['Float']['output']>;
  profileImageId: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
};

export type MostReadTopic = {
  __typename?: 'MostReadTopic';
  count: Maybe<Scalars['Int']['output']>;
  name: Maybe<Scalars['String']['output']>;
  shortName: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
};

export type MostReceivedReact = {
  __typename?: 'MostReceivedReact';
  count: Maybe<Scalars['Int']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

export type MultiAdvisorRequestInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<AdvisorRequestOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<AdvisorRequestSelectorInput>;
};

export type MultiAdvisorRequestOutput = {
  __typename?: 'MultiAdvisorRequestOutput';
  results: Maybe<Array<Maybe<AdvisorRequest>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiArbitalCachesInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ArbitalCachesOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ArbitalCachesSelectorInput>;
};

export type MultiArbitalCachesOutput = {
  __typename?: 'MultiArbitalCachesOutput';
  results: Maybe<Array<Maybe<ArbitalCaches>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiArbitalTagContentRelInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ArbitalTagContentRelOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ArbitalTagContentRelSelectorInput>;
};

export type MultiArbitalTagContentRelOutput = {
  __typename?: 'MultiArbitalTagContentRelOutput';
  results: Maybe<Array<Maybe<ArbitalTagContentRel>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiBanInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<BanOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<BanSelectorInput>;
};

export type MultiBanOutput = {
  __typename?: 'MultiBanOutput';
  results: Maybe<Array<Maybe<Ban>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiBookInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<BookOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<BookSelectorInput>;
};

export type MultiBookOutput = {
  __typename?: 'MultiBookOutput';
  results: Maybe<Array<Maybe<Book>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiChapterInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ChapterOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ChapterSelectorInput>;
};

export type MultiChapterOutput = {
  __typename?: 'MultiChapterOutput';
  results: Maybe<Array<Maybe<Chapter>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiCkEditorUserSessionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<CkEditorUserSessionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CkEditorUserSessionSelectorInput>;
};

export type MultiCkEditorUserSessionOutput = {
  __typename?: 'MultiCkEditorUserSessionOutput';
  results: Maybe<Array<Maybe<CkEditorUserSession>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiClientIdInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ClientIdOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ClientIdSelectorInput>;
};

export type MultiClientIdOutput = {
  __typename?: 'MultiClientIdOutput';
  results: Maybe<Array<Maybe<ClientId>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiCollectionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<CollectionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CollectionSelectorInput>;
};

export type MultiCollectionOutput = {
  __typename?: 'MultiCollectionOutput';
  results: Maybe<Array<Maybe<Collection>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiCommentInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<CommentOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CommentSelectorInput>;
};

export type MultiCommentModeratorActionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<CommentModeratorActionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CommentModeratorActionSelectorInput>;
};

export type MultiCommentModeratorActionOutput = {
  __typename?: 'MultiCommentModeratorActionOutput';
  results: Maybe<Array<Maybe<CommentModeratorAction>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiCommentOutput = {
  __typename?: 'MultiCommentOutput';
  results: Maybe<Array<Maybe<Comment>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiConversationInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ConversationOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ConversationSelectorInput>;
};

export type MultiConversationOutput = {
  __typename?: 'MultiConversationOutput';
  results: Maybe<Array<Maybe<Conversation>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiCronHistoryInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<CronHistoryOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CronHistorySelectorInput>;
};

export type MultiCronHistoryOutput = {
  __typename?: 'MultiCronHistoryOutput';
  results: Maybe<Array<Maybe<CronHistory>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiCurationEmailInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<CurationEmailOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CurationEmailSelectorInput>;
};

export type MultiCurationEmailOutput = {
  __typename?: 'MultiCurationEmailOutput';
  results: Maybe<Array<Maybe<CurationEmail>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiCurationNoticeInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<CurationNoticeOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CurationNoticeSelectorInput>;
};

export type MultiCurationNoticeOutput = {
  __typename?: 'MultiCurationNoticeOutput';
  results: Maybe<Array<Maybe<CurationNotice>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiDatabaseMetadataInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<DatabaseMetadataOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DatabaseMetadataSelectorInput>;
};

export type MultiDatabaseMetadataOutput = {
  __typename?: 'MultiDatabaseMetadataOutput';
  results: Maybe<Array<Maybe<DatabaseMetadata>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiDebouncerEventsInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<DebouncerEventsOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DebouncerEventsSelectorInput>;
};

export type MultiDebouncerEventsOutput = {
  __typename?: 'MultiDebouncerEventsOutput';
  results: Maybe<Array<Maybe<DebouncerEvents>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiDialogueCheckInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<DialogueCheckOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DialogueCheckSelectorInput>;
};

export type MultiDialogueCheckOutput = {
  __typename?: 'MultiDialogueCheckOutput';
  results: Maybe<Array<Maybe<DialogueCheck>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiDialogueMatchPreferenceInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<DialogueMatchPreferenceOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DialogueMatchPreferenceSelectorInput>;
};

export type MultiDialogueMatchPreferenceOutput = {
  __typename?: 'MultiDialogueMatchPreferenceOutput';
  results: Maybe<Array<Maybe<DialogueMatchPreference>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiDigestInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<DigestOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DigestSelectorInput>;
};

export type MultiDigestOutput = {
  __typename?: 'MultiDigestOutput';
  results: Maybe<Array<Maybe<Digest>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiDigestPostInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<DigestPostOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DigestPostSelectorInput>;
};

export type MultiDigestPostOutput = {
  __typename?: 'MultiDigestPostOutput';
  results: Maybe<Array<Maybe<DigestPost>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiDocument = {
  __typename?: 'MultiDocument';
  _id: Scalars['String']['output'];
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
  arbitalLinkedPages: Maybe<ArbitalLinkedPages>;
  baseScore: Maybe<Scalars['Float']['output']>;
  collectionName: Maybe<Scalars['String']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  contributionStats: Maybe<Scalars['JSON']['output']>;
  contributors: Maybe<TagContributorsList>;
  createdAt: Maybe<Scalars['Date']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  fieldName: Maybe<Scalars['String']['output']>;
  htmlWithContributorAnnotations: Maybe<Scalars['String']['output']>;
  index: Maybe<Scalars['Float']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  oldSlugs: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  parentDocumentId: Maybe<Scalars['String']['output']>;
  parentLens: Maybe<MultiDocument>;
  parentTag: Maybe<Tag>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  preview: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  summaries: Array<MultiDocument>;
  tabSubtitle: Maybe<Scalars['String']['output']>;
  tabTitle: Maybe<Scalars['String']['output']>;
  tableOfContents: Maybe<Scalars['JSON']['output']>;
  textLastUpdatedAt: Maybe<Scalars['Date']['output']>;
  title: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
};


export type MultiDocumentContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type MultiDocumentContributorsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
};


export type MultiDocumentTableOfContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum MultiDocumentOrderByInput {
  Foobar = 'foobar'
}

export type MultiDocumentOutput = {
  __typename?: 'MultiDocumentOutput';
  data: Maybe<MultiDocument>;
};

export type MultiDocumentSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<MultiDocumentSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<MultiDocumentSelectorInput>>>;
};

export type MultiDocumentSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type MultiElectionCandidateInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ElectionCandidateOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ElectionCandidateSelectorInput>;
};

export type MultiElectionCandidateOutput = {
  __typename?: 'MultiElectionCandidateOutput';
  results: Maybe<Array<Maybe<ElectionCandidate>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiElectionVoteInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ElectionVoteOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ElectionVoteSelectorInput>;
};

export type MultiElectionVoteOutput = {
  __typename?: 'MultiElectionVoteOutput';
  results: Maybe<Array<Maybe<ElectionVote>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiElicitQuestionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ElicitQuestionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ElicitQuestionSelectorInput>;
};

export type MultiElicitQuestionOutput = {
  __typename?: 'MultiElicitQuestionOutput';
  results: Maybe<Array<Maybe<ElicitQuestion>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiElicitQuestionPredictionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ElicitQuestionPredictionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ElicitQuestionPredictionSelectorInput>;
};

export type MultiElicitQuestionPredictionOutput = {
  __typename?: 'MultiElicitQuestionPredictionOutput';
  results: Maybe<Array<Maybe<ElicitQuestionPrediction>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiEmailTokensInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<EmailTokensOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<EmailTokensSelectorInput>;
};

export type MultiEmailTokensOutput = {
  __typename?: 'MultiEmailTokensOutput';
  results: Maybe<Array<Maybe<EmailTokens>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiFeaturedResourceInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<FeaturedResourceOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<FeaturedResourceSelectorInput>;
};

export type MultiFeaturedResourceOutput = {
  __typename?: 'MultiFeaturedResourceOutput';
  results: Maybe<Array<Maybe<FeaturedResource>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiFieldChangeInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<FieldChangeOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<FieldChangeSelectorInput>;
};

export type MultiFieldChangeOutput = {
  __typename?: 'MultiFieldChangeOutput';
  results: Maybe<Array<Maybe<FieldChange>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiForumEventInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ForumEventOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ForumEventSelectorInput>;
};

export type MultiForumEventOutput = {
  __typename?: 'MultiForumEventOutput';
  results: Maybe<Array<Maybe<ForumEvent>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiGardenCodeInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<GardenCodeOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<GardenCodeSelectorInput>;
};

export type MultiGardenCodeOutput = {
  __typename?: 'MultiGardenCodeOutput';
  results: Maybe<Array<Maybe<GardenCode>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiGoogleServiceAccountSessionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<GoogleServiceAccountSessionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<GoogleServiceAccountSessionSelectorInput>;
};

export type MultiGoogleServiceAccountSessionOutput = {
  __typename?: 'MultiGoogleServiceAccountSessionOutput';
  results: Maybe<Array<Maybe<GoogleServiceAccountSession>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiImagesInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ImagesOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ImagesSelectorInput>;
};

export type MultiImagesOutput = {
  __typename?: 'MultiImagesOutput';
  results: Maybe<Array<Maybe<Images>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiJargonTermInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<JargonTermOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<JargonTermSelectorInput>;
};

export type MultiJargonTermOutput = {
  __typename?: 'MultiJargonTermOutput';
  results: Maybe<Array<Maybe<JargonTerm>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiLwEventInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<LwEventOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LwEventSelectorInput>;
};

export type MultiLwEventOutput = {
  __typename?: 'MultiLWEventOutput';
  results: Maybe<Array<Maybe<LwEvent>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiLegacyDataInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<LegacyDataOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LegacyDataSelectorInput>;
};

export type MultiLegacyDataOutput = {
  __typename?: 'MultiLegacyDataOutput';
  results: Maybe<Array<Maybe<LegacyData>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiLlmConversationInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<LlmConversationOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LlmConversationSelectorInput>;
};

export type MultiLlmConversationOutput = {
  __typename?: 'MultiLlmConversationOutput';
  results: Maybe<Array<Maybe<LlmConversation>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiLlmMessageInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<LlmMessageOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LlmMessageSelectorInput>;
};

export type MultiLlmMessageOutput = {
  __typename?: 'MultiLlmMessageOutput';
  results: Maybe<Array<Maybe<LlmMessage>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiLocalgroupInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<LocalgroupOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LocalgroupSelectorInput>;
};

export type MultiLocalgroupOutput = {
  __typename?: 'MultiLocalgroupOutput';
  results: Maybe<Array<Maybe<Localgroup>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiManifoldProbabilitiesCacheInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ManifoldProbabilitiesCacheOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ManifoldProbabilitiesCacheSelectorInput>;
};

export type MultiManifoldProbabilitiesCacheOutput = {
  __typename?: 'MultiManifoldProbabilitiesCacheOutput';
  results: Maybe<Array<Maybe<ManifoldProbabilitiesCache>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiMessageInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<MessageOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<MessageSelectorInput>;
};

export type MultiMessageOutput = {
  __typename?: 'MultiMessageOutput';
  results: Maybe<Array<Maybe<Message>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiMigrationInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<MigrationOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<MigrationSelectorInput>;
};

export type MultiMigrationOutput = {
  __typename?: 'MultiMigrationOutput';
  results: Maybe<Array<Maybe<Migration>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiModerationTemplateInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ModerationTemplateOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ModerationTemplateSelectorInput>;
};

export type MultiModerationTemplateOutput = {
  __typename?: 'MultiModerationTemplateOutput';
  results: Maybe<Array<Maybe<ModerationTemplate>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiModeratorActionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ModeratorActionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ModeratorActionSelectorInput>;
};

export type MultiModeratorActionOutput = {
  __typename?: 'MultiModeratorActionOutput';
  results: Maybe<Array<Maybe<ModeratorAction>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiMultiDocumentInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<MultiDocumentOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<MultiDocumentSelectorInput>;
};

export type MultiMultiDocumentOutput = {
  __typename?: 'MultiMultiDocumentOutput';
  results: Maybe<Array<Maybe<MultiDocument>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiNotificationInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<NotificationOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<NotificationSelectorInput>;
};

export type MultiNotificationOutput = {
  __typename?: 'MultiNotificationOutput';
  results: Maybe<Array<Maybe<Notification>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPageCacheEntryInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PageCacheEntryOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PageCacheEntrySelectorInput>;
};

export type MultiPageCacheEntryOutput = {
  __typename?: 'MultiPageCacheEntryOutput';
  results: Maybe<Array<Maybe<PageCacheEntry>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPetrovDayActionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PetrovDayActionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PetrovDayActionSelectorInput>;
};

export type MultiPetrovDayActionOutput = {
  __typename?: 'MultiPetrovDayActionOutput';
  results: Maybe<Array<Maybe<PetrovDayAction>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPetrovDayLaunchInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PetrovDayLaunchOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PetrovDayLaunchSelectorInput>;
};

export type MultiPetrovDayLaunchOutput = {
  __typename?: 'MultiPetrovDayLaunchOutput';
  results: Maybe<Array<Maybe<PetrovDayLaunch>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPodcastEpisodeInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PodcastEpisodeOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PodcastEpisodeSelectorInput>;
};

export type MultiPodcastEpisodeOutput = {
  __typename?: 'MultiPodcastEpisodeOutput';
  results: Maybe<Array<Maybe<PodcastEpisode>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPodcastInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PodcastOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PodcastSelectorInput>;
};

export type MultiPodcastOutput = {
  __typename?: 'MultiPodcastOutput';
  results: Maybe<Array<Maybe<Podcast>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPostAnalyticsResult = {
  __typename?: 'MultiPostAnalyticsResult';
  posts: Maybe<Array<Maybe<PostAnalytics2Result>>>;
  totalCount: Scalars['Int']['output'];
};

export type MultiPostEmbeddingInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PostEmbeddingOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostEmbeddingSelectorInput>;
};

export type MultiPostEmbeddingOutput = {
  __typename?: 'MultiPostEmbeddingOutput';
  results: Maybe<Array<Maybe<PostEmbedding>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPostInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PostOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostSelectorInput>;
};

export type MultiPostOutput = {
  __typename?: 'MultiPostOutput';
  results: Maybe<Array<Maybe<Post>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPostRecommendationInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PostRecommendationOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostRecommendationSelectorInput>;
};

export type MultiPostRecommendationOutput = {
  __typename?: 'MultiPostRecommendationOutput';
  results: Maybe<Array<Maybe<PostRecommendation>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPostRelationInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PostRelationOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostRelationSelectorInput>;
};

export type MultiPostRelationOutput = {
  __typename?: 'MultiPostRelationOutput';
  results: Maybe<Array<Maybe<PostRelation>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPostViewTimeInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PostViewTimeOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostViewTimeSelectorInput>;
};

export type MultiPostViewTimeOutput = {
  __typename?: 'MultiPostViewTimeOutput';
  results: Maybe<Array<Maybe<PostViewTime>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiPostViewsInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<PostViewsOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostViewsSelectorInput>;
};

export type MultiPostViewsOutput = {
  __typename?: 'MultiPostViewsOutput';
  results: Maybe<Array<Maybe<PostViews>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiRssFeedInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<RssFeedOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<RssFeedSelectorInput>;
};

export type MultiRssFeedOutput = {
  __typename?: 'MultiRSSFeedOutput';
  results: Maybe<Array<Maybe<RssFeed>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiReadStatusInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ReadStatusOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReadStatusSelectorInput>;
};

export type MultiReadStatusOutput = {
  __typename?: 'MultiReadStatusOutput';
  results: Maybe<Array<Maybe<ReadStatus>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiRecommendationsCacheInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<RecommendationsCacheOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<RecommendationsCacheSelectorInput>;
};

export type MultiRecommendationsCacheOutput = {
  __typename?: 'MultiRecommendationsCacheOutput';
  results: Maybe<Array<Maybe<RecommendationsCache>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiReportInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ReportOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReportSelectorInput>;
};

export type MultiReportOutput = {
  __typename?: 'MultiReportOutput';
  results: Maybe<Array<Maybe<Report>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiReviewVoteInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ReviewVoteOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReviewVoteSelectorInput>;
};

export type MultiReviewVoteOutput = {
  __typename?: 'MultiReviewVoteOutput';
  results: Maybe<Array<Maybe<ReviewVote>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiReviewWinnerArtInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ReviewWinnerArtOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReviewWinnerArtSelectorInput>;
};

export type MultiReviewWinnerArtOutput = {
  __typename?: 'MultiReviewWinnerArtOutput';
  results: Maybe<Array<Maybe<ReviewWinnerArt>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiReviewWinnerInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<ReviewWinnerOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReviewWinnerSelectorInput>;
};

export type MultiReviewWinnerOutput = {
  __typename?: 'MultiReviewWinnerOutput';
  results: Maybe<Array<Maybe<ReviewWinner>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiRevisionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<RevisionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<RevisionSelectorInput>;
};

export type MultiRevisionOutput = {
  __typename?: 'MultiRevisionOutput';
  results: Maybe<Array<Maybe<Revision>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSequenceInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SequenceOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SequenceSelectorInput>;
};

export type MultiSequenceOutput = {
  __typename?: 'MultiSequenceOutput';
  results: Maybe<Array<Maybe<Sequence>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSessionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SessionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SessionSelectorInput>;
};

export type MultiSessionOutput = {
  __typename?: 'MultiSessionOutput';
  results: Maybe<Array<Maybe<Session>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSideCommentCacheInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SideCommentCacheOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SideCommentCacheSelectorInput>;
};

export type MultiSideCommentCacheOutput = {
  __typename?: 'MultiSideCommentCacheOutput';
  results: Maybe<Array<Maybe<SideCommentCache>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSplashArtCoordinateInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SplashArtCoordinateOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SplashArtCoordinateSelectorInput>;
};

export type MultiSplashArtCoordinateOutput = {
  __typename?: 'MultiSplashArtCoordinateOutput';
  results: Maybe<Array<Maybe<SplashArtCoordinate>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSpotlightInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SpotlightOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SpotlightSelectorInput>;
};

export type MultiSpotlightOutput = {
  __typename?: 'MultiSpotlightOutput';
  results: Maybe<Array<Maybe<Spotlight>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSubscriptionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SubscriptionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SubscriptionSelectorInput>;
};

export type MultiSubscriptionOutput = {
  __typename?: 'MultiSubscriptionOutput';
  results: Maybe<Array<Maybe<Subscription>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSurveyInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SurveyOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SurveySelectorInput>;
};

export type MultiSurveyOutput = {
  __typename?: 'MultiSurveyOutput';
  results: Maybe<Array<Maybe<Survey>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSurveyQuestionInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SurveyQuestionOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SurveyQuestionSelectorInput>;
};

export type MultiSurveyQuestionOutput = {
  __typename?: 'MultiSurveyQuestionOutput';
  results: Maybe<Array<Maybe<SurveyQuestion>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSurveyResponseInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SurveyResponseOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SurveyResponseSelectorInput>;
};

export type MultiSurveyResponseOutput = {
  __typename?: 'MultiSurveyResponseOutput';
  results: Maybe<Array<Maybe<SurveyResponse>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiSurveyScheduleInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<SurveyScheduleOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SurveyScheduleSelectorInput>;
};

export type MultiSurveyScheduleOutput = {
  __typename?: 'MultiSurveyScheduleOutput';
  results: Maybe<Array<Maybe<SurveySchedule>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiTagFlagInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<TagFlagOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TagFlagSelectorInput>;
};

export type MultiTagFlagOutput = {
  __typename?: 'MultiTagFlagOutput';
  results: Maybe<Array<Maybe<TagFlag>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiTagInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<TagOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TagSelectorInput>;
};

export type MultiTagOutput = {
  __typename?: 'MultiTagOutput';
  results: Maybe<Array<Maybe<Tag>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiTagRelInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<TagRelOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TagRelSelectorInput>;
};

export type MultiTagRelOutput = {
  __typename?: 'MultiTagRelOutput';
  results: Maybe<Array<Maybe<TagRel>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiTweetInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<TweetOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TweetSelectorInput>;
};

export type MultiTweetOutput = {
  __typename?: 'MultiTweetOutput';
  results: Maybe<Array<Maybe<Tweet>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiTypingIndicatorInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<TypingIndicatorOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TypingIndicatorSelectorInput>;
};

export type MultiTypingIndicatorOutput = {
  __typename?: 'MultiTypingIndicatorOutput';
  results: Maybe<Array<Maybe<TypingIndicator>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiUserActivityInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<UserActivityOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserActivitySelectorInput>;
};

export type MultiUserActivityOutput = {
  __typename?: 'MultiUserActivityOutput';
  results: Maybe<Array<Maybe<UserActivity>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiUserEagDetailInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<UserEagDetailOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserEagDetailSelectorInput>;
};

export type MultiUserEagDetailOutput = {
  __typename?: 'MultiUserEAGDetailOutput';
  results: Maybe<Array<Maybe<UserEagDetail>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiUserInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<UserOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserSelectorInput>;
};

export type MultiUserJobAdInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<UserJobAdOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserJobAdSelectorInput>;
};

export type MultiUserJobAdOutput = {
  __typename?: 'MultiUserJobAdOutput';
  results: Maybe<Array<Maybe<UserJobAd>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiUserMostValuablePostInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<UserMostValuablePostOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserMostValuablePostSelectorInput>;
};

export type MultiUserMostValuablePostOutput = {
  __typename?: 'MultiUserMostValuablePostOutput';
  results: Maybe<Array<Maybe<UserMostValuablePost>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiUserOutput = {
  __typename?: 'MultiUserOutput';
  results: Maybe<Array<Maybe<User>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiUserRateLimitInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<UserRateLimitOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserRateLimitSelectorInput>;
};

export type MultiUserRateLimitOutput = {
  __typename?: 'MultiUserRateLimitOutput';
  results: Maybe<Array<Maybe<UserRateLimit>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiUserTagRelInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<UserTagRelOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserTagRelSelectorInput>;
};

export type MultiUserTagRelOutput = {
  __typename?: 'MultiUserTagRelOutput';
  results: Maybe<Array<Maybe<UserTagRel>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiVoteInput = {
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  orderBy: InputMaybe<VoteOrderByInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  terms: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<VoteSelectorInput>;
};

export type MultiVoteOutput = {
  __typename?: 'MultiVoteOutput';
  results: Maybe<Array<Maybe<Vote>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  AddForumEventVote: Maybe<Scalars['Boolean']['output']>;
  AddGivingSeasonHeart: Array<GivingSeasonHeart>;
  CancelRSVPToEvent: Maybe<Post>;
  ImportGoogleDoc: Maybe<Post>;
  MakeElicitPrediction: Maybe<ElicitBlockData>;
  MarkAllNotificationsAsRead: Maybe<Scalars['Boolean']['output']>;
  NewUserCompleteProfile: Maybe<NewUserCompletedProfile>;
  PetrovDayLaunchMissile: Maybe<PetrovDayLaunchMissileData>;
  RSVPToEvent: Maybe<Post>;
  RefreshDbSettings: Maybe<Scalars['Boolean']['output']>;
  RemoveForumEventSticker: Maybe<Scalars['Boolean']['output']>;
  RemoveForumEventVote: Maybe<Scalars['Boolean']['output']>;
  RemoveGivingSeasonHeart: Array<GivingSeasonHeart>;
  UpdateSearchSynonyms: Array<Scalars['String']['output']>;
  UserExpandFrontpageSection: Maybe<Scalars['Boolean']['output']>;
  UserUpdateSubforumMembership: Maybe<User>;
  acceptCoauthorRequest: Maybe<Post>;
  addOrUpvoteTag: Maybe<TagRel>;
  addTags: Maybe<Scalars['Boolean']['output']>;
  alignmentComment: Maybe<Comment>;
  alignmentPost: Maybe<Post>;
  analyticsEvent: Maybe<Scalars['Boolean']['output']>;
  autosaveRevision: Maybe<Revision>;
  clickRecommendation: Maybe<Scalars['Boolean']['output']>;
  connectCrossposter: Maybe<Scalars['String']['output']>;
  createAdvisorRequest: Maybe<AdvisorRequestOutput>;
  createArbitalTagContentRel: Maybe<ArbitalTagContentRelOutput>;
  createBan: Maybe<BanOutput>;
  createBook: Maybe<BookOutput>;
  createChapter: Maybe<ChapterOutput>;
  createCollection: Maybe<CollectionOutput>;
  createComment: Maybe<CommentOutput>;
  createCommentModeratorAction: Maybe<CommentModeratorActionOutput>;
  createConversation: Maybe<ConversationOutput>;
  createCurationNotice: Maybe<CurationNoticeOutput>;
  createDialogueMatchPreference: Maybe<DialogueMatchPreferenceOutput>;
  createDigest: Maybe<DigestOutput>;
  createDigestPost: Maybe<DigestPostOutput>;
  createElectionCandidate: Maybe<ElectionCandidateOutput>;
  createElectionVote: Maybe<ElectionVoteOutput>;
  createElicitQuestion: Maybe<ElicitQuestionOutput>;
  createForumEvent: Maybe<ForumEventOutput>;
  createGardenCode: Maybe<GardenCodeOutput>;
  createGoogleServiceAccountSession: Maybe<GoogleServiceAccountSessionOutput>;
  createJargonTerm: Maybe<JargonTermOutput>;
  createLWEvent: Maybe<LwEventOutput>;
  createLlmConversation: Maybe<LlmConversationOutput>;
  createLocalgroup: Maybe<LocalgroupOutput>;
  createMessage: Maybe<MessageOutput>;
  createModerationTemplate: Maybe<ModerationTemplateOutput>;
  createModeratorAction: Maybe<ModeratorActionOutput>;
  createMultiDocument: Maybe<MultiDocumentOutput>;
  createNotification: Maybe<NotificationOutput>;
  createPetrovDayAction: Maybe<PetrovDayActionOutput>;
  createPodcastEpisode: Maybe<PodcastEpisodeOutput>;
  createPost: Maybe<PostOutput>;
  createPostEmbedding: Maybe<PostEmbeddingOutput>;
  createPostViewTime: Maybe<PostViewTimeOutput>;
  createPostViews: Maybe<PostViewsOutput>;
  createRSSFeed: Maybe<RssFeedOutput>;
  createReport: Maybe<ReportOutput>;
  createReviewWinner: Maybe<ReviewWinnerOutput>;
  createReviewWinnerArt: Maybe<ReviewWinnerArtOutput>;
  createSequence: Maybe<SequenceOutput>;
  createSplashArtCoordinate: Maybe<SplashArtCoordinateOutput>;
  createSpotlight: Maybe<SpotlightOutput>;
  createSubscription: Maybe<SubscriptionOutput>;
  createSurvey: Maybe<SurveyOutput>;
  createSurveyQuestion: Maybe<SurveyQuestionOutput>;
  createSurveyResponse: Maybe<SurveyResponseOutput>;
  createSurveySchedule: Maybe<SurveyScheduleOutput>;
  createTag: Maybe<TagOutput>;
  createTagFlag: Maybe<TagFlagOutput>;
  createTagRel: Maybe<TagRelOutput>;
  createUser: Maybe<UserOutput>;
  createUserEAGDetail: Maybe<UserEagDetailOutput>;
  createUserJobAd: Maybe<UserJobAdOutput>;
  createUserMostValuablePost: Maybe<UserMostValuablePostOutput>;
  createUserRateLimit: Maybe<UserRateLimitOutput>;
  createUserTagRel: Maybe<UserTagRelOutput>;
  dismissRecommendation: Maybe<Scalars['Boolean']['output']>;
  editSurvey: Maybe<Survey>;
  flipSplashArtImage: Maybe<Scalars['Boolean']['output']>;
  generateCoverImagesForPost: Maybe<Array<Maybe<ReviewWinnerArt>>>;
  getNewJargonTerms: Maybe<Array<Maybe<JargonTerm>>>;
  importUrlAsDraftPost: ExternalPostImportData;
  increasePostViewCount: Maybe<Scalars['Float']['output']>;
  lockThread: Scalars['Boolean']['output'];
  login: Maybe<LoginReturnData>;
  logout: Maybe<LoginReturnData>;
  markAsReadOrUnread: Maybe<Scalars['Boolean']['output']>;
  markConversationRead: Scalars['Boolean']['output'];
  markPostCommentsRead: Maybe<Scalars['Boolean']['output']>;
  mergeTags: Maybe<Scalars['Boolean']['output']>;
  moderateComment: Maybe<Comment>;
  observeRecommendation: Maybe<Scalars['Boolean']['output']>;
  performVoteComment: Maybe<VoteResultComment>;
  performVoteElectionCandidate: Maybe<VoteResultElectionCandidate>;
  performVoteMultiDocument: Maybe<VoteResultMultiDocument>;
  performVotePost: Maybe<VoteResultPost>;
  performVoteRevision: Maybe<VoteResultRevision>;
  performVoteTag: Maybe<VoteResultTag>;
  performVoteTagRel: Maybe<VoteResultTagRel>;
  promoteLensToMain: Maybe<Scalars['Boolean']['output']>;
  publishAndDeDuplicateSpotlight: Maybe<Spotlight>;
  reorderSummaries: Maybe<Scalars['Boolean']['output']>;
  resetPassword: Maybe<Scalars['String']['output']>;
  resyncRssFeed: Scalars['Boolean']['output'];
  revertPostToRevision: Maybe<Post>;
  revertTagToRevision: Maybe<Tag>;
  revokeGoogleServiceAccountTokens: Scalars['Boolean']['output'];
  sendEventTriggeredDM: Scalars['Boolean']['output'];
  sendNewDialogueMessageNotification: Scalars['Boolean']['output'];
  sendVertexMediaCompleteEvent: Scalars['Boolean']['output'];
  sendVertexViewHomePageEvent: Scalars['Boolean']['output'];
  sendVertexViewItemEvent: Scalars['Boolean']['output'];
  setIsBookmarked: User;
  setIsHidden: User;
  setVoteComment: Maybe<Comment>;
  setVoteElectionCandidate: Maybe<ElectionCandidate>;
  setVoteMultiDocument: Maybe<MultiDocument>;
  setVotePost: Maybe<Post>;
  setVoteRevision: Maybe<Revision>;
  setVoteTag: Maybe<Tag>;
  setVoteTagRel: Maybe<TagRel>;
  signup: Maybe<LoginReturnData>;
  submitReviewVote: Maybe<Post>;
  unlinkCrossposter: Maybe<Scalars['String']['output']>;
  unlockPost: Maybe<Post>;
  unlockThread: Scalars['Boolean']['output'];
  updateAdvisorRequest: Maybe<AdvisorRequestOutput>;
  updateArbitalTagContentRel: Maybe<ArbitalTagContentRelOutput>;
  updateBan: Maybe<BanOutput>;
  updateBook: Maybe<BookOutput>;
  updateChapter: Maybe<ChapterOutput>;
  updateCollection: Maybe<CollectionOutput>;
  updateComment: Maybe<CommentOutput>;
  updateCommentModeratorAction: Maybe<CommentModeratorActionOutput>;
  updateContinueReading: Maybe<Scalars['Boolean']['output']>;
  updateConversation: Maybe<ConversationOutput>;
  updateCurationNotice: Maybe<CurationNoticeOutput>;
  updateDialogueMatchPreference: Maybe<DialogueMatchPreferenceOutput>;
  updateDigest: Maybe<DigestOutput>;
  updateDigestPost: Maybe<DigestPostOutput>;
  updateElectionCandidate: Maybe<ElectionCandidateOutput>;
  updateElectionVote: Maybe<ElectionVoteOutput>;
  updateElicitQuestion: Maybe<ElicitQuestionOutput>;
  updateForumEvent: Maybe<ForumEventOutput>;
  updateGardenCode: Maybe<GardenCodeOutput>;
  updateGoogleServiceAccountSession: Maybe<GoogleServiceAccountSessionOutput>;
  updateJargonTerm: Maybe<JargonTermOutput>;
  updateLWEvent: Maybe<LwEventOutput>;
  updateLlmConversation: Maybe<LlmConversationOutput>;
  updateLocalgroup: Maybe<LocalgroupOutput>;
  updateMessage: Maybe<MessageOutput>;
  updateModerationTemplate: Maybe<ModerationTemplateOutput>;
  updateModeratorAction: Maybe<ModeratorActionOutput>;
  updateMultiDocument: Maybe<MultiDocumentOutput>;
  updateNotification: Maybe<NotificationOutput>;
  updatePetrovDayAction: Maybe<PetrovDayActionOutput>;
  updatePodcastEpisode: Maybe<PodcastEpisodeOutput>;
  updatePost: Maybe<PostOutput>;
  updatePostEmbedding: Maybe<PostEmbeddingOutput>;
  updatePostViewTime: Maybe<PostViewTimeOutput>;
  updatePostViews: Maybe<PostViewsOutput>;
  updateRSSFeed: Maybe<RssFeedOutput>;
  updateReport: Maybe<ReportOutput>;
  updateReviewWinner: Maybe<ReviewWinnerOutput>;
  updateReviewWinnerArt: Maybe<ReviewWinnerArtOutput>;
  updateRevision: Maybe<RevisionOutput>;
  updateSequence: Maybe<SequenceOutput>;
  updateSplashArtCoordinate: Maybe<SplashArtCoordinateOutput>;
  updateSpotlight: Maybe<SpotlightOutput>;
  updateSurvey: Maybe<SurveyOutput>;
  updateSurveyQuestion: Maybe<SurveyQuestionOutput>;
  updateSurveyResponse: Maybe<SurveyResponseOutput>;
  updateSurveySchedule: Maybe<SurveyScheduleOutput>;
  updateTag: Maybe<TagOutput>;
  updateTagFlag: Maybe<TagFlagOutput>;
  updateTagRel: Maybe<TagRelOutput>;
  updateUser: Maybe<UserOutput>;
  updateUserEAGDetail: Maybe<UserEagDetailOutput>;
  updateUserJobAd: Maybe<UserJobAdOutput>;
  updateUserMostValuablePost: Maybe<UserMostValuablePostOutput>;
  updateUserRateLimit: Maybe<UserRateLimitOutput>;
  updateUserTagRel: Maybe<UserTagRelOutput>;
  upsertUserTypingIndicator: Maybe<TypingIndicator>;
  useEmailToken: Maybe<Scalars['JSON']['output']>;
};


export type MutationAddForumEventVoteArgs = {
  delta: InputMaybe<Scalars['Float']['input']>;
  forumEventId: Scalars['String']['input'];
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  x: Scalars['Float']['input'];
};


export type MutationAddGivingSeasonHeartArgs = {
  electionName: Scalars['String']['input'];
  theta: Scalars['Float']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};


export type MutationCancelRsvpToEventArgs = {
  name: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type MutationImportGoogleDocArgs = {
  fileUrl: Scalars['String']['input'];
  postId: InputMaybe<Scalars['String']['input']>;
};


export type MutationMakeElicitPredictionArgs = {
  prediction: InputMaybe<Scalars['Int']['input']>;
  questionId: InputMaybe<Scalars['String']['input']>;
};


export type MutationNewUserCompleteProfileArgs = {
  acceptedTos: InputMaybe<Scalars['Boolean']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  subscribeToDigest: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};


export type MutationPetrovDayLaunchMissileArgs = {
  launchCode: InputMaybe<Scalars['String']['input']>;
};


export type MutationRsvpToEventArgs = {
  email: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  private: InputMaybe<Scalars['Boolean']['input']>;
  response: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveForumEventStickerArgs = {
  forumEventId: Scalars['String']['input'];
  stickerId: Scalars['String']['input'];
};


export type MutationRemoveForumEventVoteArgs = {
  forumEventId: Scalars['String']['input'];
};


export type MutationRemoveGivingSeasonHeartArgs = {
  electionName: Scalars['String']['input'];
};


export type MutationUpdateSearchSynonymsArgs = {
  synonyms: Array<Scalars['String']['input']>;
};


export type MutationUserExpandFrontpageSectionArgs = {
  expanded: Scalars['Boolean']['input'];
  section: Scalars['String']['input'];
};


export type MutationUserUpdateSubforumMembershipArgs = {
  member: Scalars['Boolean']['input'];
  tagId: Scalars['String']['input'];
};


export type MutationAcceptCoauthorRequestArgs = {
  accept: InputMaybe<Scalars['Boolean']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddOrUpvoteTagArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
  tagId: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddTagsArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
  tagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationAlignmentCommentArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  commentId: InputMaybe<Scalars['String']['input']>;
};


export type MutationAlignmentPostArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
};


export type MutationAnalyticsEventArgs = {
  events: InputMaybe<Array<Scalars['JSON']['input']>>;
  now: InputMaybe<Scalars['Date']['input']>;
};


export type MutationAutosaveRevisionArgs = {
  contents: AutosaveContentType;
  postId: Scalars['String']['input'];
};


export type MutationClickRecommendationArgs = {
  postId: Scalars['String']['input'];
};


export type MutationConnectCrossposterArgs = {
  token: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateAdvisorRequestArgs = {
  data: CreateAdvisorRequestDataInput;
};


export type MutationCreateArbitalTagContentRelArgs = {
  data: CreateArbitalTagContentRelDataInput;
};


export type MutationCreateBanArgs = {
  data: CreateBanDataInput;
};


export type MutationCreateBookArgs = {
  data: CreateBookDataInput;
};


export type MutationCreateChapterArgs = {
  data: CreateChapterDataInput;
};


export type MutationCreateCollectionArgs = {
  data: CreateCollectionDataInput;
};


export type MutationCreateCommentArgs = {
  data: CreateCommentDataInput;
};


export type MutationCreateCommentModeratorActionArgs = {
  data: CreateCommentModeratorActionDataInput;
};


export type MutationCreateConversationArgs = {
  data: CreateConversationDataInput;
};


export type MutationCreateCurationNoticeArgs = {
  data: CreateCurationNoticeDataInput;
};


export type MutationCreateDialogueMatchPreferenceArgs = {
  data: CreateDialogueMatchPreferenceDataInput;
};


export type MutationCreateDigestArgs = {
  data: CreateDigestDataInput;
};


export type MutationCreateDigestPostArgs = {
  data: CreateDigestPostDataInput;
};


export type MutationCreateElectionCandidateArgs = {
  data: CreateElectionCandidateDataInput;
};


export type MutationCreateElectionVoteArgs = {
  data: CreateElectionVoteDataInput;
};


export type MutationCreateElicitQuestionArgs = {
  data: CreateElicitQuestionDataInput;
};


export type MutationCreateForumEventArgs = {
  data: CreateForumEventDataInput;
};


export type MutationCreateGardenCodeArgs = {
  data: CreateGardenCodeDataInput;
};


export type MutationCreateGoogleServiceAccountSessionArgs = {
  data: CreateGoogleServiceAccountSessionDataInput;
};


export type MutationCreateJargonTermArgs = {
  data: CreateJargonTermDataInput;
};


export type MutationCreateLwEventArgs = {
  data: CreateLwEventDataInput;
};


export type MutationCreateLlmConversationArgs = {
  data: CreateLlmConversationDataInput;
};


export type MutationCreateLocalgroupArgs = {
  data: CreateLocalgroupDataInput;
};


export type MutationCreateMessageArgs = {
  data: CreateMessageDataInput;
};


export type MutationCreateModerationTemplateArgs = {
  data: CreateModerationTemplateDataInput;
};


export type MutationCreateModeratorActionArgs = {
  data: CreateModeratorActionDataInput;
};


export type MutationCreateMultiDocumentArgs = {
  data: CreateMultiDocumentDataInput;
};


export type MutationCreateNotificationArgs = {
  data: CreateNotificationDataInput;
};


export type MutationCreatePetrovDayActionArgs = {
  data: CreatePetrovDayActionDataInput;
};


export type MutationCreatePodcastEpisodeArgs = {
  data: CreatePodcastEpisodeDataInput;
};


export type MutationCreatePostArgs = {
  data: CreatePostDataInput;
};


export type MutationCreatePostEmbeddingArgs = {
  data: CreatePostEmbeddingDataInput;
};


export type MutationCreatePostViewTimeArgs = {
  data: CreatePostViewTimeDataInput;
};


export type MutationCreatePostViewsArgs = {
  data: CreatePostViewsDataInput;
};


export type MutationCreateRssFeedArgs = {
  data: CreateRssFeedDataInput;
};


export type MutationCreateReportArgs = {
  data: CreateReportDataInput;
};


export type MutationCreateReviewWinnerArgs = {
  data: CreateReviewWinnerDataInput;
};


export type MutationCreateReviewWinnerArtArgs = {
  data: CreateReviewWinnerArtDataInput;
};


export type MutationCreateSequenceArgs = {
  data: CreateSequenceDataInput;
};


export type MutationCreateSplashArtCoordinateArgs = {
  data: CreateSplashArtCoordinateDataInput;
};


export type MutationCreateSpotlightArgs = {
  data: CreateSpotlightDataInput;
};


export type MutationCreateSubscriptionArgs = {
  data: CreateSubscriptionDataInput;
};


export type MutationCreateSurveyArgs = {
  data: CreateSurveyDataInput;
};


export type MutationCreateSurveyQuestionArgs = {
  data: CreateSurveyQuestionDataInput;
};


export type MutationCreateSurveyResponseArgs = {
  data: CreateSurveyResponseDataInput;
};


export type MutationCreateSurveyScheduleArgs = {
  data: CreateSurveyScheduleDataInput;
};


export type MutationCreateTagArgs = {
  data: CreateTagDataInput;
};


export type MutationCreateTagFlagArgs = {
  data: CreateTagFlagDataInput;
};


export type MutationCreateTagRelArgs = {
  data: CreateTagRelDataInput;
};


export type MutationCreateUserArgs = {
  data: CreateUserDataInput;
};


export type MutationCreateUserEagDetailArgs = {
  data: CreateUserEagDetailDataInput;
};


export type MutationCreateUserJobAdArgs = {
  data: CreateUserJobAdDataInput;
};


export type MutationCreateUserMostValuablePostArgs = {
  data: CreateUserMostValuablePostDataInput;
};


export type MutationCreateUserRateLimitArgs = {
  data: CreateUserRateLimitDataInput;
};


export type MutationCreateUserTagRelArgs = {
  data: CreateUserTagRelDataInput;
};


export type MutationDismissRecommendationArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditSurveyArgs = {
  name: Scalars['String']['input'];
  questions: Array<SurveyQuestionInfo>;
  surveyId: Scalars['String']['input'];
};


export type MutationFlipSplashArtImageArgs = {
  reviewWinnerArtId: Scalars['String']['input'];
};


export type MutationGenerateCoverImagesForPostArgs = {
  postId: Scalars['String']['input'];
  prompt: InputMaybe<Scalars['String']['input']>;
};


export type MutationGetNewJargonTermsArgs = {
  exampleAltTerm: InputMaybe<Scalars['String']['input']>;
  exampleDefinition: InputMaybe<Scalars['String']['input']>;
  examplePost: InputMaybe<Scalars['String']['input']>;
  exampleTerm: InputMaybe<Scalars['String']['input']>;
  glossaryPrompt: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};


export type MutationImportUrlAsDraftPostArgs = {
  url: Scalars['String']['input'];
};


export type MutationIncreasePostViewCountArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
};


export type MutationLockThreadArgs = {
  commentId: Scalars['String']['input'];
  until: InputMaybe<Scalars['String']['input']>;
};


export type MutationLoginArgs = {
  password: InputMaybe<Scalars['String']['input']>;
  username: InputMaybe<Scalars['String']['input']>;
};


export type MutationMarkAsReadOrUnreadArgs = {
  isRead: InputMaybe<Scalars['Boolean']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
};


export type MutationMarkConversationReadArgs = {
  conversationId: Scalars['String']['input'];
};


export type MutationMarkPostCommentsReadArgs = {
  postId: Scalars['String']['input'];
};


export type MutationMergeTagsArgs = {
  redirectSource: Scalars['Boolean']['input'];
  sourceTagId: Scalars['String']['input'];
  targetTagId: Scalars['String']['input'];
  transferSubtags: Scalars['Boolean']['input'];
};


export type MutationModerateCommentArgs = {
  commentId: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  deletedPublic: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason: InputMaybe<Scalars['String']['input']>;
};


export type MutationObserveRecommendationArgs = {
  postId: Scalars['String']['input'];
};


export type MutationPerformVoteCommentArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteElectionCandidateArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteMultiDocumentArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVotePostArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteRevisionArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteTagArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationPerformVoteTagRelArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationPromoteLensToMainArgs = {
  lensId: Scalars['String']['input'];
};


export type MutationPublishAndDeDuplicateSpotlightArgs = {
  spotlightId: InputMaybe<Scalars['String']['input']>;
};


export type MutationReorderSummariesArgs = {
  parentDocumentCollectionName: Scalars['String']['input'];
  parentDocumentId: Scalars['String']['input'];
  summaryIds: Array<Scalars['String']['input']>;
};


export type MutationResetPasswordArgs = {
  email: InputMaybe<Scalars['String']['input']>;
};


export type MutationResyncRssFeedArgs = {
  feedId: Scalars['String']['input'];
};


export type MutationRevertPostToRevisionArgs = {
  postId: Scalars['String']['input'];
  revisionId: Scalars['String']['input'];
};


export type MutationRevertTagToRevisionArgs = {
  revertToRevisionId: Scalars['String']['input'];
  tagId: Scalars['String']['input'];
};


export type MutationSendEventTriggeredDmArgs = {
  eventType: Scalars['String']['input'];
};


export type MutationSendNewDialogueMessageNotificationArgs = {
  dialogueHtml: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


export type MutationSendVertexMediaCompleteEventArgs = {
  attributionId: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};


export type MutationSendVertexViewItemEventArgs = {
  attributionId: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};


export type MutationSetIsBookmarkedArgs = {
  isBookmarked: Scalars['Boolean']['input'];
  postId: Scalars['String']['input'];
};


export type MutationSetIsHiddenArgs = {
  isHidden: Scalars['Boolean']['input'];
  postId: Scalars['String']['input'];
};


export type MutationSetVoteCommentArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteElectionCandidateArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteMultiDocumentArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVotePostArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteRevisionArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteTagArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetVoteTagRelArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
};


export type MutationSignupArgs = {
  abTestKey: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  reCaptchaToken: InputMaybe<Scalars['String']['input']>;
  subscribeToCurated: InputMaybe<Scalars['Boolean']['input']>;
  username: InputMaybe<Scalars['String']['input']>;
};


export type MutationSubmitReviewVoteArgs = {
  comment: InputMaybe<Scalars['String']['input']>;
  dummy: InputMaybe<Scalars['Boolean']['input']>;
  newQuadraticScore: InputMaybe<Scalars['Int']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  quadraticChange: InputMaybe<Scalars['Int']['input']>;
  qualitativeScore: InputMaybe<Scalars['Int']['input']>;
  reactions: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  year: InputMaybe<Scalars['String']['input']>;
};


export type MutationUnlockPostArgs = {
  linkSharingKey: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


export type MutationUnlockThreadArgs = {
  commentId: Scalars['String']['input'];
};


export type MutationUpdateAdvisorRequestArgs = {
  data: UpdateAdvisorRequestDataInput;
  selector: AdvisorRequestSelectorUniqueInput;
};


export type MutationUpdateArbitalTagContentRelArgs = {
  data: UpdateArbitalTagContentRelDataInput;
  selector: ArbitalTagContentRelSelectorUniqueInput;
};


export type MutationUpdateBanArgs = {
  data: UpdateBanDataInput;
  selector: BanSelectorUniqueInput;
};


export type MutationUpdateBookArgs = {
  data: UpdateBookDataInput;
  selector: BookSelectorUniqueInput;
};


export type MutationUpdateChapterArgs = {
  data: UpdateChapterDataInput;
  selector: ChapterSelectorUniqueInput;
};


export type MutationUpdateCollectionArgs = {
  data: UpdateCollectionDataInput;
  selector: CollectionSelectorUniqueInput;
};


export type MutationUpdateCommentArgs = {
  data: UpdateCommentDataInput;
  selector: CommentSelectorUniqueInput;
};


export type MutationUpdateCommentModeratorActionArgs = {
  data: UpdateCommentModeratorActionDataInput;
  selector: CommentModeratorActionSelectorUniqueInput;
};


export type MutationUpdateContinueReadingArgs = {
  postId: Scalars['String']['input'];
  sequenceId: Scalars['String']['input'];
};


export type MutationUpdateConversationArgs = {
  data: UpdateConversationDataInput;
  selector: ConversationSelectorUniqueInput;
};


export type MutationUpdateCurationNoticeArgs = {
  data: UpdateCurationNoticeDataInput;
  selector: CurationNoticeSelectorUniqueInput;
};


export type MutationUpdateDialogueMatchPreferenceArgs = {
  data: UpdateDialogueMatchPreferenceDataInput;
  selector: DialogueMatchPreferenceSelectorUniqueInput;
};


export type MutationUpdateDigestArgs = {
  data: UpdateDigestDataInput;
  selector: DigestSelectorUniqueInput;
};


export type MutationUpdateDigestPostArgs = {
  data: UpdateDigestPostDataInput;
  selector: DigestPostSelectorUniqueInput;
};


export type MutationUpdateElectionCandidateArgs = {
  data: UpdateElectionCandidateDataInput;
  selector: ElectionCandidateSelectorUniqueInput;
};


export type MutationUpdateElectionVoteArgs = {
  data: UpdateElectionVoteDataInput;
  selector: ElectionVoteSelectorUniqueInput;
};


export type MutationUpdateElicitQuestionArgs = {
  data: UpdateElicitQuestionDataInput;
  selector: ElicitQuestionSelectorUniqueInput;
};


export type MutationUpdateForumEventArgs = {
  data: UpdateForumEventDataInput;
  selector: ForumEventSelectorUniqueInput;
};


export type MutationUpdateGardenCodeArgs = {
  data: UpdateGardenCodeDataInput;
  selector: GardenCodeSelectorUniqueInput;
};


export type MutationUpdateGoogleServiceAccountSessionArgs = {
  data: UpdateGoogleServiceAccountSessionDataInput;
  selector: GoogleServiceAccountSessionSelectorUniqueInput;
};


export type MutationUpdateJargonTermArgs = {
  data: UpdateJargonTermDataInput;
  selector: JargonTermSelectorUniqueInput;
};


export type MutationUpdateLwEventArgs = {
  data: UpdateLwEventDataInput;
  selector: LwEventSelectorUniqueInput;
};


export type MutationUpdateLlmConversationArgs = {
  data: UpdateLlmConversationDataInput;
  selector: LlmConversationSelectorUniqueInput;
};


export type MutationUpdateLocalgroupArgs = {
  data: UpdateLocalgroupDataInput;
  selector: LocalgroupSelectorUniqueInput;
};


export type MutationUpdateMessageArgs = {
  data: UpdateMessageDataInput;
  selector: MessageSelectorUniqueInput;
};


export type MutationUpdateModerationTemplateArgs = {
  data: UpdateModerationTemplateDataInput;
  selector: ModerationTemplateSelectorUniqueInput;
};


export type MutationUpdateModeratorActionArgs = {
  data: UpdateModeratorActionDataInput;
  selector: ModeratorActionSelectorUniqueInput;
};


export type MutationUpdateMultiDocumentArgs = {
  data: UpdateMultiDocumentDataInput;
  selector: MultiDocumentSelectorUniqueInput;
};


export type MutationUpdateNotificationArgs = {
  data: UpdateNotificationDataInput;
  selector: NotificationSelectorUniqueInput;
};


export type MutationUpdatePetrovDayActionArgs = {
  data: UpdatePetrovDayActionDataInput;
  selector: PetrovDayActionSelectorUniqueInput;
};


export type MutationUpdatePodcastEpisodeArgs = {
  data: UpdatePodcastEpisodeDataInput;
  selector: PodcastEpisodeSelectorUniqueInput;
};


export type MutationUpdatePostArgs = {
  data: UpdatePostDataInput;
  selector: PostSelectorUniqueInput;
};


export type MutationUpdatePostEmbeddingArgs = {
  data: UpdatePostEmbeddingDataInput;
  selector: PostEmbeddingSelectorUniqueInput;
};


export type MutationUpdatePostViewTimeArgs = {
  data: UpdatePostViewTimeDataInput;
  selector: PostViewTimeSelectorUniqueInput;
};


export type MutationUpdatePostViewsArgs = {
  data: UpdatePostViewsDataInput;
  selector: PostViewsSelectorUniqueInput;
};


export type MutationUpdateRssFeedArgs = {
  data: UpdateRssFeedDataInput;
  selector: RssFeedSelectorUniqueInput;
};


export type MutationUpdateReportArgs = {
  data: UpdateReportDataInput;
  selector: ReportSelectorUniqueInput;
};


export type MutationUpdateReviewWinnerArgs = {
  data: UpdateReviewWinnerDataInput;
  selector: ReviewWinnerSelectorUniqueInput;
};


export type MutationUpdateReviewWinnerArtArgs = {
  data: UpdateReviewWinnerArtDataInput;
  selector: ReviewWinnerArtSelectorUniqueInput;
};


export type MutationUpdateRevisionArgs = {
  data: UpdateRevisionDataInput;
  selector: RevisionSelectorUniqueInput;
};


export type MutationUpdateSequenceArgs = {
  data: UpdateSequenceDataInput;
  selector: SequenceSelectorUniqueInput;
};


export type MutationUpdateSplashArtCoordinateArgs = {
  data: UpdateSplashArtCoordinateDataInput;
  selector: SplashArtCoordinateSelectorUniqueInput;
};


export type MutationUpdateSpotlightArgs = {
  data: UpdateSpotlightDataInput;
  selector: SpotlightSelectorUniqueInput;
};


export type MutationUpdateSurveyArgs = {
  data: UpdateSurveyDataInput;
  selector: SurveySelectorUniqueInput;
};


export type MutationUpdateSurveyQuestionArgs = {
  data: UpdateSurveyQuestionDataInput;
  selector: SurveyQuestionSelectorUniqueInput;
};


export type MutationUpdateSurveyResponseArgs = {
  data: UpdateSurveyResponseDataInput;
  selector: SurveyResponseSelectorUniqueInput;
};


export type MutationUpdateSurveyScheduleArgs = {
  data: UpdateSurveyScheduleDataInput;
  selector: SurveyScheduleSelectorUniqueInput;
};


export type MutationUpdateTagArgs = {
  data: UpdateTagDataInput;
  selector: TagSelectorUniqueInput;
};


export type MutationUpdateTagFlagArgs = {
  data: UpdateTagFlagDataInput;
  selector: TagFlagSelectorUniqueInput;
};


export type MutationUpdateTagRelArgs = {
  data: UpdateTagRelDataInput;
  selector: TagRelSelectorUniqueInput;
};


export type MutationUpdateUserArgs = {
  data: UpdateUserDataInput;
  selector: UserSelectorUniqueInput;
};


export type MutationUpdateUserEagDetailArgs = {
  data: UpdateUserEagDetailDataInput;
  selector: UserEagDetailSelectorUniqueInput;
};


export type MutationUpdateUserJobAdArgs = {
  data: UpdateUserJobAdDataInput;
  selector: UserJobAdSelectorUniqueInput;
};


export type MutationUpdateUserMostValuablePostArgs = {
  data: UpdateUserMostValuablePostDataInput;
  selector: UserMostValuablePostSelectorUniqueInput;
};


export type MutationUpdateUserRateLimitArgs = {
  data: UpdateUserRateLimitDataInput;
  selector: UserRateLimitSelectorUniqueInput;
};


export type MutationUpdateUserTagRelArgs = {
  data: UpdateUserTagRelDataInput;
  selector: UserTagRelSelectorUniqueInput;
};


export type MutationUpsertUserTypingIndicatorArgs = {
  documentId: Scalars['String']['input'];
};


export type MutationUseEmailTokenArgs = {
  args: InputMaybe<Scalars['JSON']['input']>;
  token: InputMaybe<Scalars['String']['input']>;
};

export type MyDialoguesResult = {
  __typename?: 'MyDialoguesResult';
  results: Array<Post>;
};

export type NewUserCompletedProfile = {
  __typename?: 'NewUserCompletedProfile';
  displayName: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  subscribedToDigest: Maybe<Scalars['Boolean']['output']>;
  username: Maybe<Scalars['String']['output']>;
  usernameUnset: Maybe<Scalars['Boolean']['output']>;
};

export type Notification = {
  __typename?: 'Notification';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  documentType: Maybe<Scalars['String']['output']>;
  emailed: Maybe<Scalars['Boolean']['output']>;
  extraData: Maybe<Scalars['JSON']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  link: Maybe<Scalars['String']['output']>;
  message: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  title: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  viewed: Maybe<Scalars['Boolean']['output']>;
  waitingForBatch: Maybe<Scalars['Boolean']['output']>;
};

export type NotificationCounts = {
  __typename?: 'NotificationCounts';
  checkedAt: Scalars['Date']['output'];
  faviconBadgeNumber: Scalars['Int']['output'];
  unreadNotifications: Scalars['Int']['output'];
  unreadPrivateMessages: Scalars['Int']['output'];
};

export type NotificationDisplaysResult = {
  __typename?: 'NotificationDisplaysResult';
  results: Array<Scalars['JSON']['output']>;
};

export enum NotificationOrderByInput {
  Foobar = 'foobar'
}

export type NotificationOutput = {
  __typename?: 'NotificationOutput';
  data: Maybe<Notification>;
};

export type NotificationSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<NotificationSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<NotificationSelectorInput>>>;
};

export type NotificationSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PageCacheEntry = {
  __typename?: 'PageCacheEntry';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum PageCacheEntryOrderByInput {
  Foobar = 'foobar'
}

export type PageCacheEntryOutput = {
  __typename?: 'PageCacheEntryOutput';
  data: Maybe<PageCacheEntry>;
};

export type PageCacheEntrySelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PageCacheEntrySelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PageCacheEntrySelectorInput>>>;
};

export type PageCacheEntrySelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PetrovDay2024CheckNumberOfIncomingData = {
  __typename?: 'PetrovDay2024CheckNumberOfIncomingData';
  count: Maybe<Scalars['Int']['output']>;
};

export type PetrovDayAction = {
  __typename?: 'PetrovDayAction';
  _id: Scalars['String']['output'];
  actionType: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  data: Maybe<Scalars['JSON']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum PetrovDayActionOrderByInput {
  Foobar = 'foobar'
}

export type PetrovDayActionOutput = {
  __typename?: 'PetrovDayActionOutput';
  data: Maybe<PetrovDayAction>;
};

export type PetrovDayActionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PetrovDayActionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PetrovDayActionSelectorInput>>>;
};

export type PetrovDayActionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PetrovDayCheckIfIncomingData = {
  __typename?: 'PetrovDayCheckIfIncomingData';
  createdAt: Maybe<Scalars['Date']['output']>;
  launched: Maybe<Scalars['Boolean']['output']>;
};

export type PetrovDayLaunch = {
  __typename?: 'PetrovDayLaunch';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  hashedLaunchCode: Maybe<Scalars['String']['output']>;
  launchCode: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type PetrovDayLaunchMissileData = {
  __typename?: 'PetrovDayLaunchMissileData';
  createdAt: Maybe<Scalars['Date']['output']>;
  launchCode: Maybe<Scalars['String']['output']>;
};

export enum PetrovDayLaunchOrderByInput {
  Foobar = 'foobar'
}

export type PetrovDayLaunchOutput = {
  __typename?: 'PetrovDayLaunchOutput';
  data: Maybe<PetrovDayLaunch>;
};

export type PetrovDayLaunchSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PetrovDayLaunchSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PetrovDayLaunchSelectorInput>>>;
};

export type PetrovDayLaunchSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Podcast = {
  __typename?: 'Podcast';
  _id: Scalars['String']['output'];
  applePodcastLink: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  spotifyPodcastLink: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type PodcastEpisode = {
  __typename?: 'PodcastEpisode';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  episodeLink: Maybe<Scalars['String']['output']>;
  externalEpisodeId: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  podcast: Podcast;
  podcastId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export enum PodcastEpisodeOrderByInput {
  Foobar = 'foobar'
}

export type PodcastEpisodeOutput = {
  __typename?: 'PodcastEpisodeOutput';
  data: Maybe<PodcastEpisode>;
};

export type PodcastEpisodeSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PodcastEpisodeSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PodcastEpisodeSelectorInput>>>;
};

export type PodcastEpisodeSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export enum PodcastOrderByInput {
  Foobar = 'foobar'
}

export type PodcastOutput = {
  __typename?: 'PodcastOutput';
  data: Maybe<Podcast>;
};

export type PodcastSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PodcastSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PodcastSelectorInput>>>;
};

export type PodcastSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PopularCommentsResult = {
  __typename?: 'PopularCommentsResult';
  results: Array<Comment>;
};

export type Post = {
  __typename?: 'Post';
  _id: Scalars['String']['output'];
  activateRSVPs: Maybe<Scalars['Boolean']['output']>;
  af: Maybe<Scalars['Boolean']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afCommentCount: Maybe<Scalars['Float']['output']>;
  afDate: Maybe<Scalars['Date']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afLastCommentedAt: Maybe<Scalars['Date']['output']>;
  afSticky: Maybe<Scalars['Boolean']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
  agentFoundationsId: Maybe<Scalars['String']['output']>;
  annualReviewMarketIsResolved: Maybe<Scalars['Boolean']['output']>;
  annualReviewMarketProbability: Maybe<Scalars['Float']['output']>;
  annualReviewMarketUrl: Maybe<Scalars['String']['output']>;
  annualReviewMarketYear: Maybe<Scalars['Int']['output']>;
  author: Maybe<Scalars['String']['output']>;
  authorIsUnreviewed: Maybe<Scalars['Boolean']['output']>;
  autoFrontpage: Maybe<Scalars['String']['output']>;
  bannedUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  baseScore: Maybe<Scalars['Float']['output']>;
  bestAnswer: Maybe<Comment>;
  canonicalBook: Maybe<Book>;
  canonicalBookId: Maybe<Scalars['String']['output']>;
  canonicalCollection: Maybe<Collection>;
  canonicalCollectionSlug: Maybe<Scalars['String']['output']>;
  canonicalNextPostSlug: Maybe<Scalars['String']['output']>;
  canonicalPrevPostSlug: Maybe<Scalars['String']['output']>;
  canonicalSequence: Maybe<Sequence>;
  canonicalSequenceId: Maybe<Scalars['String']['output']>;
  canonicalSource: Maybe<Scalars['String']['output']>;
  clickCount: Maybe<Scalars['Float']['output']>;
  coauthorStatuses: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  coauthors: Maybe<Array<User>>;
  collabEditorDialogue: Maybe<Scalars['Boolean']['output']>;
  collectionTitle: Maybe<Scalars['String']['output']>;
  commentCount: Maybe<Scalars['Float']['output']>;
  commentEmojiReactors: Maybe<Scalars['JSON']['output']>;
  commentSortOrder: Maybe<Scalars['String']['output']>;
  commentsLocked: Maybe<Scalars['Boolean']['output']>;
  commentsLockedToAccountsCreatedAfter: Maybe<Scalars['Date']['output']>;
  contactInfo: Maybe<Scalars['String']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  curatedDate: Maybe<Scalars['Date']['output']>;
  curationNotices: Maybe<Array<Maybe<CurationNotice>>>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  currentUserReviewVote: Maybe<ReviewVote>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  customHighlight: Maybe<Revision>;
  customHighlight_latest: Maybe<Scalars['String']['output']>;
  debate: Maybe<Scalars['Boolean']['output']>;
  defaultRecommendation: Maybe<Scalars['Boolean']['output']>;
  deletedDraft: Maybe<Scalars['Boolean']['output']>;
  dialogTooltipPreview: Maybe<Scalars['String']['output']>;
  dialogueMessageContents: Maybe<Scalars['String']['output']>;
  disableRecommendation: Maybe<Scalars['Boolean']['output']>;
  disableSidenotes: Maybe<Scalars['Boolean']['output']>;
  domain: Maybe<Scalars['String']['output']>;
  draft: Maybe<Scalars['Boolean']['output']>;
  emailShareUrl: Maybe<Scalars['String']['output']>;
  emojiReactors: Maybe<Scalars['JSON']['output']>;
  endTime: Maybe<Scalars['Date']['output']>;
  eventImageId: Maybe<Scalars['String']['output']>;
  eventRegistrationLink: Maybe<Scalars['String']['output']>;
  eventType: Maybe<Scalars['String']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  facebookLink: Maybe<Scalars['String']['output']>;
  facebookShareUrl: Maybe<Scalars['String']['output']>;
  feed: Maybe<RssFeed>;
  feedId: Maybe<Scalars['String']['output']>;
  feedLink: Maybe<Scalars['String']['output']>;
  finalReviewVoteScoreAF: Maybe<Scalars['Float']['output']>;
  finalReviewVoteScoreAllKarma: Maybe<Scalars['Float']['output']>;
  finalReviewVoteScoreHighKarma: Maybe<Scalars['Float']['output']>;
  finalReviewVotesAF: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  finalReviewVotesAllKarma: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  finalReviewVotesHighKarma: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  firstVideoAttribsForPreview: Maybe<Scalars['JSON']['output']>;
  fmCrosspost: Maybe<Scalars['JSON']['output']>;
  forceAllowType3Audio: Maybe<Scalars['Boolean']['output']>;
  frontpageDate: Maybe<Scalars['Date']['output']>;
  generateDraftJargon: Maybe<Scalars['Boolean']['output']>;
  globalEvent: Maybe<Scalars['Boolean']['output']>;
  glossary: Array<JargonTerm>;
  googleLocation: Maybe<Scalars['JSON']['output']>;
  group: Maybe<Localgroup>;
  groupId: Maybe<Scalars['String']['output']>;
  hasCoauthorPermission: Maybe<Scalars['Boolean']['output']>;
  hiddenRelatedQuestion: Maybe<Scalars['Boolean']['output']>;
  hideAuthor: Maybe<Scalars['Boolean']['output']>;
  hideCommentKarma: Maybe<Scalars['Boolean']['output']>;
  hideFromPopularComments: Maybe<Scalars['Boolean']['output']>;
  hideFromRecentDiscussions: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageComments: Maybe<Scalars['Boolean']['output']>;
  htmlBody: Maybe<Scalars['String']['output']>;
  ignoreRateLimits: Maybe<Scalars['Boolean']['output']>;
  isEvent: Maybe<Scalars['Boolean']['output']>;
  isFuture: Maybe<Scalars['Boolean']['output']>;
  isRead: Maybe<Scalars['Boolean']['output']>;
  joinEventLink: Maybe<Scalars['String']['output']>;
  languageModelSummary: Scalars['String']['output'];
  lastCommentPromotedAt: Maybe<Scalars['Date']['output']>;
  lastCommentedAt: Maybe<Scalars['Date']['output']>;
  lastPromotedComment: Maybe<Comment>;
  lastVisitedAt: Maybe<Scalars['Date']['output']>;
  legacy: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  legacyId: Maybe<Scalars['String']['output']>;
  legacySpam: Maybe<Scalars['Boolean']['output']>;
  linkSharingKey: Maybe<Scalars['String']['output']>;
  linkSharingKeyUsedBy: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  linkUrl: Maybe<Scalars['String']['output']>;
  localEndTime: Maybe<Scalars['Date']['output']>;
  localStartTime: Maybe<Scalars['Date']['output']>;
  location: Maybe<Scalars['String']['output']>;
  manifoldReviewMarketId: Maybe<Scalars['String']['output']>;
  maxBaseScore: Maybe<Scalars['Float']['output']>;
  meetupLink: Maybe<Scalars['String']['output']>;
  meta: Maybe<Scalars['Boolean']['output']>;
  metaDate: Maybe<Scalars['Date']['output']>;
  metaSticky: Maybe<Scalars['Boolean']['output']>;
  moderationGuidelines: Maybe<Revision>;
  moderationGuidelines_latest: Maybe<Scalars['String']['output']>;
  moderationStyle: Maybe<Scalars['String']['output']>;
  modifiedAt: Maybe<Scalars['Date']['output']>;
  mongoLocation: Maybe<Scalars['JSON']['output']>;
  mostRecentPublishedDialogueResponseDate: Maybe<Scalars['Date']['output']>;
  myEditorAccess: Scalars['String']['output'];
  nextDayReminderSent: Maybe<Scalars['Boolean']['output']>;
  nextPost: Maybe<Post>;
  noIndex: Maybe<Scalars['Boolean']['output']>;
  nominationCount2018: Maybe<Scalars['Float']['output']>;
  nominationCount2019: Maybe<Scalars['Float']['output']>;
  onlineEvent: Maybe<Scalars['Boolean']['output']>;
  onlyVisibleToEstablishedAccounts: Maybe<Scalars['Boolean']['output']>;
  onlyVisibleToLoggedIn: Maybe<Scalars['Boolean']['output']>;
  organizerIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  organizers: Array<User>;
  originalPostRelationSourceId: Maybe<Scalars['String']['output']>;
  pageUrl: Scalars['String']['output'];
  pageUrlRelative: Maybe<Scalars['String']['output']>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  podcastEpisode: Maybe<PodcastEpisode>;
  podcastEpisodeId: Maybe<Scalars['String']['output']>;
  positiveReviewVoteCount: Maybe<Scalars['Float']['output']>;
  postCategory: Maybe<Scalars['String']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
  postedAtFormatted: Maybe<Scalars['String']['output']>;
  prevPost: Maybe<Post>;
  question: Maybe<Scalars['Boolean']['output']>;
  readTimeMinutes: Scalars['Int']['output'];
  readTimeMinutesOverride: Maybe<Scalars['Float']['output']>;
  recentComments: Maybe<Array<Maybe<Comment>>>;
  referrer: Maybe<Scalars['String']['output']>;
  rejected: Maybe<Scalars['Boolean']['output']>;
  rejectedByUser: Maybe<User>;
  rejectedByUserId: Maybe<Scalars['String']['output']>;
  rejectedReason: Maybe<Scalars['String']['output']>;
  reviewCount: Maybe<Scalars['Float']['output']>;
  reviewCount2018: Maybe<Scalars['Float']['output']>;
  reviewCount2019: Maybe<Scalars['Float']['output']>;
  reviewForAlignmentUserId: Maybe<Scalars['String']['output']>;
  reviewForCuratedUserId: Maybe<Scalars['String']['output']>;
  reviewVoteCount: Maybe<Scalars['Float']['output']>;
  reviewVoteScoreAF: Maybe<Scalars['Float']['output']>;
  reviewVoteScoreAllKarma: Maybe<Scalars['Float']['output']>;
  reviewVoteScoreHighKarma: Maybe<Scalars['Float']['output']>;
  reviewVotesAF: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  reviewVotesAllKarma: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  reviewVotesHighKarma: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  reviewWinner: Maybe<ReviewWinner>;
  reviewedByUser: Maybe<User>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  reviews: Maybe<Array<Maybe<Comment>>>;
  revisions: Maybe<Array<Maybe<Revision>>>;
  rsvpCounts: Scalars['JSON']['output'];
  rsvps: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  scoreExceeded2Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded30Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded45Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded75Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded125Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded200Date: Maybe<Scalars['Date']['output']>;
  sequence: Maybe<Sequence>;
  shareWithUsers: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  sharingSettings: Maybe<Scalars['JSON']['output']>;
  shortform: Maybe<Scalars['Boolean']['output']>;
  sideCommentVisibility: Maybe<Scalars['String']['output']>;
  sideComments: Maybe<Scalars['JSON']['output']>;
  sideCommentsCache: Maybe<SideCommentCache>;
  slug: Maybe<Scalars['String']['output']>;
  socialPreview: Maybe<Scalars['JSON']['output']>;
  socialPreviewData: Maybe<SocialPreviewType>;
  socialPreviewImageAutoUrl: Maybe<Scalars['String']['output']>;
  socialPreviewImageId: Maybe<Scalars['String']['output']>;
  socialPreviewImageUrl: Maybe<Scalars['String']['output']>;
  sourcePostRelations: Array<PostRelation>;
  spotlight: Maybe<Spotlight>;
  startTime: Maybe<Scalars['Date']['output']>;
  status: Maybe<Scalars['Float']['output']>;
  sticky: Maybe<Scalars['Boolean']['output']>;
  stickyPriority: Maybe<Scalars['Int']['output']>;
  subforumTag: Maybe<Tag>;
  subforumTagId: Maybe<Scalars['String']['output']>;
  submitToFrontpage: Maybe<Scalars['Boolean']['output']>;
  suggestForAlignmentUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  suggestForAlignmentUsers: Array<User>;
  suggestForCuratedUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  suggestForCuratedUsernames: Maybe<Scalars['String']['output']>;
  swrCachingEnabled: Maybe<Scalars['Boolean']['output']>;
  tableOfContents: Maybe<Scalars['JSON']['output']>;
  tableOfContentsRevision: Maybe<Scalars['JSON']['output']>;
  tagRel: Maybe<TagRel>;
  tagRelevance: Maybe<Scalars['JSON']['output']>;
  tags: Maybe<Array<Maybe<Tag>>>;
  targetPostRelations: Array<PostRelation>;
  title: Maybe<Scalars['String']['output']>;
  topLevelCommentCount: Maybe<Scalars['Float']['output']>;
  totalDialogueResponseCount: Scalars['Int']['output'];
  twitterShareUrl: Maybe<Scalars['String']['output']>;
  types: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  unlisted: Maybe<Scalars['Boolean']['output']>;
  unreadDebateResponseCount: Scalars['Int']['output'];
  url: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userAgent: Maybe<Scalars['String']['output']>;
  userIP: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  usersSharedWith: Array<User>;
  version: Maybe<Scalars['String']['output']>;
  viewCount: Maybe<Scalars['Float']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  votingSystem: Maybe<Scalars['String']['output']>;
  wasEverUndrafted: Maybe<Scalars['Boolean']['output']>;
  website: Maybe<Scalars['String']['output']>;
  wordCount: Maybe<Scalars['Int']['output']>;
};


export type PostContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type PostCustomHighlightArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type PostDialogueMessageContentsArgs = {
  dialogueMessageId: InputMaybe<Scalars['String']['input']>;
};


export type PostModerationGuidelinesArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type PostNextPostArgs = {
  sequenceId: InputMaybe<Scalars['String']['input']>;
};


export type PostPrevPostArgs = {
  sequenceId: InputMaybe<Scalars['String']['input']>;
};


export type PostRecentCommentsArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  commentsLimit: InputMaybe<Scalars['Int']['input']>;
  maxAgeHours: InputMaybe<Scalars['Int']['input']>;
};


export type PostRevisionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type PostSequenceArgs = {
  prevOrNext: InputMaybe<Scalars['String']['input']>;
  sequenceId: InputMaybe<Scalars['String']['input']>;
};


export type PostTableOfContentsRevisionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type PostTagRelArgs = {
  tagId: InputMaybe<Scalars['String']['input']>;
};

export type PostAnalytics2Result = {
  __typename?: 'PostAnalytics2Result';
  _id: Maybe<Scalars['String']['output']>;
  comments: Maybe<Scalars['Int']['output']>;
  karma: Maybe<Scalars['Int']['output']>;
  meanReadingTime: Maybe<Scalars['Float']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
  reads: Maybe<Scalars['Int']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  uniqueViews: Maybe<Scalars['Int']['output']>;
  views: Maybe<Scalars['Int']['output']>;
};

export type PostAnalyticsResult = {
  __typename?: 'PostAnalyticsResult';
  allViews: Maybe<Scalars['Int']['output']>;
  medianReadingTime: Maybe<Scalars['Int']['output']>;
  uniqueClientViews: Maybe<Scalars['Int']['output']>;
  uniqueClientViews5Min: Maybe<Scalars['Int']['output']>;
  uniqueClientViews10Sec: Maybe<Scalars['Int']['output']>;
  uniqueClientViewsSeries: Maybe<Array<Maybe<UniqueClientViewsSeries>>>;
};

export type PostEmbedding = {
  __typename?: 'PostEmbedding';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  embeddings: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  lastGeneratedAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  model: Maybe<Scalars['String']['output']>;
  post: Post;
  postHash: Maybe<Scalars['String']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum PostEmbeddingOrderByInput {
  Foobar = 'foobar'
}

export type PostEmbeddingOutput = {
  __typename?: 'PostEmbeddingOutput';
  data: Maybe<PostEmbedding>;
};

export type PostEmbeddingSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PostEmbeddingSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PostEmbeddingSelectorInput>>>;
};

export type PostEmbeddingSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PostKarmaChange = {
  __typename?: 'PostKarmaChange';
  _id: Maybe<Scalars['String']['output']>;
  addedReacts: Maybe<Array<ReactionChange>>;
  eaAddedReacts: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  scoreChange: Maybe<Scalars['Int']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export enum PostOrderByInput {
  Foobar = 'foobar'
}

export type PostOutput = {
  __typename?: 'PostOutput';
  data: Maybe<Post>;
};

export type PostRecommendation = {
  __typename?: 'PostRecommendation';
  _id: Scalars['String']['output'];
  clickedAt: Maybe<Scalars['Date']['output']>;
  clientId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  lastRecommendedAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  post: Post;
  postId: Maybe<Scalars['String']['output']>;
  recommendationCount: Maybe<Scalars['Int']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  strategyName: Maybe<Scalars['String']['output']>;
  strategySettings: Maybe<Scalars['JSON']['output']>;
  user: User;
  userId: Maybe<Scalars['String']['output']>;
};

export enum PostRecommendationOrderByInput {
  Foobar = 'foobar'
}

export type PostRecommendationOutput = {
  __typename?: 'PostRecommendationOutput';
  data: Maybe<PostRecommendation>;
};

export type PostRecommendationSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PostRecommendationSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PostRecommendationSelectorInput>>>;
};

export type PostRecommendationSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PostRelation = {
  __typename?: 'PostRelation';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  order: Maybe<Scalars['Float']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  sourcePost: Maybe<Post>;
  sourcePostId: Maybe<Scalars['String']['output']>;
  targetPost: Maybe<Post>;
  targetPostId: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

export enum PostRelationOrderByInput {
  Foobar = 'foobar'
}

export type PostRelationOutput = {
  __typename?: 'PostRelationOutput';
  data: Maybe<PostRelation>;
};

export type PostRelationSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PostRelationSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PostRelationSelectorInput>>>;
};

export type PostRelationSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PostReviewFilter = {
  endDate: InputMaybe<Scalars['Date']['input']>;
  minKarma: InputMaybe<Scalars['Int']['input']>;
  showEvents: InputMaybe<Scalars['Boolean']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
};

export type PostReviewSort = {
  karma: InputMaybe<Scalars['Boolean']['input']>;
};

export type PostSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PostSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PostSelectorInput>>>;
};

export type PostSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PostViewTime = {
  __typename?: 'PostViewTime';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum PostViewTimeOrderByInput {
  Foobar = 'foobar'
}

export type PostViewTimeOutput = {
  __typename?: 'PostViewTimeOutput';
  data: Maybe<PostViewTime>;
};

export type PostViewTimeSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PostViewTimeSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PostViewTimeSelectorInput>>>;
};

export type PostViewTimeSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PostViews = {
  __typename?: 'PostViews';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum PostViewsOrderByInput {
  Foobar = 'foobar'
}

export type PostViewsOutput = {
  __typename?: 'PostViewsOutput';
  data: Maybe<PostViews>;
};

export type PostViewsSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<PostViewsSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<PostViewsSelectorInput>>>;
};

export type PostViewsSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type PostWithApprovedJargon = {
  __typename?: 'PostWithApprovedJargon';
  jargonTerms: Maybe<Array<JargonTerm>>;
  post: Post;
};

export type PostsBySubscribedAuthorsResult = {
  __typename?: 'PostsBySubscribedAuthorsResult';
  results: Array<Post>;
};

export type PostsUserCommentedOnResult = {
  __typename?: 'PostsUserCommentedOnResult';
  posts: Maybe<Array<Post>>;
};

export type PostsWithActiveDiscussionResult = {
  __typename?: 'PostsWithActiveDiscussionResult';
  results: Array<Post>;
};

export type PostsWithApprovedJargonResult = {
  __typename?: 'PostsWithApprovedJargonResult';
  results: Array<PostWithApprovedJargon>;
};

export type Query = {
  __typename?: 'Query';
  ActiveTagCount: Scalars['Int']['output'];
  AdminMetadata: Maybe<Scalars['String']['output']>;
  AllTagsActivityFeed: AllTagsActivityFeedQueryResults;
  AnalyticsSeries: Maybe<Array<Maybe<AnalyticsSeriesValue>>>;
  ArbitalPageData: Maybe<ArbitalPageData>;
  CanAccessGoogleDoc: Maybe<Scalars['Boolean']['output']>;
  CommentsWithReacts: Maybe<CommentsWithReactsResult>;
  ContinueReading: Maybe<Array<RecommendResumeSequence>>;
  CoronaVirusData: Maybe<CoronaVirusDataSchema>;
  CrossedKarmaThreshold: Maybe<CrossedKarmaThresholdResult>;
  CuratedAndPopularThisWeek: Maybe<CuratedAndPopularThisWeekResult>;
  CurrentFrontpageSurvey: Maybe<SurveySchedule>;
  DigestHighlights: Maybe<DigestHighlightsResult>;
  DigestPlannerData: Maybe<Array<Maybe<DigestPlannerPost>>>;
  DigestPosts: Maybe<Array<Maybe<Post>>>;
  DigestPostsThisWeek: Maybe<DigestPostsThisWeekResult>;
  ElicitBlockData: Maybe<ElicitBlockData>;
  EmailPreview: Maybe<Array<Maybe<EmailPreview>>>;
  GetAllReviewWinners: Array<Post>;
  GetRandomUser: Maybe<User>;
  GivingSeasonHearts: Array<GivingSeasonHeart>;
  GoogleVertexPosts: Maybe<GoogleVertexPostsResult>;
  IsDisplayNameTaken: Scalars['Boolean']['output'];
  Lightcone2024FundraiserStripeAmounts: Maybe<Array<Scalars['Int']['output']>>;
  MigrationsDashboard: Maybe<MigrationsDashboardData>;
  MultiPostAnalytics: MultiPostAnalyticsResult;
  MyDialogues: Maybe<MyDialoguesResult>;
  NotificationDisplays: Maybe<NotificationDisplaysResult>;
  PetrovDay2024CheckNumberOfIncoming: Maybe<PetrovDay2024CheckNumberOfIncomingData>;
  PetrovDayCheckIfIncoming: Maybe<PetrovDayCheckIfIncomingData>;
  PopularComments: Maybe<PopularCommentsResult>;
  PostAnalytics: PostAnalyticsResult;
  PostIsCriticism: Maybe<Scalars['Boolean']['output']>;
  PostsBySubscribedAuthors: Maybe<PostsBySubscribedAuthorsResult>;
  PostsUserCommentedOn: Maybe<UserReadHistoryResult>;
  PostsWithActiveDiscussion: Maybe<PostsWithActiveDiscussionResult>;
  PostsWithApprovedJargon: Maybe<PostsWithApprovedJargonResult>;
  RandomTag: Tag;
  RecentDiscussionFeed: RecentDiscussionFeedQueryResults;
  RecentlyActiveDialogues: Maybe<RecentlyActiveDialoguesResult>;
  RecombeeHybridPosts: Maybe<RecombeeHybridPostsResult>;
  RecombeeLatestPosts: Maybe<RecombeeLatestPostsResult>;
  Recommendations: Maybe<Array<Post>>;
  RevisionsDiff: Maybe<Scalars['String']['output']>;
  RssPostChanges: RssPostChangeInfo;
  SearchSynonyms: Array<Scalars['String']['output']>;
  SiteData: Maybe<Site>;
  SubforumMagicFeed: SubforumMagicFeedQueryResults;
  SubforumNewFeed: SubforumNewFeedQueryResults;
  SubforumOldFeed: SubforumOldFeedQueryResults;
  SubforumRecentCommentsFeed: SubforumRecentCommentsFeedQueryResults;
  SubforumTopFeed: SubforumTopFeedQueryResults;
  SubscribedFeed: SubscribedFeedQueryResults;
  SuggestedFeedSubscriptionUsers: Maybe<SuggestedFeedSubscriptionUsersResult>;
  TagHistoryFeed: TagHistoryFeedQueryResults;
  TagPreview: Maybe<TagPreviewWithSummaries>;
  TagUpdatesByUser: Maybe<Array<TagUpdates>>;
  TagUpdatesInTimeBlock: Maybe<Array<TagUpdates>>;
  TagsByCoreTagId: TagWithTotalCount;
  UserReadHistory: Maybe<UserReadHistoryResult>;
  UserReadsPerCoreTag: Maybe<Array<Maybe<UserCoreTagReads>>>;
  UserWrappedDataByYear: Maybe<WrappedDataByYear>;
  UsersReadPostsOfTargetUser: Maybe<Array<Post>>;
  advisorRequest: Maybe<SingleAdvisorRequestOutput>;
  advisorRequests: Maybe<MultiAdvisorRequestOutput>;
  arbitalTagContentRel: Maybe<SingleArbitalTagContentRelOutput>;
  arbitalTagContentRels: Maybe<MultiArbitalTagContentRelOutput>;
  ban: Maybe<SingleBanOutput>;
  bans: Maybe<MultiBanOutput>;
  book: Maybe<SingleBookOutput>;
  books: Maybe<MultiBookOutput>;
  chapter: Maybe<SingleChapterOutput>;
  chapters: Maybe<MultiChapterOutput>;
  ckEditorUserSession: Maybe<SingleCkEditorUserSessionOutput>;
  ckEditorUserSessions: Maybe<MultiCkEditorUserSessionOutput>;
  clientId: Maybe<SingleClientIdOutput>;
  clientIds: Maybe<MultiClientIdOutput>;
  collection: Maybe<SingleCollectionOutput>;
  collections: Maybe<MultiCollectionOutput>;
  comment: Maybe<SingleCommentOutput>;
  commentModeratorAction: Maybe<SingleCommentModeratorActionOutput>;
  commentModeratorActions: Maybe<MultiCommentModeratorActionOutput>;
  comments: Maybe<MultiCommentOutput>;
  conversation: Maybe<SingleConversationOutput>;
  conversations: Maybe<MultiConversationOutput>;
  convertDocument: Maybe<Scalars['JSON']['output']>;
  curationNotice: Maybe<SingleCurationNoticeOutput>;
  curationNotices: Maybe<MultiCurationNoticeOutput>;
  currentUser: Maybe<User>;
  dialogueCheck: Maybe<SingleDialogueCheckOutput>;
  dialogueChecks: Maybe<MultiDialogueCheckOutput>;
  dialogueMatchPreference: Maybe<SingleDialogueMatchPreferenceOutput>;
  dialogueMatchPreferences: Maybe<MultiDialogueMatchPreferenceOutput>;
  digest: Maybe<SingleDigestOutput>;
  digestPost: Maybe<SingleDigestPostOutput>;
  digestPosts: Maybe<MultiDigestPostOutput>;
  digests: Maybe<MultiDigestOutput>;
  electionCandidate: Maybe<SingleElectionCandidateOutput>;
  electionCandidates: Maybe<MultiElectionCandidateOutput>;
  electionVote: Maybe<SingleElectionVoteOutput>;
  electionVotes: Maybe<MultiElectionVoteOutput>;
  elicitQuestion: Maybe<SingleElicitQuestionOutput>;
  elicitQuestionPrediction: Maybe<SingleElicitQuestionPredictionOutput>;
  elicitQuestionPredictions: Maybe<MultiElicitQuestionPredictionOutput>;
  elicitQuestions: Maybe<MultiElicitQuestionOutput>;
  featuredResource: Maybe<SingleFeaturedResourceOutput>;
  featuredResources: Maybe<MultiFeaturedResourceOutput>;
  forumEvent: Maybe<SingleForumEventOutput>;
  forumEvents: Maybe<MultiForumEventOutput>;
  gardenCode: Maybe<SingleGardenCodeOutput>;
  gardenCodes: Maybe<MultiGardenCodeOutput>;
  getCrosspost: Maybe<Scalars['JSON']['output']>;
  getLinkSharedPost: Maybe<Post>;
  googleServiceAccountSession: Maybe<SingleGoogleServiceAccountSessionOutput>;
  googleServiceAccountSessions: Maybe<MultiGoogleServiceAccountSessionOutput>;
  jargonTerm: Maybe<SingleJargonTermOutput>;
  jargonTerms: Maybe<MultiJargonTermOutput>;
  lWEvent: Maybe<SingleLwEventOutput>;
  lWEvents: Maybe<MultiLwEventOutput>;
  latestDialogueMessages: Maybe<Array<Scalars['String']['output']>>;
  latestGoogleDocMetadata: Maybe<Scalars['JSON']['output']>;
  llmConversation: Maybe<SingleLlmConversationOutput>;
  llmConversations: Maybe<MultiLlmConversationOutput>;
  localgroup: Maybe<SingleLocalgroupOutput>;
  localgroups: Maybe<MultiLocalgroupOutput>;
  message: Maybe<SingleMessageOutput>;
  messages: Maybe<MultiMessageOutput>;
  moderationTemplate: Maybe<SingleModerationTemplateOutput>;
  moderationTemplates: Maybe<MultiModerationTemplateOutput>;
  moderatorAction: Maybe<SingleModeratorActionOutput>;
  moderatorActions: Maybe<MultiModeratorActionOutput>;
  moderatorViewIPAddress: Maybe<ModeratorIpAddressInfo>;
  multiDocument: Maybe<SingleMultiDocumentOutput>;
  multiDocuments: Maybe<MultiMultiDocumentOutput>;
  notification: Maybe<SingleNotificationOutput>;
  notifications: Maybe<MultiNotificationOutput>;
  petrov2024checkIfNuked: Maybe<Scalars['Boolean']['output']>;
  petrovDayAction: Maybe<SinglePetrovDayActionOutput>;
  petrovDayActions: Maybe<MultiPetrovDayActionOutput>;
  podcast: Maybe<SinglePodcastOutput>;
  podcastEpisode: Maybe<SinglePodcastEpisodeOutput>;
  podcastEpisodes: Maybe<MultiPodcastEpisodeOutput>;
  podcasts: Maybe<MultiPodcastOutput>;
  post: Maybe<SinglePostOutput>;
  postEmbedding: Maybe<SinglePostEmbeddingOutput>;
  postEmbeddings: Maybe<MultiPostEmbeddingOutput>;
  postRelation: Maybe<SinglePostRelationOutput>;
  postRelations: Maybe<MultiPostRelationOutput>;
  postViewTime: Maybe<SinglePostViewTimeOutput>;
  postViewTimes: Maybe<MultiPostViewTimeOutput>;
  postViews: Maybe<SinglePostViewsOutput>;
  postViewses: Maybe<MultiPostViewsOutput>;
  posts: Maybe<MultiPostOutput>;
  rSSFeed: Maybe<SingleRssFeedOutput>;
  rSSFeeds: Maybe<MultiRssFeedOutput>;
  report: Maybe<SingleReportOutput>;
  reports: Maybe<MultiReportOutput>;
  reviewVote: Maybe<SingleReviewVoteOutput>;
  reviewVotes: Maybe<MultiReviewVoteOutput>;
  reviewWinner: Maybe<SingleReviewWinnerOutput>;
  reviewWinnerArt: Maybe<SingleReviewWinnerArtOutput>;
  reviewWinnerArts: Maybe<MultiReviewWinnerArtOutput>;
  reviewWinners: Maybe<MultiReviewWinnerOutput>;
  revision: Maybe<SingleRevisionOutput>;
  revisions: Maybe<MultiRevisionOutput>;
  sequence: Maybe<SingleSequenceOutput>;
  sequences: Maybe<MultiSequenceOutput>;
  splashArtCoordinate: Maybe<SingleSplashArtCoordinateOutput>;
  splashArtCoordinates: Maybe<MultiSplashArtCoordinateOutput>;
  spotlight: Maybe<SingleSpotlightOutput>;
  spotlights: Maybe<MultiSpotlightOutput>;
  subscription: Maybe<SingleSubscriptionOutput>;
  subscriptions: Maybe<MultiSubscriptionOutput>;
  survey: Maybe<SingleSurveyOutput>;
  surveyQuestion: Maybe<SingleSurveyQuestionOutput>;
  surveyQuestions: Maybe<MultiSurveyQuestionOutput>;
  surveyResponse: Maybe<SingleSurveyResponseOutput>;
  surveyResponses: Maybe<MultiSurveyResponseOutput>;
  surveySchedule: Maybe<SingleSurveyScheduleOutput>;
  surveySchedules: Maybe<MultiSurveyScheduleOutput>;
  surveys: Maybe<MultiSurveyOutput>;
  tag: Maybe<SingleTagOutput>;
  tagFlag: Maybe<SingleTagFlagOutput>;
  tagFlags: Maybe<MultiTagFlagOutput>;
  tagRel: Maybe<SingleTagRelOutput>;
  tagRels: Maybe<MultiTagRelOutput>;
  tags: Maybe<MultiTagOutput>;
  typingIndicator: Maybe<SingleTypingIndicatorOutput>;
  typingIndicators: Maybe<MultiTypingIndicatorOutput>;
  unreadNotificationCounts: NotificationCounts;
  user: Maybe<SingleUserOutput>;
  userEAGDetail: Maybe<SingleUserEagDetailOutput>;
  userEAGDetails: Maybe<MultiUserEagDetailOutput>;
  userJobAd: Maybe<SingleUserJobAdOutput>;
  userJobAds: Maybe<MultiUserJobAdOutput>;
  userMostValuablePost: Maybe<SingleUserMostValuablePostOutput>;
  userMostValuablePosts: Maybe<MultiUserMostValuablePostOutput>;
  userRateLimit: Maybe<SingleUserRateLimitOutput>;
  userRateLimits: Maybe<MultiUserRateLimitOutput>;
  userTagRel: Maybe<SingleUserTagRelOutput>;
  userTagRels: Maybe<MultiUserTagRelOutput>;
  users: Maybe<MultiUserOutput>;
  vote: Maybe<SingleVoteOutput>;
  votes: Maybe<MultiVoteOutput>;
};


export type QueryAllTagsActivityFeedArgs = {
  cutoff: InputMaybe<Scalars['Date']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAnalyticsSeriesArgs = {
  endDate: InputMaybe<Scalars['Date']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type QueryArbitalPageDataArgs = {
  pageAlias: InputMaybe<Scalars['String']['input']>;
};


export type QueryCanAccessGoogleDocArgs = {
  fileUrl: Scalars['String']['input'];
};


export type QueryCommentsWithReactsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCrossedKarmaThresholdArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCuratedAndPopularThisWeekArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDigestHighlightsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDigestPlannerDataArgs = {
  digestId: InputMaybe<Scalars['String']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
};


export type QueryDigestPostsArgs = {
  num: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDigestPostsThisWeekArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryElicitBlockDataArgs = {
  questionId: InputMaybe<Scalars['String']['input']>;
};


export type QueryEmailPreviewArgs = {
  notificationIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  postId: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetRandomUserArgs = {
  userIsAuthor: Scalars['String']['input'];
};


export type QueryGivingSeasonHeartsArgs = {
  electionName: Scalars['String']['input'];
};


export type QueryGoogleVertexPostsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  settings: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryIsDisplayNameTakenArgs = {
  displayName: Scalars['String']['input'];
};


export type QueryMultiPostAnalyticsArgs = {
  desc: InputMaybe<Scalars['Boolean']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sortBy: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyDialoguesArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryNotificationDisplaysArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};


export type QueryPopularCommentsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostAnalyticsArgs = {
  postId: Scalars['String']['input'];
};


export type QueryPostIsCriticismArgs = {
  args: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryPostsBySubscribedAuthorsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostsUserCommentedOnArgs = {
  filter: InputMaybe<PostReviewFilter>;
  limit: InputMaybe<Scalars['Int']['input']>;
  sort: InputMaybe<PostReviewSort>;
};


export type QueryPostsWithActiveDiscussionArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostsWithApprovedJargonArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentDiscussionFeedArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentlyActiveDialoguesArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecombeeHybridPostsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  settings: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryRecombeeLatestPostsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  settings: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryRecommendationsArgs = {
  algorithm: InputMaybe<Scalars['JSON']['input']>;
  count: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRevisionsDiffArgs = {
  afterRev: Scalars['String']['input'];
  beforeRev: InputMaybe<Scalars['String']['input']>;
  collectionName: Scalars['String']['input'];
  fieldName: Scalars['String']['input'];
  id: InputMaybe<Scalars['String']['input']>;
  trim: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryRssPostChangesArgs = {
  postId: Scalars['String']['input'];
};


export type QuerySubforumMagicFeedArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  cutoff: InputMaybe<Scalars['Float']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubforumNewFeedArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubforumOldFeedArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubforumRecentCommentsFeedArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubforumTopFeedArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  cutoff: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
};


export type QuerySubscribedFeedArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySuggestedFeedSubscriptionUsersArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTagHistoryFeedArgs = {
  cutoff: InputMaybe<Scalars['Date']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  options: InputMaybe<Scalars['JSON']['input']>;
  tagId: Scalars['String']['input'];
};


export type QueryTagPreviewArgs = {
  hash: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};


export type QueryTagUpdatesByUserArgs = {
  limit: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  userId: Scalars['String']['input'];
};


export type QueryTagUpdatesInTimeBlockArgs = {
  after: Scalars['Date']['input'];
  before: Scalars['Date']['input'];
};


export type QueryTagsByCoreTagIdArgs = {
  coreTagId: InputMaybe<Scalars['String']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  searchTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryUserReadHistoryArgs = {
  filter: InputMaybe<PostReviewFilter>;
  limit: InputMaybe<Scalars['Int']['input']>;
  sort: InputMaybe<PostReviewSort>;
};


export type QueryUserReadsPerCoreTagArgs = {
  userId: Scalars['String']['input'];
};


export type QueryUserWrappedDataByYearArgs = {
  userId: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};


export type QueryUsersReadPostsOfTargetUserArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  targetUserId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type QueryAdvisorRequestArgs = {
  input: InputMaybe<SingleAdvisorRequestInput>;
};


export type QueryAdvisorRequestsArgs = {
  input: InputMaybe<MultiAdvisorRequestInput>;
};


export type QueryArbitalTagContentRelArgs = {
  input: InputMaybe<SingleArbitalTagContentRelInput>;
};


export type QueryArbitalTagContentRelsArgs = {
  input: InputMaybe<MultiArbitalTagContentRelInput>;
};


export type QueryBanArgs = {
  input: InputMaybe<SingleBanInput>;
};


export type QueryBansArgs = {
  input: InputMaybe<MultiBanInput>;
};


export type QueryBookArgs = {
  input: InputMaybe<SingleBookInput>;
};


export type QueryBooksArgs = {
  input: InputMaybe<MultiBookInput>;
};


export type QueryChapterArgs = {
  input: InputMaybe<SingleChapterInput>;
};


export type QueryChaptersArgs = {
  input: InputMaybe<MultiChapterInput>;
};


export type QueryCkEditorUserSessionArgs = {
  input: InputMaybe<SingleCkEditorUserSessionInput>;
};


export type QueryCkEditorUserSessionsArgs = {
  input: InputMaybe<MultiCkEditorUserSessionInput>;
};


export type QueryClientIdArgs = {
  input: InputMaybe<SingleClientIdInput>;
};


export type QueryClientIdsArgs = {
  input: InputMaybe<MultiClientIdInput>;
};


export type QueryCollectionArgs = {
  input: InputMaybe<SingleCollectionInput>;
};


export type QueryCollectionsArgs = {
  input: InputMaybe<MultiCollectionInput>;
};


export type QueryCommentArgs = {
  input: InputMaybe<SingleCommentInput>;
};


export type QueryCommentModeratorActionArgs = {
  input: InputMaybe<SingleCommentModeratorActionInput>;
};


export type QueryCommentModeratorActionsArgs = {
  input: InputMaybe<MultiCommentModeratorActionInput>;
};


export type QueryCommentsArgs = {
  input: InputMaybe<MultiCommentInput>;
};


export type QueryConversationArgs = {
  input: InputMaybe<SingleConversationInput>;
};


export type QueryConversationsArgs = {
  input: InputMaybe<MultiConversationInput>;
};


export type QueryConvertDocumentArgs = {
  document: InputMaybe<Scalars['JSON']['input']>;
  targetFormat: InputMaybe<Scalars['String']['input']>;
};


export type QueryCurationNoticeArgs = {
  input: InputMaybe<SingleCurationNoticeInput>;
};


export type QueryCurationNoticesArgs = {
  input: InputMaybe<MultiCurationNoticeInput>;
};


export type QueryDialogueCheckArgs = {
  input: InputMaybe<SingleDialogueCheckInput>;
};


export type QueryDialogueChecksArgs = {
  input: InputMaybe<MultiDialogueCheckInput>;
};


export type QueryDialogueMatchPreferenceArgs = {
  input: InputMaybe<SingleDialogueMatchPreferenceInput>;
};


export type QueryDialogueMatchPreferencesArgs = {
  input: InputMaybe<MultiDialogueMatchPreferenceInput>;
};


export type QueryDigestArgs = {
  input: InputMaybe<SingleDigestInput>;
};


export type QueryDigestPostArgs = {
  input: InputMaybe<SingleDigestPostInput>;
};


export type QueryDigestPostsArgs = {
  input: InputMaybe<MultiDigestPostInput>;
};


export type QueryDigestsArgs = {
  input: InputMaybe<MultiDigestInput>;
};


export type QueryElectionCandidateArgs = {
  input: InputMaybe<SingleElectionCandidateInput>;
};


export type QueryElectionCandidatesArgs = {
  input: InputMaybe<MultiElectionCandidateInput>;
};


export type QueryElectionVoteArgs = {
  input: InputMaybe<SingleElectionVoteInput>;
};


export type QueryElectionVotesArgs = {
  input: InputMaybe<MultiElectionVoteInput>;
};


export type QueryElicitQuestionArgs = {
  input: InputMaybe<SingleElicitQuestionInput>;
};


export type QueryElicitQuestionPredictionArgs = {
  input: InputMaybe<SingleElicitQuestionPredictionInput>;
};


export type QueryElicitQuestionPredictionsArgs = {
  input: InputMaybe<MultiElicitQuestionPredictionInput>;
};


export type QueryElicitQuestionsArgs = {
  input: InputMaybe<MultiElicitQuestionInput>;
};


export type QueryFeaturedResourceArgs = {
  input: InputMaybe<SingleFeaturedResourceInput>;
};


export type QueryFeaturedResourcesArgs = {
  input: InputMaybe<MultiFeaturedResourceInput>;
};


export type QueryForumEventArgs = {
  input: InputMaybe<SingleForumEventInput>;
};


export type QueryForumEventsArgs = {
  input: InputMaybe<MultiForumEventInput>;
};


export type QueryGardenCodeArgs = {
  input: InputMaybe<SingleGardenCodeInput>;
};


export type QueryGardenCodesArgs = {
  input: InputMaybe<MultiGardenCodeInput>;
};


export type QueryGetCrosspostArgs = {
  args: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryGetLinkSharedPostArgs = {
  linkSharingKey: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


export type QueryGoogleServiceAccountSessionArgs = {
  input: InputMaybe<SingleGoogleServiceAccountSessionInput>;
};


export type QueryGoogleServiceAccountSessionsArgs = {
  input: InputMaybe<MultiGoogleServiceAccountSessionInput>;
};


export type QueryJargonTermArgs = {
  input: InputMaybe<SingleJargonTermInput>;
};


export type QueryJargonTermsArgs = {
  input: InputMaybe<MultiJargonTermInput>;
};


export type QueryLwEventArgs = {
  input: InputMaybe<SingleLwEventInput>;
};


export type QueryLwEventsArgs = {
  input: InputMaybe<MultiLwEventInput>;
};


export type QueryLatestDialogueMessagesArgs = {
  dialogueId: Scalars['String']['input'];
  numMessages: Scalars['Int']['input'];
};


export type QueryLatestGoogleDocMetadataArgs = {
  postId: Scalars['String']['input'];
  version: InputMaybe<Scalars['String']['input']>;
};


export type QueryLlmConversationArgs = {
  input: InputMaybe<SingleLlmConversationInput>;
};


export type QueryLlmConversationsArgs = {
  input: InputMaybe<MultiLlmConversationInput>;
};


export type QueryLocalgroupArgs = {
  input: InputMaybe<SingleLocalgroupInput>;
};


export type QueryLocalgroupsArgs = {
  input: InputMaybe<MultiLocalgroupInput>;
};


export type QueryMessageArgs = {
  input: InputMaybe<SingleMessageInput>;
};


export type QueryMessagesArgs = {
  input: InputMaybe<MultiMessageInput>;
};


export type QueryModerationTemplateArgs = {
  input: InputMaybe<SingleModerationTemplateInput>;
};


export type QueryModerationTemplatesArgs = {
  input: InputMaybe<MultiModerationTemplateInput>;
};


export type QueryModeratorActionArgs = {
  input: InputMaybe<SingleModeratorActionInput>;
};


export type QueryModeratorActionsArgs = {
  input: InputMaybe<MultiModeratorActionInput>;
};


export type QueryModeratorViewIpAddressArgs = {
  ipAddress: Scalars['String']['input'];
};


export type QueryMultiDocumentArgs = {
  input: InputMaybe<SingleMultiDocumentInput>;
};


export type QueryMultiDocumentsArgs = {
  input: InputMaybe<MultiMultiDocumentInput>;
};


export type QueryNotificationArgs = {
  input: InputMaybe<SingleNotificationInput>;
};


export type QueryNotificationsArgs = {
  input: InputMaybe<MultiNotificationInput>;
};


export type QueryPetrovDayActionArgs = {
  input: InputMaybe<SinglePetrovDayActionInput>;
};


export type QueryPetrovDayActionsArgs = {
  input: InputMaybe<MultiPetrovDayActionInput>;
};


export type QueryPodcastArgs = {
  input: InputMaybe<SinglePodcastInput>;
};


export type QueryPodcastEpisodeArgs = {
  input: InputMaybe<SinglePodcastEpisodeInput>;
};


export type QueryPodcastEpisodesArgs = {
  input: InputMaybe<MultiPodcastEpisodeInput>;
};


export type QueryPodcastsArgs = {
  input: InputMaybe<MultiPodcastInput>;
};


export type QueryPostArgs = {
  input: InputMaybe<SinglePostInput>;
};


export type QueryPostEmbeddingArgs = {
  input: InputMaybe<SinglePostEmbeddingInput>;
};


export type QueryPostEmbeddingsArgs = {
  input: InputMaybe<MultiPostEmbeddingInput>;
};


export type QueryPostRelationArgs = {
  input: InputMaybe<SinglePostRelationInput>;
};


export type QueryPostRelationsArgs = {
  input: InputMaybe<MultiPostRelationInput>;
};


export type QueryPostViewTimeArgs = {
  input: InputMaybe<SinglePostViewTimeInput>;
};


export type QueryPostViewTimesArgs = {
  input: InputMaybe<MultiPostViewTimeInput>;
};


export type QueryPostViewsArgs = {
  input: InputMaybe<SinglePostViewsInput>;
};


export type QueryPostViewsesArgs = {
  input: InputMaybe<MultiPostViewsInput>;
};


export type QueryPostsArgs = {
  input: InputMaybe<MultiPostInput>;
};


export type QueryRSsFeedArgs = {
  input: InputMaybe<SingleRssFeedInput>;
};


export type QueryRSsFeedsArgs = {
  input: InputMaybe<MultiRssFeedInput>;
};


export type QueryReportArgs = {
  input: InputMaybe<SingleReportInput>;
};


export type QueryReportsArgs = {
  input: InputMaybe<MultiReportInput>;
};


export type QueryReviewVoteArgs = {
  input: InputMaybe<SingleReviewVoteInput>;
};


export type QueryReviewVotesArgs = {
  input: InputMaybe<MultiReviewVoteInput>;
};


export type QueryReviewWinnerArgs = {
  input: InputMaybe<SingleReviewWinnerInput>;
};


export type QueryReviewWinnerArtArgs = {
  input: InputMaybe<SingleReviewWinnerArtInput>;
};


export type QueryReviewWinnerArtsArgs = {
  input: InputMaybe<MultiReviewWinnerArtInput>;
};


export type QueryReviewWinnersArgs = {
  input: InputMaybe<MultiReviewWinnerInput>;
};


export type QueryRevisionArgs = {
  input: InputMaybe<SingleRevisionInput>;
};


export type QueryRevisionsArgs = {
  input: InputMaybe<MultiRevisionInput>;
};


export type QuerySequenceArgs = {
  input: InputMaybe<SingleSequenceInput>;
};


export type QuerySequencesArgs = {
  input: InputMaybe<MultiSequenceInput>;
};


export type QuerySplashArtCoordinateArgs = {
  input: InputMaybe<SingleSplashArtCoordinateInput>;
};


export type QuerySplashArtCoordinatesArgs = {
  input: InputMaybe<MultiSplashArtCoordinateInput>;
};


export type QuerySpotlightArgs = {
  input: InputMaybe<SingleSpotlightInput>;
};


export type QuerySpotlightsArgs = {
  input: InputMaybe<MultiSpotlightInput>;
};


export type QuerySubscriptionArgs = {
  input: InputMaybe<SingleSubscriptionInput>;
};


export type QuerySubscriptionsArgs = {
  input: InputMaybe<MultiSubscriptionInput>;
};


export type QuerySurveyArgs = {
  input: InputMaybe<SingleSurveyInput>;
};


export type QuerySurveyQuestionArgs = {
  input: InputMaybe<SingleSurveyQuestionInput>;
};


export type QuerySurveyQuestionsArgs = {
  input: InputMaybe<MultiSurveyQuestionInput>;
};


export type QuerySurveyResponseArgs = {
  input: InputMaybe<SingleSurveyResponseInput>;
};


export type QuerySurveyResponsesArgs = {
  input: InputMaybe<MultiSurveyResponseInput>;
};


export type QuerySurveyScheduleArgs = {
  input: InputMaybe<SingleSurveyScheduleInput>;
};


export type QuerySurveySchedulesArgs = {
  input: InputMaybe<MultiSurveyScheduleInput>;
};


export type QuerySurveysArgs = {
  input: InputMaybe<MultiSurveyInput>;
};


export type QueryTagArgs = {
  input: InputMaybe<SingleTagInput>;
};


export type QueryTagFlagArgs = {
  input: InputMaybe<SingleTagFlagInput>;
};


export type QueryTagFlagsArgs = {
  input: InputMaybe<MultiTagFlagInput>;
};


export type QueryTagRelArgs = {
  input: InputMaybe<SingleTagRelInput>;
};


export type QueryTagRelsArgs = {
  input: InputMaybe<MultiTagRelInput>;
};


export type QueryTagsArgs = {
  input: InputMaybe<MultiTagInput>;
};


export type QueryTypingIndicatorArgs = {
  input: InputMaybe<SingleTypingIndicatorInput>;
};


export type QueryTypingIndicatorsArgs = {
  input: InputMaybe<MultiTypingIndicatorInput>;
};


export type QueryUserArgs = {
  input: InputMaybe<SingleUserInput>;
};


export type QueryUserEagDetailArgs = {
  input: InputMaybe<SingleUserEagDetailInput>;
};


export type QueryUserEagDetailsArgs = {
  input: InputMaybe<MultiUserEagDetailInput>;
};


export type QueryUserJobAdArgs = {
  input: InputMaybe<SingleUserJobAdInput>;
};


export type QueryUserJobAdsArgs = {
  input: InputMaybe<MultiUserJobAdInput>;
};


export type QueryUserMostValuablePostArgs = {
  input: InputMaybe<SingleUserMostValuablePostInput>;
};


export type QueryUserMostValuablePostsArgs = {
  input: InputMaybe<MultiUserMostValuablePostInput>;
};


export type QueryUserRateLimitArgs = {
  input: InputMaybe<SingleUserRateLimitInput>;
};


export type QueryUserRateLimitsArgs = {
  input: InputMaybe<MultiUserRateLimitInput>;
};


export type QueryUserTagRelArgs = {
  input: InputMaybe<SingleUserTagRelInput>;
};


export type QueryUserTagRelsArgs = {
  input: InputMaybe<MultiUserTagRelInput>;
};


export type QueryUsersArgs = {
  input: InputMaybe<MultiUserInput>;
};


export type QueryVoteArgs = {
  input: InputMaybe<SingleVoteInput>;
};


export type QueryVotesArgs = {
  input: InputMaybe<MultiVoteInput>;
};

export type RssFeed = {
  __typename?: 'RSSFeed';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  displayFullContent: Maybe<Scalars['Boolean']['output']>;
  importAsDraft: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  nickname: Maybe<Scalars['String']['output']>;
  ownedByUser: Maybe<Scalars['Boolean']['output']>;
  rawFeed: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  setCanonicalUrl: Maybe<Scalars['Boolean']['output']>;
  status: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum RssFeedOrderByInput {
  Foobar = 'foobar'
}

export type RssFeedOutput = {
  __typename?: 'RSSFeedOutput';
  data: Maybe<RssFeed>;
};

export type RssFeedSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<RssFeedSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<RssFeedSelectorInput>>>;
};

export type RssFeedSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ReactionChange = {
  __typename?: 'ReactionChange';
  reactionType: Scalars['String']['output'];
  userId: Maybe<Scalars['String']['output']>;
};

export type ReadStatus = {
  __typename?: 'ReadStatus';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum ReadStatusOrderByInput {
  Foobar = 'foobar'
}

export type ReadStatusOutput = {
  __typename?: 'ReadStatusOutput';
  data: Maybe<ReadStatus>;
};

export type ReadStatusSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ReadStatusSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ReadStatusSelectorInput>>>;
};

export type ReadStatusSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type RecentDiscussionFeedEntryType = {
  __typename?: 'RecentDiscussionFeedEntryType';
  postCommented: Maybe<Post>;
  shortformCommented: Maybe<Post>;
  tagDiscussed: Maybe<Tag>;
  tagRevised: Maybe<Revision>;
  type: Scalars['String']['output'];
};

export type RecentDiscussionFeedQueryResults = {
  __typename?: 'RecentDiscussionFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<RecentDiscussionFeedEntryType>>;
};

export type RecentlyActiveDialoguesResult = {
  __typename?: 'RecentlyActiveDialoguesResult';
  results: Array<Post>;
};

export type RecombeeHybridPostsResult = {
  __typename?: 'RecombeeHybridPostsResult';
  results: Array<RecombeeRecommendedPost>;
};

export type RecombeeLatestPostsResult = {
  __typename?: 'RecombeeLatestPostsResult';
  results: Array<RecombeeRecommendedPost>;
};

export type RecombeeRecommendedPost = {
  __typename?: 'RecombeeRecommendedPost';
  curated: Maybe<Scalars['Boolean']['output']>;
  generatedAt: Maybe<Scalars['Date']['output']>;
  post: Post;
  recommId: Maybe<Scalars['String']['output']>;
  scenario: Maybe<Scalars['String']['output']>;
  stickied: Maybe<Scalars['Boolean']['output']>;
};

export type RecommendResumeSequence = {
  __typename?: 'RecommendResumeSequence';
  collection: Maybe<Collection>;
  lastReadTime: Maybe<Scalars['Date']['output']>;
  nextPost: Post;
  numRead: Maybe<Scalars['Int']['output']>;
  numTotal: Maybe<Scalars['Int']['output']>;
  sequence: Maybe<Sequence>;
};

export type RecommendationsCache = {
  __typename?: 'RecommendationsCache';
  _id: Scalars['String']['output'];
  attributionId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  scenario: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  source: Maybe<Scalars['String']['output']>;
  ttlMs: Maybe<Scalars['Float']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum RecommendationsCacheOrderByInput {
  Foobar = 'foobar'
}

export type RecommendationsCacheOutput = {
  __typename?: 'RecommendationsCacheOutput';
  data: Maybe<RecommendationsCache>;
};

export type RecommendationsCacheSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<RecommendationsCacheSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<RecommendationsCacheSelectorInput>>>;
};

export type RecommendationsCacheSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Report = {
  __typename?: 'Report';
  _id: Scalars['String']['output'];
  claimedUser: Maybe<User>;
  claimedUserId: Maybe<Scalars['String']['output']>;
  closedAt: Maybe<Scalars['Date']['output']>;
  comment: Maybe<Comment>;
  commentId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  description: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  link: Maybe<Scalars['String']['output']>;
  markedAsSpam: Maybe<Scalars['Boolean']['output']>;
  post: Maybe<Post>;
  postId: Maybe<Scalars['String']['output']>;
  reportedAsSpam: Maybe<Scalars['Boolean']['output']>;
  reportedUser: Maybe<User>;
  reportedUserId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: User;
  userId: Maybe<Scalars['String']['output']>;
};

export enum ReportOrderByInput {
  Foobar = 'foobar'
}

export type ReportOutput = {
  __typename?: 'ReportOutput';
  data: Maybe<Report>;
};

export type ReportSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ReportSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ReportSelectorInput>>>;
};

export type ReportSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ReviewVote = {
  __typename?: 'ReviewVote';
  _id: Scalars['String']['output'];
  comment: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  dummy: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  post: Maybe<Post>;
  postId: Maybe<Scalars['String']['output']>;
  quadraticScore: Maybe<Scalars['Int']['output']>;
  qualitativeScore: Maybe<Scalars['Int']['output']>;
  reactions: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
  year: Maybe<Scalars['String']['output']>;
};

export enum ReviewVoteOrderByInput {
  Foobar = 'foobar'
}

export type ReviewVoteOutput = {
  __typename?: 'ReviewVoteOutput';
  data: Maybe<ReviewVote>;
};

export type ReviewVoteSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ReviewVoteSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ReviewVoteSelectorInput>>>;
};

export type ReviewVoteSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type ReviewWinner = {
  __typename?: 'ReviewWinner';
  _id: Scalars['String']['output'];
  category: Maybe<Scalars['String']['output']>;
  competitorCount: Maybe<Scalars['Int']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  curatedOrder: Maybe<Scalars['Float']['output']>;
  isAI: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  post: Post;
  postId: Maybe<Scalars['String']['output']>;
  reviewRanking: Maybe<Scalars['Float']['output']>;
  reviewWinnerArt: Maybe<ReviewWinnerArt>;
  reviewYear: Maybe<Scalars['Float']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export type ReviewWinnerArt = {
  __typename?: 'ReviewWinnerArt';
  _id: Scalars['String']['output'];
  activeSplashArtCoordinates: Maybe<SplashArtCoordinate>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  splashArtImagePrompt: Maybe<Scalars['String']['output']>;
  splashArtImageUrl: Maybe<Scalars['String']['output']>;
};

export enum ReviewWinnerArtOrderByInput {
  Foobar = 'foobar'
}

export type ReviewWinnerArtOutput = {
  __typename?: 'ReviewWinnerArtOutput';
  data: Maybe<ReviewWinnerArt>;
};

export type ReviewWinnerArtSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ReviewWinnerArtSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ReviewWinnerArtSelectorInput>>>;
};

export type ReviewWinnerArtSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export enum ReviewWinnerOrderByInput {
  Foobar = 'foobar'
}

export type ReviewWinnerOutput = {
  __typename?: 'ReviewWinnerOutput';
  data: Maybe<ReviewWinner>;
};

export type ReviewWinnerSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<ReviewWinnerSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<ReviewWinnerSelectorInput>>>;
};

export type ReviewWinnerSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Revision = {
  __typename?: 'Revision';
  _id: Scalars['String']['output'];
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  changeMetrics: Maybe<Scalars['JSON']['output']>;
  ckEditorMarkup: Maybe<Scalars['String']['output']>;
  collectionName: Maybe<Scalars['String']['output']>;
  commitMessage: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  draft: Maybe<Scalars['Boolean']['output']>;
  draftJS: Maybe<Scalars['JSON']['output']>;
  editedAt: Maybe<Scalars['Date']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  fieldName: Maybe<Scalars['String']['output']>;
  googleDocMetadata: Maybe<Scalars['JSON']['output']>;
  hasFootnotes: Maybe<Scalars['Boolean']['output']>;
  html: Maybe<Scalars['String']['output']>;
  htmlHighlight: Scalars['String']['output'];
  htmlHighlightStartingAtHash: Scalars['String']['output'];
  legacyData: Maybe<Scalars['JSON']['output']>;
  lens: Maybe<MultiDocument>;
  markdown: Maybe<Scalars['String']['output']>;
  originalContents: Maybe<ContentType>;
  plaintextDescription: Scalars['String']['output'];
  plaintextMainText: Scalars['String']['output'];
  post: Maybe<Post>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  skipAttributions: Maybe<Scalars['Boolean']['output']>;
  summary: Maybe<MultiDocument>;
  tag: Maybe<Tag>;
  updateType: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['String']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  wordCount: Maybe<Scalars['Float']['output']>;
};


export type RevisionHtmlHighlightStartingAtHashArgs = {
  hash: InputMaybe<Scalars['String']['input']>;
};

export enum RevisionOrderByInput {
  Foobar = 'foobar'
}

export type RevisionOutput = {
  __typename?: 'RevisionOutput';
  data: Maybe<Revision>;
};

export type RevisionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<RevisionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<RevisionSelectorInput>>>;
};

export type RevisionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type RevisionsKarmaChange = {
  __typename?: 'RevisionsKarmaChange';
  _id: Maybe<Scalars['String']['output']>;
  addedReacts: Maybe<Array<ReactionChange>>;
  eaAddedReacts: Maybe<Scalars['JSON']['output']>;
  scoreChange: Maybe<Scalars['Int']['output']>;
  tagId: Maybe<Scalars['String']['output']>;
  tagName: Maybe<Scalars['String']['output']>;
  tagSlug: Maybe<Scalars['String']['output']>;
};

export type RssPostChangeInfo = {
  __typename?: 'RssPostChangeInfo';
  htmlDiff: Scalars['String']['output'];
  isChanged: Scalars['Boolean']['output'];
  newHtml: Scalars['String']['output'];
};

export type Sequence = {
  __typename?: 'Sequence';
  _id: Scalars['String']['output'];
  af: Maybe<Scalars['Boolean']['output']>;
  bannerImageId: Maybe<Scalars['String']['output']>;
  canonicalCollection: Maybe<Collection>;
  canonicalCollectionSlug: Maybe<Scalars['String']['output']>;
  chapters: Maybe<Array<Maybe<Chapter>>>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  curatedOrder: Maybe<Scalars['Float']['output']>;
  draft: Maybe<Scalars['Boolean']['output']>;
  gridImageId: Maybe<Scalars['String']['output']>;
  hidden: Maybe<Scalars['Boolean']['output']>;
  hideFromAuthorPage: Maybe<Scalars['Boolean']['output']>;
  isDeleted: Maybe<Scalars['Boolean']['output']>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  noindex: Maybe<Scalars['Boolean']['output']>;
  postsCount: Scalars['Int']['output'];
  readPostsCount: Scalars['Int']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  title: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
  userProfileOrder: Maybe<Scalars['Float']['output']>;
};


export type SequenceContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum SequenceOrderByInput {
  Foobar = 'foobar'
}

export type SequenceOutput = {
  __typename?: 'SequenceOutput';
  data: Maybe<Sequence>;
};

export type SequenceSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SequenceSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SequenceSelectorInput>>>;
};

export type SequenceSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Session = {
  __typename?: 'Session';
  _id: Maybe<Scalars['String']['output']>;
  expires: Maybe<Scalars['Date']['output']>;
  lastModified: Maybe<Scalars['Date']['output']>;
  session: Maybe<Scalars['JSON']['output']>;
};

export enum SessionOrderByInput {
  Foobar = 'foobar'
}

export type SessionOutput = {
  __typename?: 'SessionOutput';
  data: Maybe<Session>;
};

export type SessionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SessionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SessionSelectorInput>>>;
};

export type SessionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type SideCommentCache = {
  __typename?: 'SideCommentCache';
  _id: Scalars['String']['output'];
  annotatedHtml: Maybe<Scalars['String']['output']>;
  commentsByBlock: Maybe<Scalars['JSON']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  version: Maybe<Scalars['Float']['output']>;
};

export enum SideCommentCacheOrderByInput {
  Foobar = 'foobar'
}

export type SideCommentCacheOutput = {
  __typename?: 'SideCommentCacheOutput';
  data: Maybe<SideCommentCache>;
};

export type SideCommentCacheSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SideCommentCacheSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SideCommentCacheSelectorInput>>>;
};

export type SideCommentCacheSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type SingleAdvisorRequestInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<AdvisorRequestSelectorUniqueInput>;
};

export type SingleAdvisorRequestOutput = {
  __typename?: 'SingleAdvisorRequestOutput';
  result: Maybe<AdvisorRequest>;
};

export type SingleArbitalCachesInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ArbitalCachesSelectorUniqueInput>;
};

export type SingleArbitalCachesOutput = {
  __typename?: 'SingleArbitalCachesOutput';
  result: Maybe<ArbitalCaches>;
};

export type SingleArbitalTagContentRelInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ArbitalTagContentRelSelectorUniqueInput>;
};

export type SingleArbitalTagContentRelOutput = {
  __typename?: 'SingleArbitalTagContentRelOutput';
  result: Maybe<ArbitalTagContentRel>;
};

export type SingleBanInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<BanSelectorUniqueInput>;
};

export type SingleBanOutput = {
  __typename?: 'SingleBanOutput';
  result: Maybe<Ban>;
};

export type SingleBookInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<BookSelectorUniqueInput>;
};

export type SingleBookOutput = {
  __typename?: 'SingleBookOutput';
  result: Maybe<Book>;
};

export type SingleChapterInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ChapterSelectorUniqueInput>;
};

export type SingleChapterOutput = {
  __typename?: 'SingleChapterOutput';
  result: Maybe<Chapter>;
};

export type SingleCkEditorUserSessionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<CkEditorUserSessionSelectorUniqueInput>;
};

export type SingleCkEditorUserSessionOutput = {
  __typename?: 'SingleCkEditorUserSessionOutput';
  result: Maybe<CkEditorUserSession>;
};

export type SingleClientIdInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ClientIdSelectorUniqueInput>;
};

export type SingleClientIdOutput = {
  __typename?: 'SingleClientIdOutput';
  result: Maybe<ClientId>;
};

export type SingleCollectionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<CollectionSelectorUniqueInput>;
};

export type SingleCollectionOutput = {
  __typename?: 'SingleCollectionOutput';
  result: Maybe<Collection>;
};

export type SingleCommentInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<CommentSelectorUniqueInput>;
};

export type SingleCommentModeratorActionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<CommentModeratorActionSelectorUniqueInput>;
};

export type SingleCommentModeratorActionOutput = {
  __typename?: 'SingleCommentModeratorActionOutput';
  result: Maybe<CommentModeratorAction>;
};

export type SingleCommentOutput = {
  __typename?: 'SingleCommentOutput';
  result: Maybe<Comment>;
};

export type SingleConversationInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ConversationSelectorUniqueInput>;
};

export type SingleConversationOutput = {
  __typename?: 'SingleConversationOutput';
  result: Maybe<Conversation>;
};

export type SingleCronHistoryInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<CronHistorySelectorUniqueInput>;
};

export type SingleCronHistoryOutput = {
  __typename?: 'SingleCronHistoryOutput';
  result: Maybe<CronHistory>;
};

export type SingleCurationEmailInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<CurationEmailSelectorUniqueInput>;
};

export type SingleCurationEmailOutput = {
  __typename?: 'SingleCurationEmailOutput';
  result: Maybe<CurationEmail>;
};

export type SingleCurationNoticeInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<CurationNoticeSelectorUniqueInput>;
};

export type SingleCurationNoticeOutput = {
  __typename?: 'SingleCurationNoticeOutput';
  result: Maybe<CurationNotice>;
};

export type SingleDatabaseMetadataInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<DatabaseMetadataSelectorUniqueInput>;
};

export type SingleDatabaseMetadataOutput = {
  __typename?: 'SingleDatabaseMetadataOutput';
  result: Maybe<DatabaseMetadata>;
};

export type SingleDebouncerEventsInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<DebouncerEventsSelectorUniqueInput>;
};

export type SingleDebouncerEventsOutput = {
  __typename?: 'SingleDebouncerEventsOutput';
  result: Maybe<DebouncerEvents>;
};

export type SingleDialogueCheckInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<DialogueCheckSelectorUniqueInput>;
};

export type SingleDialogueCheckOutput = {
  __typename?: 'SingleDialogueCheckOutput';
  result: Maybe<DialogueCheck>;
};

export type SingleDialogueMatchPreferenceInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<DialogueMatchPreferenceSelectorUniqueInput>;
};

export type SingleDialogueMatchPreferenceOutput = {
  __typename?: 'SingleDialogueMatchPreferenceOutput';
  result: Maybe<DialogueMatchPreference>;
};

export type SingleDigestInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<DigestSelectorUniqueInput>;
};

export type SingleDigestOutput = {
  __typename?: 'SingleDigestOutput';
  result: Maybe<Digest>;
};

export type SingleDigestPostInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<DigestPostSelectorUniqueInput>;
};

export type SingleDigestPostOutput = {
  __typename?: 'SingleDigestPostOutput';
  result: Maybe<DigestPost>;
};

export type SingleElectionCandidateInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ElectionCandidateSelectorUniqueInput>;
};

export type SingleElectionCandidateOutput = {
  __typename?: 'SingleElectionCandidateOutput';
  result: Maybe<ElectionCandidate>;
};

export type SingleElectionVoteInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ElectionVoteSelectorUniqueInput>;
};

export type SingleElectionVoteOutput = {
  __typename?: 'SingleElectionVoteOutput';
  result: Maybe<ElectionVote>;
};

export type SingleElicitQuestionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ElicitQuestionSelectorUniqueInput>;
};

export type SingleElicitQuestionOutput = {
  __typename?: 'SingleElicitQuestionOutput';
  result: Maybe<ElicitQuestion>;
};

export type SingleElicitQuestionPredictionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ElicitQuestionPredictionSelectorUniqueInput>;
};

export type SingleElicitQuestionPredictionOutput = {
  __typename?: 'SingleElicitQuestionPredictionOutput';
  result: Maybe<ElicitQuestionPrediction>;
};

export type SingleEmailTokensInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<EmailTokensSelectorUniqueInput>;
};

export type SingleEmailTokensOutput = {
  __typename?: 'SingleEmailTokensOutput';
  result: Maybe<EmailTokens>;
};

export type SingleFeaturedResourceInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<FeaturedResourceSelectorUniqueInput>;
};

export type SingleFeaturedResourceOutput = {
  __typename?: 'SingleFeaturedResourceOutput';
  result: Maybe<FeaturedResource>;
};

export type SingleFieldChangeInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<FieldChangeSelectorUniqueInput>;
};

export type SingleFieldChangeOutput = {
  __typename?: 'SingleFieldChangeOutput';
  result: Maybe<FieldChange>;
};

export type SingleForumEventInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ForumEventSelectorUniqueInput>;
};

export type SingleForumEventOutput = {
  __typename?: 'SingleForumEventOutput';
  result: Maybe<ForumEvent>;
};

export type SingleGardenCodeInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<GardenCodeSelectorUniqueInput>;
};

export type SingleGardenCodeOutput = {
  __typename?: 'SingleGardenCodeOutput';
  result: Maybe<GardenCode>;
};

export type SingleGoogleServiceAccountSessionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<GoogleServiceAccountSessionSelectorUniqueInput>;
};

export type SingleGoogleServiceAccountSessionOutput = {
  __typename?: 'SingleGoogleServiceAccountSessionOutput';
  result: Maybe<GoogleServiceAccountSession>;
};

export type SingleImagesInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ImagesSelectorUniqueInput>;
};

export type SingleImagesOutput = {
  __typename?: 'SingleImagesOutput';
  result: Maybe<Images>;
};

export type SingleJargonTermInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<JargonTermSelectorUniqueInput>;
};

export type SingleJargonTermOutput = {
  __typename?: 'SingleJargonTermOutput';
  result: Maybe<JargonTerm>;
};

export type SingleLwEventInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<LwEventSelectorUniqueInput>;
};

export type SingleLwEventOutput = {
  __typename?: 'SingleLWEventOutput';
  result: Maybe<LwEvent>;
};

export type SingleLegacyDataInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<LegacyDataSelectorUniqueInput>;
};

export type SingleLegacyDataOutput = {
  __typename?: 'SingleLegacyDataOutput';
  result: Maybe<LegacyData>;
};

export type SingleLlmConversationInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<LlmConversationSelectorUniqueInput>;
};

export type SingleLlmConversationOutput = {
  __typename?: 'SingleLlmConversationOutput';
  result: Maybe<LlmConversation>;
};

export type SingleLlmMessageInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<LlmMessageSelectorUniqueInput>;
};

export type SingleLlmMessageOutput = {
  __typename?: 'SingleLlmMessageOutput';
  result: Maybe<LlmMessage>;
};

export type SingleLocalgroupInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<LocalgroupSelectorUniqueInput>;
};

export type SingleLocalgroupOutput = {
  __typename?: 'SingleLocalgroupOutput';
  result: Maybe<Localgroup>;
};

export type SingleManifoldProbabilitiesCacheInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ManifoldProbabilitiesCacheSelectorUniqueInput>;
};

export type SingleManifoldProbabilitiesCacheOutput = {
  __typename?: 'SingleManifoldProbabilitiesCacheOutput';
  result: Maybe<ManifoldProbabilitiesCache>;
};

export type SingleMessageInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<MessageSelectorUniqueInput>;
};

export type SingleMessageOutput = {
  __typename?: 'SingleMessageOutput';
  result: Maybe<Message>;
};

export type SingleMigrationInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<MigrationSelectorUniqueInput>;
};

export type SingleMigrationOutput = {
  __typename?: 'SingleMigrationOutput';
  result: Maybe<Migration>;
};

export type SingleModerationTemplateInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ModerationTemplateSelectorUniqueInput>;
};

export type SingleModerationTemplateOutput = {
  __typename?: 'SingleModerationTemplateOutput';
  result: Maybe<ModerationTemplate>;
};

export type SingleModeratorActionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ModeratorActionSelectorUniqueInput>;
};

export type SingleModeratorActionOutput = {
  __typename?: 'SingleModeratorActionOutput';
  result: Maybe<ModeratorAction>;
};

export type SingleMultiDocumentInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<MultiDocumentSelectorUniqueInput>;
};

export type SingleMultiDocumentOutput = {
  __typename?: 'SingleMultiDocumentOutput';
  result: Maybe<MultiDocument>;
};

export type SingleNotificationInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<NotificationSelectorUniqueInput>;
};

export type SingleNotificationOutput = {
  __typename?: 'SingleNotificationOutput';
  result: Maybe<Notification>;
};

export type SinglePageCacheEntryInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PageCacheEntrySelectorUniqueInput>;
};

export type SinglePageCacheEntryOutput = {
  __typename?: 'SinglePageCacheEntryOutput';
  result: Maybe<PageCacheEntry>;
};

export type SinglePetrovDayActionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PetrovDayActionSelectorUniqueInput>;
};

export type SinglePetrovDayActionOutput = {
  __typename?: 'SinglePetrovDayActionOutput';
  result: Maybe<PetrovDayAction>;
};

export type SinglePetrovDayLaunchInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PetrovDayLaunchSelectorUniqueInput>;
};

export type SinglePetrovDayLaunchOutput = {
  __typename?: 'SinglePetrovDayLaunchOutput';
  result: Maybe<PetrovDayLaunch>;
};

export type SinglePodcastEpisodeInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PodcastEpisodeSelectorUniqueInput>;
};

export type SinglePodcastEpisodeOutput = {
  __typename?: 'SinglePodcastEpisodeOutput';
  result: Maybe<PodcastEpisode>;
};

export type SinglePodcastInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PodcastSelectorUniqueInput>;
};

export type SinglePodcastOutput = {
  __typename?: 'SinglePodcastOutput';
  result: Maybe<Podcast>;
};

export type SinglePostEmbeddingInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PostEmbeddingSelectorUniqueInput>;
};

export type SinglePostEmbeddingOutput = {
  __typename?: 'SinglePostEmbeddingOutput';
  result: Maybe<PostEmbedding>;
};

export type SinglePostInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PostSelectorUniqueInput>;
};

export type SinglePostOutput = {
  __typename?: 'SinglePostOutput';
  result: Maybe<Post>;
};

export type SinglePostRecommendationInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PostRecommendationSelectorUniqueInput>;
};

export type SinglePostRecommendationOutput = {
  __typename?: 'SinglePostRecommendationOutput';
  result: Maybe<PostRecommendation>;
};

export type SinglePostRelationInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PostRelationSelectorUniqueInput>;
};

export type SinglePostRelationOutput = {
  __typename?: 'SinglePostRelationOutput';
  result: Maybe<PostRelation>;
};

export type SinglePostViewTimeInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PostViewTimeSelectorUniqueInput>;
};

export type SinglePostViewTimeOutput = {
  __typename?: 'SinglePostViewTimeOutput';
  result: Maybe<PostViewTime>;
};

export type SinglePostViewsInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<PostViewsSelectorUniqueInput>;
};

export type SinglePostViewsOutput = {
  __typename?: 'SinglePostViewsOutput';
  result: Maybe<PostViews>;
};

export type SingleRssFeedInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<RssFeedSelectorUniqueInput>;
};

export type SingleRssFeedOutput = {
  __typename?: 'SingleRSSFeedOutput';
  result: Maybe<RssFeed>;
};

export type SingleReadStatusInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ReadStatusSelectorUniqueInput>;
};

export type SingleReadStatusOutput = {
  __typename?: 'SingleReadStatusOutput';
  result: Maybe<ReadStatus>;
};

export type SingleRecommendationsCacheInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<RecommendationsCacheSelectorUniqueInput>;
};

export type SingleRecommendationsCacheOutput = {
  __typename?: 'SingleRecommendationsCacheOutput';
  result: Maybe<RecommendationsCache>;
};

export type SingleReportInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ReportSelectorUniqueInput>;
};

export type SingleReportOutput = {
  __typename?: 'SingleReportOutput';
  result: Maybe<Report>;
};

export type SingleReviewVoteInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ReviewVoteSelectorUniqueInput>;
};

export type SingleReviewVoteOutput = {
  __typename?: 'SingleReviewVoteOutput';
  result: Maybe<ReviewVote>;
};

export type SingleReviewWinnerArtInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ReviewWinnerArtSelectorUniqueInput>;
};

export type SingleReviewWinnerArtOutput = {
  __typename?: 'SingleReviewWinnerArtOutput';
  result: Maybe<ReviewWinnerArt>;
};

export type SingleReviewWinnerInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<ReviewWinnerSelectorUniqueInput>;
};

export type SingleReviewWinnerOutput = {
  __typename?: 'SingleReviewWinnerOutput';
  result: Maybe<ReviewWinner>;
};

export type SingleRevisionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<RevisionSelectorUniqueInput>;
};

export type SingleRevisionOutput = {
  __typename?: 'SingleRevisionOutput';
  result: Maybe<Revision>;
};

export type SingleSequenceInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SequenceSelectorUniqueInput>;
};

export type SingleSequenceOutput = {
  __typename?: 'SingleSequenceOutput';
  result: Maybe<Sequence>;
};

export type SingleSessionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SessionSelectorUniqueInput>;
};

export type SingleSessionOutput = {
  __typename?: 'SingleSessionOutput';
  result: Maybe<Session>;
};

export type SingleSideCommentCacheInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SideCommentCacheSelectorUniqueInput>;
};

export type SingleSideCommentCacheOutput = {
  __typename?: 'SingleSideCommentCacheOutput';
  result: Maybe<SideCommentCache>;
};

export type SingleSplashArtCoordinateInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SplashArtCoordinateSelectorUniqueInput>;
};

export type SingleSplashArtCoordinateOutput = {
  __typename?: 'SingleSplashArtCoordinateOutput';
  result: Maybe<SplashArtCoordinate>;
};

export type SingleSpotlightInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SpotlightSelectorUniqueInput>;
};

export type SingleSpotlightOutput = {
  __typename?: 'SingleSpotlightOutput';
  result: Maybe<Spotlight>;
};

export type SingleSubscriptionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SubscriptionSelectorUniqueInput>;
};

export type SingleSubscriptionOutput = {
  __typename?: 'SingleSubscriptionOutput';
  result: Maybe<Subscription>;
};

export type SingleSurveyInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SurveySelectorUniqueInput>;
};

export type SingleSurveyOutput = {
  __typename?: 'SingleSurveyOutput';
  result: Maybe<Survey>;
};

export type SingleSurveyQuestionInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SurveyQuestionSelectorUniqueInput>;
};

export type SingleSurveyQuestionOutput = {
  __typename?: 'SingleSurveyQuestionOutput';
  result: Maybe<SurveyQuestion>;
};

export type SingleSurveyResponseInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SurveyResponseSelectorUniqueInput>;
};

export type SingleSurveyResponseOutput = {
  __typename?: 'SingleSurveyResponseOutput';
  result: Maybe<SurveyResponse>;
};

export type SingleSurveyScheduleInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<SurveyScheduleSelectorUniqueInput>;
};

export type SingleSurveyScheduleOutput = {
  __typename?: 'SingleSurveyScheduleOutput';
  result: Maybe<SurveySchedule>;
};

export type SingleTagFlagInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<TagFlagSelectorUniqueInput>;
};

export type SingleTagFlagOutput = {
  __typename?: 'SingleTagFlagOutput';
  result: Maybe<TagFlag>;
};

export type SingleTagInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<TagSelectorUniqueInput>;
};

export type SingleTagOutput = {
  __typename?: 'SingleTagOutput';
  result: Maybe<Tag>;
};

export type SingleTagRelInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<TagRelSelectorUniqueInput>;
};

export type SingleTagRelOutput = {
  __typename?: 'SingleTagRelOutput';
  result: Maybe<TagRel>;
};

export type SingleTweetInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<TweetSelectorUniqueInput>;
};

export type SingleTweetOutput = {
  __typename?: 'SingleTweetOutput';
  result: Maybe<Tweet>;
};

export type SingleTypingIndicatorInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<TypingIndicatorSelectorUniqueInput>;
};

export type SingleTypingIndicatorOutput = {
  __typename?: 'SingleTypingIndicatorOutput';
  result: Maybe<TypingIndicator>;
};

export type SingleUserActivityInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<UserActivitySelectorUniqueInput>;
};

export type SingleUserActivityOutput = {
  __typename?: 'SingleUserActivityOutput';
  result: Maybe<UserActivity>;
};

export type SingleUserEagDetailInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<UserEagDetailSelectorUniqueInput>;
};

export type SingleUserEagDetailOutput = {
  __typename?: 'SingleUserEAGDetailOutput';
  result: Maybe<UserEagDetail>;
};

export type SingleUserInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<UserSelectorUniqueInput>;
};

export type SingleUserJobAdInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<UserJobAdSelectorUniqueInput>;
};

export type SingleUserJobAdOutput = {
  __typename?: 'SingleUserJobAdOutput';
  result: Maybe<UserJobAd>;
};

export type SingleUserMostValuablePostInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<UserMostValuablePostSelectorUniqueInput>;
};

export type SingleUserMostValuablePostOutput = {
  __typename?: 'SingleUserMostValuablePostOutput';
  result: Maybe<UserMostValuablePost>;
};

export type SingleUserOutput = {
  __typename?: 'SingleUserOutput';
  result: Maybe<User>;
};

export type SingleUserRateLimitInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<UserRateLimitSelectorUniqueInput>;
};

export type SingleUserRateLimitOutput = {
  __typename?: 'SingleUserRateLimitOutput';
  result: Maybe<UserRateLimit>;
};

export type SingleUserTagRelInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<UserTagRelSelectorUniqueInput>;
};

export type SingleUserTagRelOutput = {
  __typename?: 'SingleUserTagRelOutput';
  result: Maybe<UserTagRel>;
};

export type SingleVoteInput = {
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  selector: InputMaybe<VoteSelectorUniqueInput>;
};

export type SingleVoteOutput = {
  __typename?: 'SingleVoteOutput';
  result: Maybe<Vote>;
};

export type Site = {
  __typename?: 'Site';
  logoUrl: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

export type SocialPreviewType = {
  __typename?: 'SocialPreviewType';
  _id: Maybe<Scalars['String']['output']>;
  imageId: Maybe<Scalars['String']['output']>;
  imageUrl: Maybe<Scalars['String']['output']>;
  text: Maybe<Scalars['String']['output']>;
};

export type SplashArtCoordinate = {
  __typename?: 'SplashArtCoordinate';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  leftFlipped: Maybe<Scalars['Boolean']['output']>;
  leftHeightPct: Maybe<Scalars['Float']['output']>;
  leftWidthPct: Maybe<Scalars['Float']['output']>;
  leftXPct: Maybe<Scalars['Float']['output']>;
  leftYPct: Maybe<Scalars['Float']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  middleFlipped: Maybe<Scalars['Boolean']['output']>;
  middleHeightPct: Maybe<Scalars['Float']['output']>;
  middleWidthPct: Maybe<Scalars['Float']['output']>;
  middleXPct: Maybe<Scalars['Float']['output']>;
  middleYPct: Maybe<Scalars['Float']['output']>;
  reviewWinnerArt: ReviewWinnerArt;
  reviewWinnerArtId: Maybe<Scalars['String']['output']>;
  rightFlipped: Maybe<Scalars['Boolean']['output']>;
  rightHeightPct: Maybe<Scalars['Float']['output']>;
  rightWidthPct: Maybe<Scalars['Float']['output']>;
  rightXPct: Maybe<Scalars['Float']['output']>;
  rightYPct: Maybe<Scalars['Float']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum SplashArtCoordinateOrderByInput {
  Foobar = 'foobar'
}

export type SplashArtCoordinateOutput = {
  __typename?: 'SplashArtCoordinateOutput';
  data: Maybe<SplashArtCoordinate>;
};

export type SplashArtCoordinateSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SplashArtCoordinateSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SplashArtCoordinateSelectorInput>>>;
};

export type SplashArtCoordinateSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Spotlight = {
  __typename?: 'Spotlight';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  customSubtitle: Maybe<Scalars['String']['output']>;
  customTitle: Maybe<Scalars['String']['output']>;
  deletedDraft: Maybe<Scalars['Boolean']['output']>;
  description: Maybe<Revision>;
  description_latest: Maybe<Scalars['String']['output']>;
  document: Post;
  documentId: Maybe<Scalars['String']['output']>;
  documentType: Maybe<Scalars['String']['output']>;
  draft: Maybe<Scalars['Boolean']['output']>;
  duration: Maybe<Scalars['Float']['output']>;
  headerTitle: Maybe<Scalars['String']['output']>;
  headerTitleLeftColor: Maybe<Scalars['String']['output']>;
  headerTitleRightColor: Maybe<Scalars['String']['output']>;
  imageFade: Maybe<Scalars['Boolean']['output']>;
  imageFadeColor: Maybe<Scalars['String']['output']>;
  lastPromotedAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  position: Maybe<Scalars['Float']['output']>;
  post: Maybe<Post>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  sequence: Maybe<Sequence>;
  sequenceChapters: Maybe<Array<Maybe<Chapter>>>;
  showAuthor: Maybe<Scalars['Boolean']['output']>;
  spotlightDarkImageId: Maybe<Scalars['String']['output']>;
  spotlightImageId: Maybe<Scalars['String']['output']>;
  spotlightSplashImageUrl: Maybe<Scalars['String']['output']>;
  subtitleUrl: Maybe<Scalars['String']['output']>;
  tag: Maybe<Tag>;
};


export type SpotlightDescriptionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum SpotlightOrderByInput {
  Foobar = 'foobar'
}

export type SpotlightOutput = {
  __typename?: 'SpotlightOutput';
  data: Maybe<Spotlight>;
};

export type SpotlightSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SpotlightSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SpotlightSelectorInput>>>;
};

export type SpotlightSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type SubforumMagicFeedEntryType = {
  __typename?: 'SubforumMagicFeedEntryType';
  tagSubforumComments: Maybe<Comment>;
  tagSubforumPosts: Maybe<Post>;
  tagSubforumStickyComments: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumMagicFeedQueryResults = {
  __typename?: 'SubforumMagicFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumMagicFeedEntryType>>;
};

export type SubforumNewFeedEntryType = {
  __typename?: 'SubforumNewFeedEntryType';
  tagSubforumComments: Maybe<Comment>;
  tagSubforumPosts: Maybe<Post>;
  tagSubforumStickyComments: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumNewFeedQueryResults = {
  __typename?: 'SubforumNewFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumNewFeedEntryType>>;
};

export type SubforumOldFeedEntryType = {
  __typename?: 'SubforumOldFeedEntryType';
  tagSubforumComments: Maybe<Comment>;
  tagSubforumPosts: Maybe<Post>;
  tagSubforumStickyComments: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumOldFeedQueryResults = {
  __typename?: 'SubforumOldFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumOldFeedEntryType>>;
};

export type SubforumRecentCommentsFeedEntryType = {
  __typename?: 'SubforumRecentCommentsFeedEntryType';
  tagSubforumComments: Maybe<Comment>;
  tagSubforumPosts: Maybe<Post>;
  tagSubforumStickyComments: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumRecentCommentsFeedQueryResults = {
  __typename?: 'SubforumRecentCommentsFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumRecentCommentsFeedEntryType>>;
};

export type SubforumTopFeedEntryType = {
  __typename?: 'SubforumTopFeedEntryType';
  tagSubforumComments: Maybe<Comment>;
  tagSubforumPosts: Maybe<Post>;
  tagSubforumStickyComments: Maybe<Comment>;
  type: Scalars['String']['output'];
};

export type SubforumTopFeedQueryResults = {
  __typename?: 'SubforumTopFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumTopFeedEntryType>>;
};

export type SubscribedFeedEntryType = {
  __typename?: 'SubscribedFeedEntryType';
  postCommented: Maybe<SubscribedPostAndComments>;
  type: Scalars['String']['output'];
};

export type SubscribedFeedQueryResults = {
  __typename?: 'SubscribedFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubscribedFeedEntryType>>;
};

export type SubscribedPostAndComments = {
  __typename?: 'SubscribedPostAndComments';
  _id: Scalars['String']['output'];
  comments: Maybe<Array<Comment>>;
  expandCommentIds: Maybe<Array<Scalars['String']['output']>>;
  post: Post;
  postIsFromSubscribedUser: Scalars['Boolean']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  _id: Scalars['String']['output'];
  collectionName: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  state: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
  user: User;
  userId: Maybe<Scalars['String']['output']>;
};

export enum SubscriptionOrderByInput {
  Foobar = 'foobar'
}

export type SubscriptionOutput = {
  __typename?: 'SubscriptionOutput';
  data: Maybe<Subscription>;
};

export type SubscriptionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SubscriptionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SubscriptionSelectorInput>>>;
};

export type SubscriptionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type SuggestedFeedSubscriptionUsersResult = {
  __typename?: 'SuggestedFeedSubscriptionUsersResult';
  results: Array<User>;
};

export type Survey = {
  __typename?: 'Survey';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  name: Maybe<Scalars['String']['output']>;
  questions: Array<SurveyQuestion>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum SurveyOrderByInput {
  Foobar = 'foobar'
}

export type SurveyOutput = {
  __typename?: 'SurveyOutput';
  data: Maybe<Survey>;
};

export type SurveyQuestion = {
  __typename?: 'SurveyQuestion';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  format: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  order: Maybe<Scalars['Float']['output']>;
  question: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  survey: Survey;
  surveyId: Maybe<Scalars['String']['output']>;
};

export type SurveyQuestionInfo = {
  _id: InputMaybe<Scalars['String']['input']>;
  format: Scalars['String']['input'];
  question: Scalars['String']['input'];
};

export enum SurveyQuestionOrderByInput {
  Foobar = 'foobar'
}

export type SurveyQuestionOutput = {
  __typename?: 'SurveyQuestionOutput';
  data: Maybe<SurveyQuestion>;
};

export type SurveyQuestionSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SurveyQuestionSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SurveyQuestionSelectorInput>>>;
};

export type SurveyQuestionSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type SurveyResponse = {
  __typename?: 'SurveyResponse';
  _id: Scalars['String']['output'];
  client: Maybe<ClientId>;
  clientId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  response: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  survey: Survey;
  surveyId: Maybe<Scalars['String']['output']>;
  surveySchedule: Maybe<SurveySchedule>;
  surveyScheduleId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum SurveyResponseOrderByInput {
  Foobar = 'foobar'
}

export type SurveyResponseOutput = {
  __typename?: 'SurveyResponseOutput';
  data: Maybe<SurveyResponse>;
};

export type SurveyResponseSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SurveyResponseSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SurveyResponseSelectorInput>>>;
};

export type SurveyResponseSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type SurveySchedule = {
  __typename?: 'SurveySchedule';
  _id: Scalars['String']['output'];
  clientIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  clients: Array<ClientId>;
  createdAt: Maybe<Scalars['Date']['output']>;
  deactivated: Maybe<Scalars['Boolean']['output']>;
  endDate: Maybe<Scalars['Date']['output']>;
  impressionsLimit: Maybe<Scalars['Float']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  maxKarma: Maybe<Scalars['Float']['output']>;
  maxVisitorPercentage: Maybe<Scalars['Float']['output']>;
  minKarma: Maybe<Scalars['Float']['output']>;
  name: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  startDate: Maybe<Scalars['Date']['output']>;
  survey: Survey;
  surveyId: Maybe<Scalars['String']['output']>;
  target: Maybe<Scalars['String']['output']>;
};

export enum SurveyScheduleOrderByInput {
  Foobar = 'foobar'
}

export type SurveyScheduleOutput = {
  __typename?: 'SurveyScheduleOutput';
  data: Maybe<SurveySchedule>;
};

export type SurveyScheduleSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SurveyScheduleSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SurveyScheduleSelectorInput>>>;
};

export type SurveyScheduleSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type SurveySelectorInput = {
  AND: InputMaybe<Array<InputMaybe<SurveySelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<SurveySelectorInput>>>;
};

export type SurveySelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type Tag = {
  __typename?: 'Tag';
  _id: Scalars['String']['output'];
  adminOnly: Maybe<Scalars['Boolean']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
  arbitalLinkedPages: Maybe<ArbitalLinkedPages>;
  autoTagModel: Maybe<Scalars['String']['output']>;
  autoTagPrompt: Maybe<Scalars['String']['output']>;
  bannerImageId: Maybe<Scalars['String']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  canEditUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  canVoteOnRels: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  charsAdded: Maybe<Scalars['Float']['output']>;
  charsRemoved: Maybe<Scalars['Float']['output']>;
  contributionStats: Maybe<Scalars['JSON']['output']>;
  contributors: Maybe<TagContributorsList>;
  core: Maybe<Scalars['Boolean']['output']>;
  coreTagId: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  defaultOrder: Maybe<Scalars['Float']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  description: Maybe<Revision>;
  descriptionTruncationCount: Maybe<Scalars['Float']['output']>;
  description_latest: Maybe<Scalars['String']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  forceAllowType3Audio: Maybe<Scalars['Boolean']['output']>;
  htmlWithContributorAnnotations: Maybe<Scalars['String']['output']>;
  introSequenceId: Maybe<Scalars['String']['output']>;
  isArbitalImport: Maybe<Scalars['Boolean']['output']>;
  isPlaceholderPage: Maybe<Scalars['Boolean']['output']>;
  isPostType: Maybe<Scalars['Boolean']['output']>;
  isRead: Maybe<Scalars['Boolean']['output']>;
  isSubforum: Maybe<Scalars['Boolean']['output']>;
  lastCommentedAt: Maybe<Scalars['Date']['output']>;
  lastSubforumCommentAt: Maybe<Scalars['Date']['output']>;
  lastVisitedAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  lenses: Array<MultiDocument>;
  lensesIncludingDeleted: Array<MultiDocument>;
  lesswrongWikiImportCompleted: Maybe<Scalars['Boolean']['output']>;
  lesswrongWikiImportRevision: Maybe<Scalars['String']['output']>;
  lesswrongWikiImportSlug: Maybe<Scalars['String']['output']>;
  maxScore: Maybe<Scalars['Int']['output']>;
  moderationGuidelines: Maybe<Revision>;
  moderationGuidelines_latest: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  needsReview: Maybe<Scalars['Boolean']['output']>;
  noindex: Maybe<Scalars['Boolean']['output']>;
  oldSlugs: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  parentTag: Maybe<Tag>;
  parentTagId: Maybe<Scalars['String']['output']>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  postCount: Maybe<Scalars['Float']['output']>;
  postsDefaultSortOrder: Maybe<Scalars['String']['output']>;
  recentComments: Maybe<Array<Maybe<Comment>>>;
  reviewedByUser: Maybe<User>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  sequence: Maybe<Sequence>;
  shortName: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  squareImageId: Maybe<Scalars['String']['output']>;
  subTagIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  subTags: Array<Tag>;
  subforumIntroPost: Maybe<Post>;
  subforumIntroPostId: Maybe<Scalars['String']['output']>;
  subforumModeratorIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  subforumModerators: Array<User>;
  subforumUnreadMessagesCount: Maybe<Scalars['Int']['output']>;
  subforumWelcomeText: Maybe<Revision>;
  subforumWelcomeText_latest: Maybe<Scalars['String']['output']>;
  subtitle: Maybe<Scalars['String']['output']>;
  suggestedAsFilter: Maybe<Scalars['Boolean']['output']>;
  summaries: Array<MultiDocument>;
  tableOfContents: Maybe<Scalars['JSON']['output']>;
  tagFlags: Array<TagFlag>;
  tagFlagsIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  textLastUpdatedAt: Maybe<Scalars['Date']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
  usersWhoLiked: Array<UserLikingTag>;
  voteCount: Maybe<Scalars['Float']['output']>;
  wikiGrade: Maybe<Scalars['Int']['output']>;
  wikiOnly: Maybe<Scalars['Boolean']['output']>;
};


export type TagContributorsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagDescriptionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagLensesArgs = {
  lensSlug: InputMaybe<Scalars['String']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagLensesIncludingDeletedArgs = {
  lensSlug: InputMaybe<Scalars['String']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagModerationGuidelinesArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagRecentCommentsArgs = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  maxAgeHours: InputMaybe<Scalars['Int']['input']>;
  tagCommentType: InputMaybe<Scalars['String']['input']>;
  tagCommentsLimit: InputMaybe<Scalars['Int']['input']>;
};


export type TagSubforumWelcomeTextArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagTableOfContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type TagContributor = {
  __typename?: 'TagContributor';
  contributionScore: Scalars['Int']['output'];
  currentAttributionCharCount: Maybe<Scalars['Int']['output']>;
  numCommits: Scalars['Int']['output'];
  user: Maybe<User>;
  voteCount: Scalars['Int']['output'];
};

export type TagContributorsList = {
  __typename?: 'TagContributorsList';
  contributors: Maybe<Array<TagContributor>>;
  totalCount: Scalars['Int']['output'];
};

export type TagFlag = {
  __typename?: 'TagFlag';
  _id: Scalars['String']['output'];
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  name: Maybe<Scalars['String']['output']>;
  order: Maybe<Scalars['Float']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  slug: Maybe<Scalars['String']['output']>;
};


export type TagFlagContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export enum TagFlagOrderByInput {
  Foobar = 'foobar'
}

export type TagFlagOutput = {
  __typename?: 'TagFlagOutput';
  data: Maybe<TagFlag>;
};

export type TagFlagSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<TagFlagSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<TagFlagSelectorInput>>>;
};

export type TagFlagSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type TagHistoryFeedEntryType = {
  __typename?: 'TagHistoryFeedEntryType';
  lensOrSummaryMetadataChanged: Maybe<FieldChange>;
  lensRevision: Maybe<Revision>;
  summaryRevision: Maybe<Revision>;
  tagApplied: Maybe<TagRel>;
  tagCreated: Maybe<Tag>;
  tagDiscussionComment: Maybe<Comment>;
  tagRevision: Maybe<Revision>;
  type: Scalars['String']['output'];
  wikiMetadataChanged: Maybe<FieldChange>;
};

export type TagHistoryFeedQueryResults = {
  __typename?: 'TagHistoryFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<TagHistoryFeedEntryType>>;
};

export enum TagOrderByInput {
  Foobar = 'foobar'
}

export type TagOutput = {
  __typename?: 'TagOutput';
  data: Maybe<Tag>;
};

export type TagPreviewWithSummaries = {
  __typename?: 'TagPreviewWithSummaries';
  lens: Maybe<MultiDocument>;
  summaries: Array<MultiDocument>;
  tag: Tag;
};

export type TagReadLikelihoodRatio = {
  __typename?: 'TagReadLikelihoodRatio';
  readLikelihoodRatio: Maybe<Scalars['Float']['output']>;
  tagId: Maybe<Scalars['String']['output']>;
  tagName: Maybe<Scalars['String']['output']>;
  tagShortName: Maybe<Scalars['String']['output']>;
  userReadCount: Maybe<Scalars['Int']['output']>;
};

export type TagRel = {
  __typename?: 'TagRel';
  _id: Scalars['String']['output'];
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
  autoApplied: Scalars['Boolean']['output'];
  backfilled: Maybe<Scalars['Boolean']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  currentUserCanVote: Scalars['Boolean']['output'];
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  post: Maybe<Post>;
  postId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  tag: Maybe<Tag>;
  tagId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
};

export enum TagRelOrderByInput {
  Foobar = 'foobar'
}

export type TagRelOutput = {
  __typename?: 'TagRelOutput';
  data: Maybe<TagRel>;
};

export type TagRelSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<TagRelSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<TagRelSelectorInput>>>;
};

export type TagRelSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type TagSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<TagSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<TagSelectorInput>>>;
};

export type TagSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type TagUpdates = {
  __typename?: 'TagUpdates';
  added: Maybe<Scalars['Int']['output']>;
  commentCount: Maybe<Scalars['Int']['output']>;
  commentIds: Maybe<Array<Scalars['String']['output']>>;
  documentDeletions: Maybe<Array<DocumentDeletion>>;
  lastCommentedAt: Maybe<Scalars['Date']['output']>;
  lastRevisedAt: Maybe<Scalars['Date']['output']>;
  removed: Maybe<Scalars['Int']['output']>;
  revisionIds: Maybe<Array<Scalars['String']['output']>>;
  tag: Tag;
  users: Maybe<Array<User>>;
};

export type TagWithTotalCount = {
  __typename?: 'TagWithTotalCount';
  tags: Array<Tag>;
  totalCount: Scalars['Int']['output'];
};

export type TopComment = {
  __typename?: 'TopComment';
  _id: Maybe<Scalars['String']['output']>;
  baseScore: Maybe<Scalars['Int']['output']>;
  contents: Maybe<TopCommentContents>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  postSlug: Maybe<Scalars['String']['output']>;
  postTitle: Maybe<Scalars['String']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
};

export type TopCommentContents = {
  __typename?: 'TopCommentContents';
  html: Maybe<Scalars['String']['output']>;
};

export type TopCommentedTagUser = {
  __typename?: 'TopCommentedTagUser';
  _id: Scalars['ID']['output'];
  displayName: Scalars['String']['output'];
  tag_comment_counts: Array<CommentCountTag>;
  total_power: Scalars['Float']['output'];
  username: Scalars['String']['output'];
};

export type Tweet = {
  __typename?: 'Tweet';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum TweetOrderByInput {
  Foobar = 'foobar'
}

export type TweetOutput = {
  __typename?: 'TweetOutput';
  data: Maybe<Tweet>;
};

export type TweetSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<TweetSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<TweetSelectorInput>>>;
};

export type TweetSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type TypingIndicator = {
  __typename?: 'TypingIndicator';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum TypingIndicatorOrderByInput {
  Foobar = 'foobar'
}

export type TypingIndicatorOutput = {
  __typename?: 'TypingIndicatorOutput';
  data: Maybe<TypingIndicator>;
};

export type TypingIndicatorSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<TypingIndicatorSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<TypingIndicatorSelectorInput>>>;
};

export type TypingIndicatorSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type UniqueClientViewsSeries = {
  __typename?: 'UniqueClientViewsSeries';
  date: Maybe<Scalars['Date']['output']>;
  uniqueClientViews: Maybe<Scalars['Int']['output']>;
};

export type UpdateAdvisorRequestDataInput = {
  interestedInMetaculus: InputMaybe<Scalars['Boolean']['input']>;
  jobAds: InputMaybe<Scalars['JSON']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAdvisorRequestInput = {
  data: UpdateAdvisorRequestDataInput;
  selector: AdvisorRequestSelectorUniqueInput;
};

export type UpdateArbitalCachesDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateArbitalCachesInput = {
  data: UpdateArbitalCachesDataInput;
  selector: ArbitalCachesSelectorUniqueInput;
};

export type UpdateArbitalTagContentRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateArbitalTagContentRelInput = {
  data: UpdateArbitalTagContentRelDataInput;
  selector: ArbitalTagContentRelSelectorUniqueInput;
};

export type UpdateBanDataInput = {
  comment: InputMaybe<Scalars['String']['input']>;
  expirationDate: InputMaybe<Scalars['Date']['input']>;
  ip: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  properties: InputMaybe<Scalars['JSON']['input']>;
  reason: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBanInput = {
  data: UpdateBanDataInput;
  selector: BanSelectorUniqueInput;
};

export type UpdateBookDataInput = {
  collectionId: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  displaySequencesAsGrid: InputMaybe<Scalars['Boolean']['input']>;
  hideProgressBar: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  number: InputMaybe<Scalars['Float']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sequenceIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  showChapters: InputMaybe<Scalars['Boolean']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  tocTitle: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBookInput = {
  data: UpdateBookDataInput;
  selector: BookSelectorUniqueInput;
};

export type UpdateChapterDataInput = {
  contents: InputMaybe<Scalars['JSON']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  number: InputMaybe<Scalars['Float']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sequenceId: InputMaybe<Scalars['String']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type UpdateChapterInput = {
  data: UpdateChapterDataInput;
  selector: ChapterSelectorUniqueInput;
};

export type UpdateCkEditorUserSessionDataInput = {
  documentId: InputMaybe<Scalars['String']['input']>;
  endedAt: InputMaybe<Scalars['Date']['input']>;
  endedBy: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCkEditorUserSessionInput = {
  data: UpdateCkEditorUserSessionDataInput;
  selector: CkEditorUserSessionSelectorUniqueInput;
};

export type UpdateClientIdDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateClientIdInput = {
  data: UpdateClientIdDataInput;
  selector: ClientIdSelectorUniqueInput;
};

export type UpdateCollectionDataInput = {
  contents: InputMaybe<Scalars['JSON']['input']>;
  createdAt: InputMaybe<Scalars['Date']['input']>;
  firstPageLink: InputMaybe<Scalars['String']['input']>;
  gridImageId: InputMaybe<Scalars['String']['input']>;
  hideStartReadingButton: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCollectionInput = {
  data: UpdateCollectionDataInput;
  selector: CollectionSelectorUniqueInput;
};

export type UpdateCommentDataInput = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  afDate: InputMaybe<Scalars['Date']['input']>;
  agentFoundationsId: InputMaybe<Scalars['String']['input']>;
  answer: InputMaybe<Scalars['Boolean']['input']>;
  authorIsUnreviewed: InputMaybe<Scalars['Boolean']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  debateResponse: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  deletedByUserId: InputMaybe<Scalars['String']['input']>;
  deletedDate: InputMaybe<Scalars['Date']['input']>;
  deletedPublic: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason: InputMaybe<Scalars['String']['input']>;
  hideAuthor: InputMaybe<Scalars['Boolean']['input']>;
  hideKarma: InputMaybe<Scalars['Boolean']['input']>;
  hideModeratorHat: InputMaybe<Scalars['Boolean']['input']>;
  isPinnedOnProfile: InputMaybe<Scalars['Boolean']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  legacyParentId: InputMaybe<Scalars['String']['input']>;
  legacyPoll: InputMaybe<Scalars['Boolean']['input']>;
  modGPTAnalysis: InputMaybe<Scalars['String']['input']>;
  modGPTRecommendation: InputMaybe<Scalars['String']['input']>;
  moderatorHat: InputMaybe<Scalars['Boolean']['input']>;
  moveToAlignmentUserId: InputMaybe<Scalars['String']['input']>;
  needsReview: InputMaybe<Scalars['Boolean']['input']>;
  nominatedForReview: InputMaybe<Scalars['String']['input']>;
  originalDialogueId: InputMaybe<Scalars['String']['input']>;
  promoted: InputMaybe<Scalars['Boolean']['input']>;
  promotedByUserId: InputMaybe<Scalars['String']['input']>;
  rejected: InputMaybe<Scalars['Boolean']['input']>;
  rejectedByUserId: InputMaybe<Scalars['String']['input']>;
  rejectedReason: InputMaybe<Scalars['String']['input']>;
  relevantTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  repliesBlockedUntil: InputMaybe<Scalars['Date']['input']>;
  retracted: InputMaybe<Scalars['Boolean']['input']>;
  reviewForAlignmentUserId: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  reviewingForReview: InputMaybe<Scalars['String']['input']>;
  shortform: InputMaybe<Scalars['Boolean']['input']>;
  shortformFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  spam: InputMaybe<Scalars['Boolean']['input']>;
  subforumStickyPriority: InputMaybe<Scalars['Float']['input']>;
  suggestForAlignmentUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCommentInput = {
  data: UpdateCommentDataInput;
  selector: CommentSelectorUniqueInput;
};

export type UpdateCommentModeratorActionDataInput = {
  commentId: InputMaybe<Scalars['String']['input']>;
  endedAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCommentModeratorActionInput = {
  data: UpdateCommentModeratorActionDataInput;
  selector: CommentModeratorActionSelectorUniqueInput;
};

export type UpdateConversationDataInput = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  archivedByIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  moderator: InputMaybe<Scalars['Boolean']['input']>;
  participantIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type UpdateConversationInput = {
  data: UpdateConversationDataInput;
  selector: ConversationSelectorUniqueInput;
};

export type UpdateCronHistoryDataInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  finishedAt: InputMaybe<Scalars['Date']['input']>;
  intendedAt: InputMaybe<Scalars['Date']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  result: InputMaybe<Scalars['JSON']['input']>;
  startedAt: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateCronHistoryInput = {
  data: UpdateCronHistoryDataInput;
  selector: CronHistorySelectorUniqueInput;
};

export type UpdateCurationEmailDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCurationEmailInput = {
  data: UpdateCurationEmailDataInput;
  selector: CurationEmailSelectorUniqueInput;
};

export type UpdateCurationNoticeDataInput = {
  commentId: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateCurationNoticeInput = {
  data: UpdateCurationNoticeDataInput;
  selector: CurationNoticeSelectorUniqueInput;
};

export type UpdateDatabaseMetadataDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateDatabaseMetadataInput = {
  data: UpdateDatabaseMetadataDataInput;
  selector: DatabaseMetadataSelectorUniqueInput;
};

export type UpdateDebouncerEventsDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateDebouncerEventsInput = {
  data: UpdateDebouncerEventsDataInput;
  selector: DebouncerEventsSelectorUniqueInput;
};

export type UpdateDialogueCheckDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateDialogueCheckInput = {
  data: UpdateDialogueCheckDataInput;
  selector: DialogueCheckSelectorUniqueInput;
};

export type UpdateDialogueMatchPreferenceDataInput = {
  asyncPreference: InputMaybe<Scalars['String']['input']>;
  calendlyLink: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  dialogueCheckId: InputMaybe<Scalars['String']['input']>;
  formatNotes: InputMaybe<Scalars['String']['input']>;
  generatedDialogueId: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  syncPreference: InputMaybe<Scalars['String']['input']>;
  topicNotes: InputMaybe<Scalars['String']['input']>;
  topicPreferences: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
};

export type UpdateDialogueMatchPreferenceInput = {
  data: UpdateDialogueMatchPreferenceDataInput;
  selector: DialogueMatchPreferenceSelectorUniqueInput;
};

export type UpdateDigestDataInput = {
  endDate: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  num: InputMaybe<Scalars['Float']['input']>;
  onsiteImageId: InputMaybe<Scalars['String']['input']>;
  onsitePrimaryColor: InputMaybe<Scalars['String']['input']>;
  publishedDate: InputMaybe<Scalars['Date']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateDigestInput = {
  data: UpdateDigestDataInput;
  selector: DigestSelectorUniqueInput;
};

export type UpdateDigestPostDataInput = {
  digestId: InputMaybe<Scalars['String']['input']>;
  emailDigestStatus: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  onsiteDigestStatus: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDigestPostInput = {
  data: UpdateDigestPostDataInput;
  selector: DigestPostSelectorUniqueInput;
};

export type UpdateElectionCandidateDataInput = {
  amountRaised: InputMaybe<Scalars['Float']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  electionName: InputMaybe<Scalars['String']['input']>;
  fundraiserLink: InputMaybe<Scalars['String']['input']>;
  gwwcId: InputMaybe<Scalars['String']['input']>;
  gwwcLink: InputMaybe<Scalars['String']['input']>;
  href: InputMaybe<Scalars['String']['input']>;
  isElectionFundraiser: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  logoSrc: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  tagId: InputMaybe<Scalars['String']['input']>;
  targetAmount: InputMaybe<Scalars['Float']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateElectionCandidateInput = {
  data: UpdateElectionCandidateDataInput;
  selector: ElectionCandidateSelectorUniqueInput;
};

export type UpdateElectionVoteDataInput = {
  compareState: InputMaybe<Scalars['JSON']['input']>;
  electionName: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  submissionComments: InputMaybe<Scalars['JSON']['input']>;
  submittedAt: InputMaybe<Scalars['Date']['input']>;
  userExplanation: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  userOtherComments: InputMaybe<Scalars['String']['input']>;
  vote: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateElectionVoteInput = {
  data: UpdateElectionVoteDataInput;
  selector: ElectionVoteSelectorUniqueInput;
};

export type UpdateElicitQuestionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  resolution: InputMaybe<Scalars['String']['input']>;
  resolvesBy: InputMaybe<Scalars['Date']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type UpdateElicitQuestionInput = {
  data: UpdateElicitQuestionDataInput;
  selector: ElicitQuestionSelectorUniqueInput;
};

export type UpdateElicitQuestionPredictionDataInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  binaryQuestionId: InputMaybe<Scalars['String']['input']>;
  createdAt: InputMaybe<Scalars['Date']['input']>;
  creator: InputMaybe<Scalars['JSON']['input']>;
  isDeleted: InputMaybe<Scalars['Boolean']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  prediction: InputMaybe<Scalars['Float']['input']>;
  sourceId: InputMaybe<Scalars['String']['input']>;
  sourceUrl: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateElicitQuestionPredictionInput = {
  data: UpdateElicitQuestionPredictionDataInput;
  selector: ElicitQuestionPredictionSelectorUniqueInput;
};

export type UpdateEmailTokensDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateEmailTokensInput = {
  data: UpdateEmailTokensDataInput;
  selector: EmailTokensSelectorUniqueInput;
};

export type UpdateFeaturedResourceDataInput = {
  body: InputMaybe<Scalars['String']['input']>;
  ctaText: InputMaybe<Scalars['String']['input']>;
  ctaUrl: InputMaybe<Scalars['String']['input']>;
  expiresAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type UpdateFeaturedResourceInput = {
  data: UpdateFeaturedResourceDataInput;
  selector: FeaturedResourceSelectorUniqueInput;
};

export type UpdateFieldChangeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateFieldChangeInput = {
  data: UpdateFieldChangeDataInput;
  selector: FieldChangeSelectorUniqueInput;
};

export type UpdateForumEventDataInput = {
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  bannerTextColor: InputMaybe<Scalars['String']['input']>;
  commentPrompt: InputMaybe<Scalars['String']['input']>;
  contrastColor: InputMaybe<Scalars['String']['input']>;
  customComponent: InputMaybe<Scalars['String']['input']>;
  darkColor: InputMaybe<Scalars['String']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
  eventFormat: InputMaybe<Scalars['String']['input']>;
  frontpageDescription: InputMaybe<Scalars['JSON']['input']>;
  frontpageDescriptionMobile: InputMaybe<Scalars['JSON']['input']>;
  includesPoll: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  lightColor: InputMaybe<Scalars['String']['input']>;
  maxStickersPerUser: InputMaybe<Scalars['Float']['input']>;
  pollAgreeWording: InputMaybe<Scalars['String']['input']>;
  pollDisagreeWording: InputMaybe<Scalars['String']['input']>;
  pollQuestion: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  postPageDescription: InputMaybe<Scalars['JSON']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  tagId: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type UpdateForumEventInput = {
  data: UpdateForumEventDataInput;
  selector: ForumEventSelectorUniqueInput;
};

export type UpdateGardenCodeDataInput = {
  afOnly: InputMaybe<Scalars['Boolean']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  endTime: InputMaybe<Scalars['Date']['input']>;
  fbLink: InputMaybe<Scalars['String']['input']>;
  hidden: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  startTime: InputMaybe<Scalars['Date']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type UpdateGardenCodeInput = {
  data: UpdateGardenCodeDataInput;
  selector: GardenCodeSelectorUniqueInput;
};

export type UpdateGoogleServiceAccountSessionDataInput = {
  active: InputMaybe<Scalars['Boolean']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  estimatedExpiry: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  refreshToken: InputMaybe<Scalars['String']['input']>;
  revoked: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateGoogleServiceAccountSessionInput = {
  data: UpdateGoogleServiceAccountSessionDataInput;
  selector: GoogleServiceAccountSessionSelectorUniqueInput;
};

export type UpdateImagesDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateImagesInput = {
  data: UpdateImagesDataInput;
  selector: ImagesSelectorUniqueInput;
};

export type UpdateJargonTermDataInput = {
  altTerms: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  approved: InputMaybe<Scalars['Boolean']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  term: InputMaybe<Scalars['String']['input']>;
};

export type UpdateJargonTermInput = {
  data: UpdateJargonTermDataInput;
  selector: JargonTermSelectorUniqueInput;
};

export type UpdateLwEventDataInput = {
  important: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateLwEventInput = {
  data: UpdateLwEventDataInput;
  selector: LwEventSelectorUniqueInput;
};

export type UpdateLegacyDataDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateLegacyDataInput = {
  data: UpdateLegacyDataDataInput;
  selector: LegacyDataSelectorUniqueInput;
};

export type UpdateLlmConversationDataInput = {
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  model: InputMaybe<Scalars['String']['input']>;
  systemPrompt: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLlmConversationInput = {
  data: UpdateLlmConversationDataInput;
  selector: LlmConversationSelectorUniqueInput;
};

export type UpdateLlmMessageDataInput = {
  content: InputMaybe<Scalars['String']['input']>;
  conversationId: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  role: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLlmMessageInput = {
  data: UpdateLlmMessageDataInput;
  selector: LlmMessageSelectorUniqueInput;
};

export type UpdateLocalgroupDataInput = {
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contactInfo: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  facebookLink: InputMaybe<Scalars['String']['input']>;
  facebookPageLink: InputMaybe<Scalars['String']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  inactive: InputMaybe<Scalars['Boolean']['input']>;
  isOnline: InputMaybe<Scalars['Boolean']['input']>;
  lastActivity: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  meetupLink: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  nameInAnotherLanguage: InputMaybe<Scalars['String']['input']>;
  organizerIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  slackLink: InputMaybe<Scalars['String']['input']>;
  types: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  website: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLocalgroupInput = {
  data: UpdateLocalgroupDataInput;
  selector: LocalgroupSelectorUniqueInput;
};

export type UpdateManifoldProbabilitiesCacheDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateManifoldProbabilitiesCacheInput = {
  data: UpdateManifoldProbabilitiesCacheDataInput;
  selector: ManifoldProbabilitiesCacheSelectorUniqueInput;
};

export type UpdateMessageDataInput = {
  contents: InputMaybe<Scalars['JSON']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateMessageInput = {
  data: UpdateMessageDataInput;
  selector: MessageSelectorUniqueInput;
};

export type UpdateMigrationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateMigrationInput = {
  data: UpdateMigrationDataInput;
  selector: MigrationSelectorUniqueInput;
};

export type UpdateModerationTemplateDataInput = {
  collectionName: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateModerationTemplateInput = {
  data: UpdateModerationTemplateDataInput;
  selector: ModerationTemplateSelectorUniqueInput;
};

export type UpdateModeratorActionDataInput = {
  endedAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateModeratorActionInput = {
  data: UpdateModeratorActionDataInput;
  selector: ModeratorActionSelectorUniqueInput;
};

export type UpdateMultiDocumentDataInput = {
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  index: InputMaybe<Scalars['Float']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  tabSubtitle: InputMaybe<Scalars['String']['input']>;
  tabTitle: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMultiDocumentInput = {
  data: UpdateMultiDocumentDataInput;
  selector: MultiDocumentSelectorUniqueInput;
};

export type UpdateNotificationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  viewed: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateNotificationInput = {
  data: UpdateNotificationDataInput;
  selector: NotificationSelectorUniqueInput;
};

export type UpdatePageCacheEntryDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePageCacheEntryInput = {
  data: UpdatePageCacheEntryDataInput;
  selector: PageCacheEntrySelectorUniqueInput;
};

export type UpdatePetrovDayActionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePetrovDayActionInput = {
  data: UpdatePetrovDayActionDataInput;
  selector: PetrovDayActionSelectorUniqueInput;
};

export type UpdatePetrovDayLaunchDataInput = {
  hashedLaunchCode: InputMaybe<Scalars['String']['input']>;
  launchCode: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePetrovDayLaunchInput = {
  data: UpdatePetrovDayLaunchDataInput;
  selector: PetrovDayLaunchSelectorUniqueInput;
};

export type UpdatePodcastDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePodcastEpisodeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePodcastEpisodeInput = {
  data: UpdatePodcastEpisodeDataInput;
  selector: PodcastEpisodeSelectorUniqueInput;
};

export type UpdatePodcastInput = {
  data: UpdatePodcastDataInput;
  selector: PodcastSelectorUniqueInput;
};

export type UpdatePostDataInput = {
  activateRSVPs: InputMaybe<Scalars['Boolean']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
  afDate: InputMaybe<Scalars['Date']['input']>;
  afSticky: InputMaybe<Scalars['Boolean']['input']>;
  agentFoundationsId: InputMaybe<Scalars['String']['input']>;
  authorIsUnreviewed: InputMaybe<Scalars['Boolean']['input']>;
  autoFrontpage: InputMaybe<Scalars['String']['input']>;
  bannedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  canonicalBookId: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug: InputMaybe<Scalars['String']['input']>;
  canonicalNextPostSlug: InputMaybe<Scalars['String']['input']>;
  canonicalPrevPostSlug: InputMaybe<Scalars['String']['input']>;
  canonicalSequenceId: InputMaybe<Scalars['String']['input']>;
  canonicalSource: InputMaybe<Scalars['String']['input']>;
  coauthorStatuses: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  collabEditorDialogue: InputMaybe<Scalars['Boolean']['input']>;
  collectionTitle: InputMaybe<Scalars['String']['input']>;
  commentSortOrder: InputMaybe<Scalars['String']['input']>;
  commentsLocked: InputMaybe<Scalars['Boolean']['input']>;
  commentsLockedToAccountsCreatedAfter: InputMaybe<Scalars['Date']['input']>;
  contactInfo: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  curatedDate: InputMaybe<Scalars['Date']['input']>;
  customHighlight: InputMaybe<Scalars['JSON']['input']>;
  debate: InputMaybe<Scalars['Boolean']['input']>;
  defaultRecommendation: InputMaybe<Scalars['Boolean']['input']>;
  deletedDraft: InputMaybe<Scalars['Boolean']['input']>;
  disableRecommendation: InputMaybe<Scalars['Boolean']['input']>;
  disableSidenotes: InputMaybe<Scalars['Boolean']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  endTime: InputMaybe<Scalars['Date']['input']>;
  eventImageId: InputMaybe<Scalars['String']['input']>;
  eventRegistrationLink: InputMaybe<Scalars['String']['input']>;
  eventType: InputMaybe<Scalars['String']['input']>;
  facebookLink: InputMaybe<Scalars['String']['input']>;
  feedId: InputMaybe<Scalars['String']['input']>;
  feedLink: InputMaybe<Scalars['String']['input']>;
  fmCrosspost: InputMaybe<Scalars['JSON']['input']>;
  forceAllowType3Audio: InputMaybe<Scalars['Boolean']['input']>;
  frontpageDate: InputMaybe<Scalars['Date']['input']>;
  generateDraftJargon: InputMaybe<Scalars['Boolean']['input']>;
  globalEvent: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  groupId: InputMaybe<Scalars['String']['input']>;
  hasCoauthorPermission: InputMaybe<Scalars['Boolean']['input']>;
  hiddenRelatedQuestion: InputMaybe<Scalars['Boolean']['input']>;
  hideAuthor: InputMaybe<Scalars['Boolean']['input']>;
  hideCommentKarma: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPopularComments: InputMaybe<Scalars['Boolean']['input']>;
  hideFromRecentDiscussions: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageComments: InputMaybe<Scalars['Boolean']['input']>;
  ignoreRateLimits: InputMaybe<Scalars['Boolean']['input']>;
  isEvent: InputMaybe<Scalars['Boolean']['input']>;
  joinEventLink: InputMaybe<Scalars['String']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  legacySpam: InputMaybe<Scalars['Boolean']['input']>;
  linkSharingKey: InputMaybe<Scalars['String']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  manifoldReviewMarketId: InputMaybe<Scalars['String']['input']>;
  meetupLink: InputMaybe<Scalars['String']['input']>;
  meta: InputMaybe<Scalars['Boolean']['input']>;
  metaDate: InputMaybe<Scalars['Date']['input']>;
  metaSticky: InputMaybe<Scalars['Boolean']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  moderationStyle: InputMaybe<Scalars['String']['input']>;
  nextDayReminderSent: InputMaybe<Scalars['Boolean']['input']>;
  noIndex: InputMaybe<Scalars['Boolean']['input']>;
  onlineEvent: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToEstablishedAccounts: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToLoggedIn: InputMaybe<Scalars['Boolean']['input']>;
  organizerIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  podcastEpisodeId: InputMaybe<Scalars['String']['input']>;
  postCategory: InputMaybe<Scalars['String']['input']>;
  postedAt: InputMaybe<Scalars['Date']['input']>;
  question: InputMaybe<Scalars['Boolean']['input']>;
  readTimeMinutesOverride: InputMaybe<Scalars['Float']['input']>;
  rejected: InputMaybe<Scalars['Boolean']['input']>;
  rejectedByUserId: InputMaybe<Scalars['String']['input']>;
  rejectedReason: InputMaybe<Scalars['String']['input']>;
  reviewForAlignmentUserId: InputMaybe<Scalars['String']['input']>;
  reviewForCuratedUserId: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  shareWithUsers: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sharingSettings: InputMaybe<Scalars['JSON']['input']>;
  shortform: InputMaybe<Scalars['Boolean']['input']>;
  sideCommentVisibility: InputMaybe<Scalars['String']['input']>;
  socialPreview: InputMaybe<Scalars['JSON']['input']>;
  socialPreviewImageAutoUrl: InputMaybe<Scalars['String']['input']>;
  socialPreviewImageId: InputMaybe<Scalars['String']['input']>;
  startTime: InputMaybe<Scalars['Date']['input']>;
  status: InputMaybe<Scalars['Float']['input']>;
  sticky: InputMaybe<Scalars['Boolean']['input']>;
  stickyPriority: InputMaybe<Scalars['Int']['input']>;
  subforumTagId: InputMaybe<Scalars['String']['input']>;
  submitToFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  suggestForAlignmentUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  suggestForCuratedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  swrCachingEnabled: InputMaybe<Scalars['Boolean']['input']>;
  tagRelevance: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  types: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  unlisted: InputMaybe<Scalars['Boolean']['input']>;
  url: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  votingSystem: InputMaybe<Scalars['String']['input']>;
  wasEverUndrafted: InputMaybe<Scalars['Boolean']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePostEmbeddingDataInput = {
  embeddings: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  lastGeneratedAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  model: InputMaybe<Scalars['String']['input']>;
  postHash: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePostEmbeddingInput = {
  data: UpdatePostEmbeddingDataInput;
  selector: PostEmbeddingSelectorUniqueInput;
};

export type UpdatePostInput = {
  data: UpdatePostDataInput;
  selector: PostSelectorUniqueInput;
};

export type UpdatePostRecommendationDataInput = {
  clickedAt: InputMaybe<Scalars['Date']['input']>;
  clientId: InputMaybe<Scalars['String']['input']>;
  lastRecommendedAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  recommendationCount: InputMaybe<Scalars['Int']['input']>;
  strategyName: InputMaybe<Scalars['String']['input']>;
  strategySettings: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePostRecommendationInput = {
  data: UpdatePostRecommendationDataInput;
  selector: PostRecommendationSelectorUniqueInput;
};

export type UpdatePostRelationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePostRelationInput = {
  data: UpdatePostRelationDataInput;
  selector: PostRelationSelectorUniqueInput;
};

export type UpdatePostViewTimeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePostViewTimeInput = {
  data: UpdatePostViewTimeDataInput;
  selector: PostViewTimeSelectorUniqueInput;
};

export type UpdatePostViewsDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePostViewsInput = {
  data: UpdatePostViewsDataInput;
  selector: PostViewsSelectorUniqueInput;
};

export type UpdateRssFeedDataInput = {
  displayFullContent: InputMaybe<Scalars['Boolean']['input']>;
  importAsDraft: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  nickname: InputMaybe<Scalars['String']['input']>;
  ownedByUser: InputMaybe<Scalars['Boolean']['input']>;
  rawFeed: InputMaybe<Scalars['JSON']['input']>;
  setCanonicalUrl: InputMaybe<Scalars['Boolean']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
  url: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRssFeedInput = {
  data: UpdateRssFeedDataInput;
  selector: RssFeedSelectorUniqueInput;
};

export type UpdateReadStatusDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateReadStatusInput = {
  data: UpdateReadStatusDataInput;
  selector: ReadStatusSelectorUniqueInput;
};

export type UpdateRecommendationsCacheDataInput = {
  attributionId: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  scenario: InputMaybe<Scalars['String']['input']>;
  source: InputMaybe<Scalars['String']['input']>;
  ttlMs: InputMaybe<Scalars['Float']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRecommendationsCacheInput = {
  data: UpdateRecommendationsCacheDataInput;
  selector: RecommendationsCacheSelectorUniqueInput;
};

export type UpdateReportDataInput = {
  claimedUserId: InputMaybe<Scalars['String']['input']>;
  closedAt: InputMaybe<Scalars['Date']['input']>;
  createdAt: InputMaybe<Scalars['Date']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  markedAsSpam: InputMaybe<Scalars['Boolean']['input']>;
  reportedAsSpam: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateReportInput = {
  data: UpdateReportDataInput;
  selector: ReportSelectorUniqueInput;
};

export type UpdateReviewVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateReviewVoteInput = {
  data: UpdateReviewVoteDataInput;
  selector: ReviewVoteSelectorUniqueInput;
};

export type UpdateReviewWinnerArtDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  splashArtImagePrompt: InputMaybe<Scalars['String']['input']>;
  splashArtImageUrl: InputMaybe<Scalars['String']['input']>;
};

export type UpdateReviewWinnerArtInput = {
  data: UpdateReviewWinnerArtDataInput;
  selector: ReviewWinnerArtSelectorUniqueInput;
};

export type UpdateReviewWinnerDataInput = {
  category: InputMaybe<Scalars['String']['input']>;
  curatedOrder: InputMaybe<Scalars['Float']['input']>;
  isAI: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  reviewRanking: InputMaybe<Scalars['Float']['input']>;
  reviewYear: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateReviewWinnerInput = {
  data: UpdateReviewWinnerDataInput;
  selector: ReviewWinnerSelectorUniqueInput;
};

export type UpdateRevisionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  skipAttributions: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateRevisionInput = {
  data: UpdateRevisionDataInput;
  selector: RevisionSelectorUniqueInput;
};

export type UpdateSequenceDataInput = {
  af: InputMaybe<Scalars['Boolean']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug: InputMaybe<Scalars['String']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  curatedOrder: InputMaybe<Scalars['Float']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  gridImageId: InputMaybe<Scalars['String']['input']>;
  hidden: InputMaybe<Scalars['Boolean']['input']>;
  hideFromAuthorPage: InputMaybe<Scalars['Boolean']['input']>;
  isDeleted: InputMaybe<Scalars['Boolean']['input']>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  userProfileOrder: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateSequenceInput = {
  data: UpdateSequenceDataInput;
  selector: SequenceSelectorUniqueInput;
};

export type UpdateSessionDataInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  expires: InputMaybe<Scalars['Date']['input']>;
  lastModified: InputMaybe<Scalars['Date']['input']>;
  session: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateSessionInput = {
  data: UpdateSessionDataInput;
  selector: SessionSelectorUniqueInput;
};

export type UpdateSideCommentCacheDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateSideCommentCacheInput = {
  data: UpdateSideCommentCacheDataInput;
  selector: SideCommentCacheSelectorUniqueInput;
};

export type UpdateSplashArtCoordinateDataInput = {
  leftFlipped: InputMaybe<Scalars['Boolean']['input']>;
  leftHeightPct: InputMaybe<Scalars['Float']['input']>;
  leftWidthPct: InputMaybe<Scalars['Float']['input']>;
  leftXPct: InputMaybe<Scalars['Float']['input']>;
  leftYPct: InputMaybe<Scalars['Float']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  middleFlipped: InputMaybe<Scalars['Boolean']['input']>;
  middleHeightPct: InputMaybe<Scalars['Float']['input']>;
  middleWidthPct: InputMaybe<Scalars['Float']['input']>;
  middleXPct: InputMaybe<Scalars['Float']['input']>;
  middleYPct: InputMaybe<Scalars['Float']['input']>;
  reviewWinnerArtId: InputMaybe<Scalars['String']['input']>;
  rightFlipped: InputMaybe<Scalars['Boolean']['input']>;
  rightHeightPct: InputMaybe<Scalars['Float']['input']>;
  rightWidthPct: InputMaybe<Scalars['Float']['input']>;
  rightXPct: InputMaybe<Scalars['Float']['input']>;
  rightYPct: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateSplashArtCoordinateInput = {
  data: UpdateSplashArtCoordinateDataInput;
  selector: SplashArtCoordinateSelectorUniqueInput;
};

export type UpdateSpotlightDataInput = {
  customSubtitle: InputMaybe<Scalars['String']['input']>;
  customTitle: InputMaybe<Scalars['String']['input']>;
  deletedDraft: InputMaybe<Scalars['Boolean']['input']>;
  description: InputMaybe<Scalars['JSON']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  documentType: InputMaybe<Scalars['String']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  duration: InputMaybe<Scalars['Float']['input']>;
  headerTitle: InputMaybe<Scalars['String']['input']>;
  headerTitleLeftColor: InputMaybe<Scalars['String']['input']>;
  headerTitleRightColor: InputMaybe<Scalars['String']['input']>;
  imageFade: InputMaybe<Scalars['Boolean']['input']>;
  imageFadeColor: InputMaybe<Scalars['String']['input']>;
  lastPromotedAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  position: InputMaybe<Scalars['Float']['input']>;
  showAuthor: InputMaybe<Scalars['Boolean']['input']>;
  spotlightDarkImageId: InputMaybe<Scalars['String']['input']>;
  spotlightImageId: InputMaybe<Scalars['String']['input']>;
  spotlightSplashImageUrl: InputMaybe<Scalars['String']['input']>;
  subtitleUrl: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSpotlightInput = {
  data: UpdateSpotlightDataInput;
  selector: SpotlightSelectorUniqueInput;
};

export type UpdateSubscriptionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateSubscriptionInput = {
  data: UpdateSubscriptionDataInput;
  selector: SubscriptionSelectorUniqueInput;
};

export type UpdateSurveyDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSurveyInput = {
  data: UpdateSurveyDataInput;
  selector: SurveySelectorUniqueInput;
};

export type UpdateSurveyQuestionDataInput = {
  format: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
  question: InputMaybe<Scalars['String']['input']>;
  surveyId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSurveyQuestionInput = {
  data: UpdateSurveyQuestionDataInput;
  selector: SurveyQuestionSelectorUniqueInput;
};

export type UpdateSurveyResponseDataInput = {
  clientId: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  response: InputMaybe<Scalars['JSON']['input']>;
  surveyId: InputMaybe<Scalars['String']['input']>;
  surveyScheduleId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSurveyResponseInput = {
  data: UpdateSurveyResponseDataInput;
  selector: SurveyResponseSelectorUniqueInput;
};

export type UpdateSurveyScheduleDataInput = {
  clientIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  deactivated: InputMaybe<Scalars['Boolean']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
  impressionsLimit: InputMaybe<Scalars['Float']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  maxKarma: InputMaybe<Scalars['Float']['input']>;
  maxVisitorPercentage: InputMaybe<Scalars['Float']['input']>;
  minKarma: InputMaybe<Scalars['Float']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  surveyId: InputMaybe<Scalars['String']['input']>;
  target: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSurveyScheduleInput = {
  data: UpdateSurveyScheduleDataInput;
  selector: SurveyScheduleSelectorUniqueInput;
};

export type UpdateTagDataInput = {
  adminOnly: InputMaybe<Scalars['Boolean']['input']>;
  autoTagModel: InputMaybe<Scalars['String']['input']>;
  autoTagPrompt: InputMaybe<Scalars['String']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  canEditUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  canVoteOnRels: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  core: InputMaybe<Scalars['Boolean']['input']>;
  coreTagId: InputMaybe<Scalars['String']['input']>;
  defaultOrder: InputMaybe<Scalars['Float']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  description: InputMaybe<Scalars['JSON']['input']>;
  descriptionTruncationCount: InputMaybe<Scalars['Float']['input']>;
  forceAllowType3Audio: InputMaybe<Scalars['Boolean']['input']>;
  introSequenceId: InputMaybe<Scalars['String']['input']>;
  isPlaceholderPage: InputMaybe<Scalars['Boolean']['input']>;
  isPostType: InputMaybe<Scalars['Boolean']['input']>;
  isSubforum: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  needsReview: InputMaybe<Scalars['Boolean']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  parentTagId: InputMaybe<Scalars['String']['input']>;
  postsDefaultSortOrder: InputMaybe<Scalars['String']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  shortName: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  squareImageId: InputMaybe<Scalars['String']['input']>;
  subTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  subforumIntroPostId: InputMaybe<Scalars['String']['input']>;
  subforumModeratorIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  subforumWelcomeText: InputMaybe<Scalars['JSON']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  suggestedAsFilter: InputMaybe<Scalars['Boolean']['input']>;
  tagFlagsIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  wikiGrade: InputMaybe<Scalars['Int']['input']>;
  wikiOnly: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateTagFlagDataInput = {
  contents: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateTagFlagInput = {
  data: UpdateTagFlagDataInput;
  selector: TagFlagSelectorUniqueInput;
};

export type UpdateTagInput = {
  data: UpdateTagDataInput;
  selector: TagSelectorUniqueInput;
};

export type UpdateTagRelDataInput = {
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateTagRelInput = {
  data: UpdateTagRelDataInput;
  selector: TagRelSelectorUniqueInput;
};

export type UpdateTweetDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateTweetInput = {
  data: UpdateTweetDataInput;
  selector: TweetSelectorUniqueInput;
};

export type UpdateTypingIndicatorDataInput = {
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateTypingIndicatorInput = {
  data: UpdateTypingIndicatorDataInput;
  selector: TypingIndicatorSelectorUniqueInput;
};

export type UpdateUserActivityDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateUserActivityInput = {
  data: UpdateUserActivityDataInput;
  selector: UserActivitySelectorUniqueInput;
};

export type UpdateUserDataInput = {
  abTestKey: InputMaybe<Scalars['String']['input']>;
  abTestOverrides: InputMaybe<Scalars['JSON']['input']>;
  acceptedTos: InputMaybe<Scalars['Boolean']['input']>;
  acknowledgedNewUserGuidelines: InputMaybe<Scalars['Boolean']['input']>;
  afApplicationText: InputMaybe<Scalars['String']['input']>;
  afSubmittedApplication: InputMaybe<Scalars['Boolean']['input']>;
  allCommentingDisabled: InputMaybe<Scalars['Boolean']['input']>;
  allPostsFilter: InputMaybe<Scalars['String']['input']>;
  allPostsHideCommunity: InputMaybe<Scalars['Boolean']['input']>;
  allPostsIncludeEvents: InputMaybe<Scalars['Boolean']['input']>;
  allPostsOpenSettings: InputMaybe<Scalars['Boolean']['input']>;
  allPostsShowLowKarma: InputMaybe<Scalars['Boolean']['input']>;
  allPostsSorting: InputMaybe<Scalars['String']['input']>;
  allPostsTimeframe: InputMaybe<Scalars['String']['input']>;
  allowDatadogSessionReplay: InputMaybe<Scalars['Boolean']['input']>;
  autoSubscribeAsOrganizer: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_comments: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_posts: InputMaybe<Scalars['Boolean']['input']>;
  banned: InputMaybe<Scalars['Date']['input']>;
  bannedPersonalUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  bannedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  beta: InputMaybe<Scalars['Boolean']['input']>;
  biography: InputMaybe<Scalars['JSON']['input']>;
  blueskyProfileURL: InputMaybe<Scalars['String']['input']>;
  bookmarkedPostsMetadata: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  careerStage: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  collapseModerationGuidelines: InputMaybe<Scalars['Boolean']['input']>;
  commentSorting: InputMaybe<Scalars['String']['input']>;
  commentingOnOtherUsersDisabled: InputMaybe<Scalars['Boolean']['input']>;
  conversationsDisabled: InputMaybe<Scalars['Boolean']['input']>;
  criticismTipsDismissed: InputMaybe<Scalars['Boolean']['input']>;
  currentFrontpageFilter: InputMaybe<Scalars['String']['input']>;
  defaultToCKEditor: InputMaybe<Scalars['Boolean']['input']>;
  deleteContent: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  displayName: InputMaybe<Scalars['String']['input']>;
  draftsListShowArchived: InputMaybe<Scalars['Boolean']['input']>;
  draftsListShowShared: InputMaybe<Scalars['Boolean']['input']>;
  draftsListSorting: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  emailSubscribedToCurated: InputMaybe<Scalars['Boolean']['input']>;
  expandedFrontpageSections: InputMaybe<Scalars['JSON']['input']>;
  facebookProfileURL: InputMaybe<Scalars['String']['input']>;
  fmCrosspostUserId: InputMaybe<Scalars['String']['input']>;
  frontpageFilterSettings: InputMaybe<Scalars['JSON']['input']>;
  frontpageSelectedTab: InputMaybe<Scalars['String']['input']>;
  fullName: InputMaybe<Scalars['String']['input']>;
  generateJargonForDrafts: InputMaybe<Scalars['Boolean']['input']>;
  generateJargonForPublishedPosts: InputMaybe<Scalars['Boolean']['input']>;
  githubProfileURL: InputMaybe<Scalars['String']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  groups: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  hiddenPostsMetadata: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  hideAFNonMemberInitialWarning: InputMaybe<Scalars['Boolean']['input']>;
  hideActiveDialogueUsers: InputMaybe<Scalars['Boolean']['input']>;
  hideCommunitySection: InputMaybe<Scalars['Boolean']['input']>;
  hideDialogueFacilitation: InputMaybe<Scalars['Boolean']['input']>;
  hideElicitPredictions: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPeopleDirectory: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2019Ad: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2020Ad: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageFilterSettingsDesktop: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageMap: InputMaybe<Scalars['Boolean']['input']>;
  hideHomeRHS: InputMaybe<Scalars['Boolean']['input']>;
  hideIntercom: InputMaybe<Scalars['Boolean']['input']>;
  hideJobAdUntil: InputMaybe<Scalars['Date']['input']>;
  hideMeetupsPoke: InputMaybe<Scalars['Boolean']['input']>;
  hideNavigationSidebar: InputMaybe<Scalars['Boolean']['input']>;
  hidePostsRecommendations: InputMaybe<Scalars['Boolean']['input']>;
  hideSubscribePoke: InputMaybe<Scalars['Boolean']['input']>;
  hideSunshineSidebar: InputMaybe<Scalars['Boolean']['input']>;
  hideTaggingProgressBar: InputMaybe<Scalars['Boolean']['input']>;
  howICanHelpOthers: InputMaybe<Scalars['JSON']['input']>;
  howOthersCanHelpMe: InputMaybe<Scalars['JSON']['input']>;
  inactiveSurveyEmailSentAt: InputMaybe<Scalars['Date']['input']>;
  isAdmin: InputMaybe<Scalars['Boolean']['input']>;
  jobTitle: InputMaybe<Scalars['String']['input']>;
  karmaChangeBatchStart: InputMaybe<Scalars['Date']['input']>;
  karmaChangeLastOpened: InputMaybe<Scalars['Date']['input']>;
  karmaChangeNotifierSettings: InputMaybe<Scalars['JSON']['input']>;
  lastNotificationsCheck: InputMaybe<Scalars['Date']['input']>;
  lastUsedTimezone: InputMaybe<Scalars['String']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  linkedinProfileURL: InputMaybe<Scalars['String']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  mapLocation: InputMaybe<Scalars['JSON']['input']>;
  mapMarkerText: InputMaybe<Scalars['String']['input']>;
  markDownPostEditor: InputMaybe<Scalars['Boolean']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  moderationStyle: InputMaybe<Scalars['String']['input']>;
  moderatorAssistance: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotifications: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotificationsLocation: InputMaybe<Scalars['JSON']['input']>;
  nearbyEventsNotificationsRadius: InputMaybe<Scalars['Float']['input']>;
  nearbyPeopleNotificationThreshold: InputMaybe<Scalars['Float']['input']>;
  needsReview: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsPosts: InputMaybe<Scalars['Boolean']['input']>;
  noExpandUnreadCommentsReview: InputMaybe<Scalars['Boolean']['input']>;
  noKibitz: InputMaybe<Scalars['Boolean']['input']>;
  noSingleLineComments: InputMaybe<Scalars['Boolean']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  notificationAddedAsCoauthor: InputMaybe<Scalars['JSON']['input']>;
  notificationAlignmentSubmissionApproved: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnDraft: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnSubscribedPost: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateCommentsOnSubscribedPost: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateReplies: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMatch: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMessages: InputMaybe<Scalars['JSON']['input']>;
  notificationEventInRadius: InputMaybe<Scalars['JSON']['input']>;
  notificationGroupAdministration: InputMaybe<Scalars['JSON']['input']>;
  notificationKarmaPowersGained: InputMaybe<Scalars['JSON']['input']>;
  notificationNewDialogueChecks: InputMaybe<Scalars['JSON']['input']>;
  notificationNewMention: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsInGroups: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsNominatedReview: InputMaybe<Scalars['JSON']['input']>;
  notificationPrivateMessage: InputMaybe<Scalars['JSON']['input']>;
  notificationPublishedDialogueMessages: InputMaybe<Scalars['JSON']['input']>;
  notificationRSVPs: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToMyComments: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToSubscribedComments: InputMaybe<Scalars['JSON']['input']>;
  notificationSharedWithMe: InputMaybe<Scalars['JSON']['input']>;
  notificationShortformContent: InputMaybe<Scalars['JSON']['input']>;
  notificationSubforumUnread: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedSequencePost: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedTagPost: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserComment: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserPost: InputMaybe<Scalars['JSON']['input']>;
  notificationYourTurnMatchForm: InputMaybe<Scalars['JSON']['input']>;
  nullifyVotes: InputMaybe<Scalars['Boolean']['input']>;
  optedInToDialogueFacilitation: InputMaybe<Scalars['Boolean']['input']>;
  optedOutOfSurveys: InputMaybe<Scalars['Boolean']['input']>;
  organization: InputMaybe<Scalars['String']['input']>;
  organizerOfGroupIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  partiallyReadSequences: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  paymentEmail: InputMaybe<Scalars['String']['input']>;
  paymentInfo: InputMaybe<Scalars['String']['input']>;
  permanentDeletionRequestedAt: InputMaybe<Scalars['Date']['input']>;
  petrovLaunchCodeDate: InputMaybe<Scalars['Date']['input']>;
  petrovOptOut: InputMaybe<Scalars['Boolean']['input']>;
  petrovPressedButtonDate: InputMaybe<Scalars['Date']['input']>;
  postGlossariesPinned: InputMaybe<Scalars['Boolean']['input']>;
  postingDisabled: InputMaybe<Scalars['Boolean']['input']>;
  previousDisplayName: InputMaybe<Scalars['String']['input']>;
  profileImageId: InputMaybe<Scalars['String']['input']>;
  profileTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  profileUpdatedAt: InputMaybe<Scalars['Date']['input']>;
  programParticipation: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  reactPaletteStyle: InputMaybe<Scalars['String']['input']>;
  recommendationSettings: InputMaybe<Scalars['JSON']['input']>;
  revealChecksToAdmins: InputMaybe<Scalars['Boolean']['input']>;
  reviewForAlignmentForumUserId: InputMaybe<Scalars['String']['input']>;
  reviewVotesQuadratic: InputMaybe<Scalars['Boolean']['input']>;
  reviewVotesQuadratic2019: InputMaybe<Scalars['Boolean']['input']>;
  reviewVotesQuadratic2020: InputMaybe<Scalars['Boolean']['input']>;
  reviewedAt: InputMaybe<Scalars['Date']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  shortformFeedId: InputMaybe<Scalars['String']['input']>;
  showCommunityInRecentDiscussion: InputMaybe<Scalars['Boolean']['input']>;
  showDialoguesList: InputMaybe<Scalars['Boolean']['input']>;
  showHideKarmaOption: InputMaybe<Scalars['Boolean']['input']>;
  showMatches: InputMaybe<Scalars['Boolean']['input']>;
  showMyDialogues: InputMaybe<Scalars['Boolean']['input']>;
  showPostAuthorCard: InputMaybe<Scalars['Boolean']['input']>;
  showRecommendedPartners: InputMaybe<Scalars['Boolean']['input']>;
  signUpReCaptchaRating: InputMaybe<Scalars['Float']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  snoozedUntilContentCount: InputMaybe<Scalars['Float']['input']>;
  sortDraftsBy: InputMaybe<Scalars['String']['input']>;
  subforumPreferredLayout: InputMaybe<Scalars['String']['input']>;
  subscribedToDigest: InputMaybe<Scalars['Boolean']['input']>;
  sunshineFlagged: InputMaybe<Scalars['Boolean']['input']>;
  sunshineNotes: InputMaybe<Scalars['String']['input']>;
  sunshineSnoozed: InputMaybe<Scalars['Boolean']['input']>;
  taggingDashboardCollapsed: InputMaybe<Scalars['Boolean']['input']>;
  theme: InputMaybe<Scalars['JSON']['input']>;
  twitterProfileURL: InputMaybe<Scalars['String']['input']>;
  twitterProfileURLAdmin: InputMaybe<Scalars['String']['input']>;
  unsubscribeFromAll: InputMaybe<Scalars['Boolean']['input']>;
  userSurveyEmailSentAt: InputMaybe<Scalars['Date']['input']>;
  username: InputMaybe<Scalars['String']['input']>;
  usernameUnset: InputMaybe<Scalars['Boolean']['input']>;
  viewUnreviewedComments: InputMaybe<Scalars['Boolean']['input']>;
  voteBanned: InputMaybe<Scalars['Boolean']['input']>;
  walledGardenInvite: InputMaybe<Scalars['Boolean']['input']>;
  walledGardenPortalOnboarded: InputMaybe<Scalars['Boolean']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
  whenConfirmationEmailSent: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateUserEagDetailDataInput = {
  careerStage: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  countryOrRegion: InputMaybe<Scalars['String']['input']>;
  experiencedIn: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  interestedIn: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  nearestCity: InputMaybe<Scalars['String']['input']>;
  willingnessToRelocate: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateUserEagDetailInput = {
  data: UpdateUserEagDetailDataInput;
  selector: UserEagDetailSelectorUniqueInput;
};

export type UpdateUserInput = {
  data: UpdateUserDataInput;
  selector: UserSelectorUniqueInput;
};

export type UpdateUserJobAdDataInput = {
  adState: InputMaybe<Scalars['String']['input']>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  reminderSetAt: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateUserJobAdInput = {
  data: UpdateUserJobAdDataInput;
  selector: UserJobAdSelectorUniqueInput;
};

export type UpdateUserMostValuablePostDataInput = {
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserMostValuablePostInput = {
  data: UpdateUserMostValuablePostDataInput;
  selector: UserMostValuablePostSelectorUniqueInput;
};

export type UpdateUserRateLimitDataInput = {
  actionsPerInterval: InputMaybe<Scalars['Float']['input']>;
  endedAt: InputMaybe<Scalars['Date']['input']>;
  intervalLength: InputMaybe<Scalars['Float']['input']>;
  intervalUnit: InputMaybe<Scalars['String']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserRateLimitInput = {
  data: UpdateUserRateLimitDataInput;
  selector: UserRateLimitSelectorUniqueInput;
};

export type UpdateUserTagRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  subforumEmailNotifications: InputMaybe<Scalars['Boolean']['input']>;
  subforumHideIntroPost: InputMaybe<Scalars['Boolean']['input']>;
  subforumShowUnreadInSidebar: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateUserTagRelInput = {
  data: UpdateUserTagRelDataInput;
  selector: UserTagRelSelectorUniqueInput;
};

export type UpdateVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateVoteInput = {
  data: UpdateVoteDataInput;
  selector: VoteSelectorUniqueInput;
};

export type UpsertAdvisorRequestInput = {
  data: UpdateAdvisorRequestDataInput;
  selector: AdvisorRequestSelectorUniqueInput;
};

export type UpsertArbitalCachesInput = {
  data: UpdateArbitalCachesDataInput;
  selector: ArbitalCachesSelectorUniqueInput;
};

export type UpsertArbitalTagContentRelInput = {
  data: UpdateArbitalTagContentRelDataInput;
  selector: ArbitalTagContentRelSelectorUniqueInput;
};

export type UpsertBanInput = {
  data: UpdateBanDataInput;
  selector: BanSelectorUniqueInput;
};

export type UpsertBookInput = {
  data: UpdateBookDataInput;
  selector: BookSelectorUniqueInput;
};

export type UpsertChapterInput = {
  data: UpdateChapterDataInput;
  selector: ChapterSelectorUniqueInput;
};

export type UpsertCkEditorUserSessionInput = {
  data: UpdateCkEditorUserSessionDataInput;
  selector: CkEditorUserSessionSelectorUniqueInput;
};

export type UpsertClientIdInput = {
  data: UpdateClientIdDataInput;
  selector: ClientIdSelectorUniqueInput;
};

export type UpsertCollectionInput = {
  data: UpdateCollectionDataInput;
  selector: CollectionSelectorUniqueInput;
};

export type UpsertCommentInput = {
  data: UpdateCommentDataInput;
  selector: CommentSelectorUniqueInput;
};

export type UpsertCommentModeratorActionInput = {
  data: UpdateCommentModeratorActionDataInput;
  selector: CommentModeratorActionSelectorUniqueInput;
};

export type UpsertConversationInput = {
  data: UpdateConversationDataInput;
  selector: ConversationSelectorUniqueInput;
};

export type UpsertCronHistoryInput = {
  data: UpdateCronHistoryDataInput;
  selector: CronHistorySelectorUniqueInput;
};

export type UpsertCurationEmailInput = {
  data: UpdateCurationEmailDataInput;
  selector: CurationEmailSelectorUniqueInput;
};

export type UpsertCurationNoticeInput = {
  data: UpdateCurationNoticeDataInput;
  selector: CurationNoticeSelectorUniqueInput;
};

export type UpsertDatabaseMetadataInput = {
  data: UpdateDatabaseMetadataDataInput;
  selector: DatabaseMetadataSelectorUniqueInput;
};

export type UpsertDebouncerEventsInput = {
  data: UpdateDebouncerEventsDataInput;
  selector: DebouncerEventsSelectorUniqueInput;
};

export type UpsertDialogueCheckInput = {
  data: UpdateDialogueCheckDataInput;
  selector: DialogueCheckSelectorUniqueInput;
};

export type UpsertDialogueMatchPreferenceInput = {
  data: UpdateDialogueMatchPreferenceDataInput;
  selector: DialogueMatchPreferenceSelectorUniqueInput;
};

export type UpsertDigestInput = {
  data: UpdateDigestDataInput;
  selector: DigestSelectorUniqueInput;
};

export type UpsertDigestPostInput = {
  data: UpdateDigestPostDataInput;
  selector: DigestPostSelectorUniqueInput;
};

export type UpsertElectionCandidateInput = {
  data: UpdateElectionCandidateDataInput;
  selector: ElectionCandidateSelectorUniqueInput;
};

export type UpsertElectionVoteInput = {
  data: UpdateElectionVoteDataInput;
  selector: ElectionVoteSelectorUniqueInput;
};

export type UpsertElicitQuestionInput = {
  data: UpdateElicitQuestionDataInput;
  selector: ElicitQuestionSelectorUniqueInput;
};

export type UpsertElicitQuestionPredictionInput = {
  data: UpdateElicitQuestionPredictionDataInput;
  selector: ElicitQuestionPredictionSelectorUniqueInput;
};

export type UpsertEmailTokensInput = {
  data: UpdateEmailTokensDataInput;
  selector: EmailTokensSelectorUniqueInput;
};

export type UpsertFeaturedResourceInput = {
  data: UpdateFeaturedResourceDataInput;
  selector: FeaturedResourceSelectorUniqueInput;
};

export type UpsertFieldChangeInput = {
  data: UpdateFieldChangeDataInput;
  selector: FieldChangeSelectorUniqueInput;
};

export type UpsertForumEventInput = {
  data: UpdateForumEventDataInput;
  selector: ForumEventSelectorUniqueInput;
};

export type UpsertGardenCodeInput = {
  data: UpdateGardenCodeDataInput;
  selector: GardenCodeSelectorUniqueInput;
};

export type UpsertGoogleServiceAccountSessionInput = {
  data: UpdateGoogleServiceAccountSessionDataInput;
  selector: GoogleServiceAccountSessionSelectorUniqueInput;
};

export type UpsertImagesInput = {
  data: UpdateImagesDataInput;
  selector: ImagesSelectorUniqueInput;
};

export type UpsertJargonTermInput = {
  data: UpdateJargonTermDataInput;
  selector: JargonTermSelectorUniqueInput;
};

export type UpsertLwEventInput = {
  data: UpdateLwEventDataInput;
  selector: LwEventSelectorUniqueInput;
};

export type UpsertLegacyDataInput = {
  data: UpdateLegacyDataDataInput;
  selector: LegacyDataSelectorUniqueInput;
};

export type UpsertLlmConversationInput = {
  data: UpdateLlmConversationDataInput;
  selector: LlmConversationSelectorUniqueInput;
};

export type UpsertLlmMessageInput = {
  data: UpdateLlmMessageDataInput;
  selector: LlmMessageSelectorUniqueInput;
};

export type UpsertLocalgroupInput = {
  data: UpdateLocalgroupDataInput;
  selector: LocalgroupSelectorUniqueInput;
};

export type UpsertManifoldProbabilitiesCacheInput = {
  data: UpdateManifoldProbabilitiesCacheDataInput;
  selector: ManifoldProbabilitiesCacheSelectorUniqueInput;
};

export type UpsertMessageInput = {
  data: UpdateMessageDataInput;
  selector: MessageSelectorUniqueInput;
};

export type UpsertMigrationInput = {
  data: UpdateMigrationDataInput;
  selector: MigrationSelectorUniqueInput;
};

export type UpsertModerationTemplateInput = {
  data: UpdateModerationTemplateDataInput;
  selector: ModerationTemplateSelectorUniqueInput;
};

export type UpsertModeratorActionInput = {
  data: UpdateModeratorActionDataInput;
  selector: ModeratorActionSelectorUniqueInput;
};

export type UpsertMultiDocumentInput = {
  data: UpdateMultiDocumentDataInput;
  selector: MultiDocumentSelectorUniqueInput;
};

export type UpsertNotificationInput = {
  data: UpdateNotificationDataInput;
  selector: NotificationSelectorUniqueInput;
};

export type UpsertPageCacheEntryInput = {
  data: UpdatePageCacheEntryDataInput;
  selector: PageCacheEntrySelectorUniqueInput;
};

export type UpsertPetrovDayActionInput = {
  data: UpdatePetrovDayActionDataInput;
  selector: PetrovDayActionSelectorUniqueInput;
};

export type UpsertPetrovDayLaunchInput = {
  data: UpdatePetrovDayLaunchDataInput;
  selector: PetrovDayLaunchSelectorUniqueInput;
};

export type UpsertPodcastEpisodeInput = {
  data: UpdatePodcastEpisodeDataInput;
  selector: PodcastEpisodeSelectorUniqueInput;
};

export type UpsertPodcastInput = {
  data: UpdatePodcastDataInput;
  selector: PodcastSelectorUniqueInput;
};

export type UpsertPostEmbeddingInput = {
  data: UpdatePostEmbeddingDataInput;
  selector: PostEmbeddingSelectorUniqueInput;
};

export type UpsertPostInput = {
  data: UpdatePostDataInput;
  selector: PostSelectorUniqueInput;
};

export type UpsertPostRecommendationInput = {
  data: UpdatePostRecommendationDataInput;
  selector: PostRecommendationSelectorUniqueInput;
};

export type UpsertPostRelationInput = {
  data: UpdatePostRelationDataInput;
  selector: PostRelationSelectorUniqueInput;
};

export type UpsertPostViewTimeInput = {
  data: UpdatePostViewTimeDataInput;
  selector: PostViewTimeSelectorUniqueInput;
};

export type UpsertPostViewsInput = {
  data: UpdatePostViewsDataInput;
  selector: PostViewsSelectorUniqueInput;
};

export type UpsertRssFeedInput = {
  data: UpdateRssFeedDataInput;
  selector: RssFeedSelectorUniqueInput;
};

export type UpsertReadStatusInput = {
  data: UpdateReadStatusDataInput;
  selector: ReadStatusSelectorUniqueInput;
};

export type UpsertRecommendationsCacheInput = {
  data: UpdateRecommendationsCacheDataInput;
  selector: RecommendationsCacheSelectorUniqueInput;
};

export type UpsertReportInput = {
  data: UpdateReportDataInput;
  selector: ReportSelectorUniqueInput;
};

export type UpsertReviewVoteInput = {
  data: UpdateReviewVoteDataInput;
  selector: ReviewVoteSelectorUniqueInput;
};

export type UpsertReviewWinnerArtInput = {
  data: UpdateReviewWinnerArtDataInput;
  selector: ReviewWinnerArtSelectorUniqueInput;
};

export type UpsertReviewWinnerInput = {
  data: UpdateReviewWinnerDataInput;
  selector: ReviewWinnerSelectorUniqueInput;
};

export type UpsertRevisionInput = {
  data: UpdateRevisionDataInput;
  selector: RevisionSelectorUniqueInput;
};

export type UpsertSequenceInput = {
  data: UpdateSequenceDataInput;
  selector: SequenceSelectorUniqueInput;
};

export type UpsertSessionInput = {
  data: UpdateSessionDataInput;
  selector: SessionSelectorUniqueInput;
};

export type UpsertSideCommentCacheInput = {
  data: UpdateSideCommentCacheDataInput;
  selector: SideCommentCacheSelectorUniqueInput;
};

export type UpsertSplashArtCoordinateInput = {
  data: UpdateSplashArtCoordinateDataInput;
  selector: SplashArtCoordinateSelectorUniqueInput;
};

export type UpsertSpotlightInput = {
  data: UpdateSpotlightDataInput;
  selector: SpotlightSelectorUniqueInput;
};

export type UpsertSubscriptionInput = {
  data: UpdateSubscriptionDataInput;
  selector: SubscriptionSelectorUniqueInput;
};

export type UpsertSurveyInput = {
  data: UpdateSurveyDataInput;
  selector: SurveySelectorUniqueInput;
};

export type UpsertSurveyQuestionInput = {
  data: UpdateSurveyQuestionDataInput;
  selector: SurveyQuestionSelectorUniqueInput;
};

export type UpsertSurveyResponseInput = {
  data: UpdateSurveyResponseDataInput;
  selector: SurveyResponseSelectorUniqueInput;
};

export type UpsertSurveyScheduleInput = {
  data: UpdateSurveyScheduleDataInput;
  selector: SurveyScheduleSelectorUniqueInput;
};

export type UpsertTagFlagInput = {
  data: UpdateTagFlagDataInput;
  selector: TagFlagSelectorUniqueInput;
};

export type UpsertTagInput = {
  data: UpdateTagDataInput;
  selector: TagSelectorUniqueInput;
};

export type UpsertTagRelInput = {
  data: UpdateTagRelDataInput;
  selector: TagRelSelectorUniqueInput;
};

export type UpsertTweetInput = {
  data: UpdateTweetDataInput;
  selector: TweetSelectorUniqueInput;
};

export type UpsertTypingIndicatorInput = {
  data: UpdateTypingIndicatorDataInput;
  selector: TypingIndicatorSelectorUniqueInput;
};

export type UpsertUserActivityInput = {
  data: UpdateUserActivityDataInput;
  selector: UserActivitySelectorUniqueInput;
};

export type UpsertUserEagDetailInput = {
  data: UpdateUserEagDetailDataInput;
  selector: UserEagDetailSelectorUniqueInput;
};

export type UpsertUserInput = {
  data: UpdateUserDataInput;
  selector: UserSelectorUniqueInput;
};

export type UpsertUserJobAdInput = {
  data: UpdateUserJobAdDataInput;
  selector: UserJobAdSelectorUniqueInput;
};

export type UpsertUserMostValuablePostInput = {
  data: UpdateUserMostValuablePostDataInput;
  selector: UserMostValuablePostSelectorUniqueInput;
};

export type UpsertUserRateLimitInput = {
  data: UpdateUserRateLimitDataInput;
  selector: UserRateLimitSelectorUniqueInput;
};

export type UpsertUserTagRelInput = {
  data: UpdateUserTagRelDataInput;
  selector: UserTagRelSelectorUniqueInput;
};

export type UpsertVoteInput = {
  data: UpdateVoteDataInput;
  selector: VoteSelectorUniqueInput;
};

export type UpvotedUser = {
  __typename?: 'UpvotedUser';
  _id: Scalars['ID']['output'];
  agreement_values: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  power_values: Scalars['String']['output'];
  recently_active_matchmaking: Scalars['Boolean']['output'];
  total_agreement: Scalars['Float']['output'];
  total_power: Scalars['Float']['output'];
  username: Scalars['String']['output'];
  vote_counts: Scalars['Int']['output'];
};

export type User = {
  __typename?: 'User';
  IPs: Maybe<Array<Scalars['String']['output']>>;
  _id: Scalars['String']['output'];
  abTestKey: Maybe<Scalars['String']['output']>;
  abTestOverrides: Maybe<Scalars['JSON']['output']>;
  acceptedTos: Maybe<Scalars['Boolean']['output']>;
  acknowledgedNewUserGuidelines: Maybe<Scalars['Boolean']['output']>;
  afApplicationText: Maybe<Scalars['String']['output']>;
  afCommentCount: Maybe<Scalars['Float']['output']>;
  afKarma: Maybe<Scalars['Float']['output']>;
  afPostCount: Maybe<Scalars['Float']['output']>;
  afSequenceCount: Maybe<Scalars['Float']['output']>;
  afSequenceDraftCount: Maybe<Scalars['Float']['output']>;
  afSubmittedApplication: Maybe<Scalars['Boolean']['output']>;
  allCommentingDisabled: Maybe<Scalars['Boolean']['output']>;
  allPostsFilter: Maybe<Scalars['String']['output']>;
  allPostsHideCommunity: Maybe<Scalars['Boolean']['output']>;
  allPostsIncludeEvents: Maybe<Scalars['Boolean']['output']>;
  allPostsOpenSettings: Maybe<Scalars['Boolean']['output']>;
  allPostsShowLowKarma: Maybe<Scalars['Boolean']['output']>;
  allPostsSorting: Maybe<Scalars['String']['output']>;
  allPostsTimeframe: Maybe<Scalars['String']['output']>;
  allowDatadogSessionReplay: Maybe<Scalars['Boolean']['output']>;
  altAccountsDetected: Maybe<Scalars['Boolean']['output']>;
  associatedClientId: Maybe<ClientId>;
  associatedClientIds: Maybe<Array<ClientId>>;
  autoSubscribeAsOrganizer: Maybe<Scalars['Boolean']['output']>;
  auto_subscribe_to_my_comments: Maybe<Scalars['Boolean']['output']>;
  auto_subscribe_to_my_posts: Maybe<Scalars['Boolean']['output']>;
  banned: Maybe<Scalars['Date']['output']>;
  bannedPersonalUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  bannedUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  beta: Maybe<Scalars['Boolean']['output']>;
  bigDownvoteCount: Maybe<Scalars['Float']['output']>;
  bigDownvoteReceivedCount: Maybe<Scalars['Float']['output']>;
  bigUpvoteCount: Maybe<Scalars['Float']['output']>;
  bigUpvoteReceivedCount: Maybe<Scalars['Float']['output']>;
  bio: Maybe<Scalars['String']['output']>;
  biography: Maybe<Revision>;
  biography_latest: Maybe<Scalars['String']['output']>;
  blueskyProfileURL: Maybe<Scalars['String']['output']>;
  bookmarkedPosts: Array<Post>;
  bookmarkedPostsMetadata: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  careerStage: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  collapseModerationGuidelines: Maybe<Scalars['Boolean']['output']>;
  commentCount: Maybe<Scalars['Float']['output']>;
  commentSorting: Maybe<Scalars['String']['output']>;
  commentingOnOtherUsersDisabled: Maybe<Scalars['Boolean']['output']>;
  conversationsDisabled: Maybe<Scalars['Boolean']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  criticismTipsDismissed: Maybe<Scalars['Boolean']['output']>;
  currentFrontpageFilter: Maybe<Scalars['String']['output']>;
  defaultToCKEditor: Maybe<Scalars['Boolean']['output']>;
  deleteContent: Maybe<Scalars['Boolean']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  displayName: Maybe<Scalars['String']['output']>;
  draftsListShowArchived: Maybe<Scalars['Boolean']['output']>;
  draftsListShowShared: Maybe<Scalars['Boolean']['output']>;
  draftsListSorting: Maybe<Scalars['String']['output']>;
  editUrl: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  emailSubscribedToCurated: Maybe<Scalars['Boolean']['output']>;
  emails: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  expandedFrontpageSections: Maybe<Scalars['JSON']['output']>;
  facebookProfileURL: Maybe<Scalars['String']['output']>;
  fmCrosspostUserId: Maybe<Scalars['String']['output']>;
  frontpageFilterSettings: Maybe<Scalars['JSON']['output']>;
  frontpagePostCount: Maybe<Scalars['Float']['output']>;
  frontpageSelectedTab: Maybe<Scalars['String']['output']>;
  fullName: Maybe<Scalars['String']['output']>;
  generateJargonForDrafts: Maybe<Scalars['Boolean']['output']>;
  generateJargonForPublishedPosts: Maybe<Scalars['Boolean']['output']>;
  githubProfileURL: Maybe<Scalars['String']['output']>;
  goodHeartTokens: Maybe<Scalars['Float']['output']>;
  googleLocation: Maybe<Scalars['JSON']['output']>;
  groups: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  hasAuth0Id: Maybe<Scalars['Boolean']['output']>;
  hiddenPosts: Array<Post>;
  hiddenPostsMetadata: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  hideAFNonMemberInitialWarning: Maybe<Scalars['Boolean']['output']>;
  hideActiveDialogueUsers: Maybe<Scalars['Boolean']['output']>;
  hideCommunitySection: Maybe<Scalars['Boolean']['output']>;
  hideDialogueFacilitation: Maybe<Scalars['Boolean']['output']>;
  hideElicitPredictions: Maybe<Scalars['Boolean']['output']>;
  hideFromPeopleDirectory: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageBook2019Ad: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageBook2020Ad: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageBookAd: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageFilterSettingsDesktop: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageMap: Maybe<Scalars['Boolean']['output']>;
  hideHomeRHS: Maybe<Scalars['Boolean']['output']>;
  hideIntercom: Maybe<Scalars['Boolean']['output']>;
  hideJobAdUntil: Maybe<Scalars['Date']['output']>;
  hideMeetupsPoke: Maybe<Scalars['Boolean']['output']>;
  hideNavigationSidebar: Maybe<Scalars['Boolean']['output']>;
  hidePostsRecommendations: Maybe<Scalars['Boolean']['output']>;
  hideSubscribePoke: Maybe<Scalars['Boolean']['output']>;
  hideSunshineSidebar: Maybe<Scalars['Boolean']['output']>;
  hideTaggingProgressBar: Maybe<Scalars['Boolean']['output']>;
  hideWalledGardenUI: Maybe<Scalars['Boolean']['output']>;
  howICanHelpOthers: Maybe<Revision>;
  howICanHelpOthers_latest: Maybe<Scalars['String']['output']>;
  howOthersCanHelpMe: Maybe<Revision>;
  howOthersCanHelpMe_latest: Maybe<Scalars['String']['output']>;
  htmlBio: Scalars['String']['output'];
  htmlMapMarkerText: Maybe<Scalars['String']['output']>;
  inactiveSurveyEmailSentAt: Maybe<Scalars['Date']['output']>;
  isAdmin: Maybe<Scalars['Boolean']['output']>;
  isReviewed: Maybe<Scalars['Boolean']['output']>;
  jobTitle: Maybe<Scalars['String']['output']>;
  karma: Maybe<Scalars['Float']['output']>;
  karmaChangeBatchStart: Maybe<Scalars['Date']['output']>;
  karmaChangeLastOpened: Maybe<Scalars['Date']['output']>;
  karmaChangeNotifierSettings: Maybe<Scalars['JSON']['output']>;
  karmaChanges: Maybe<KarmaChanges>;
  lastNotificationsCheck: Maybe<Scalars['Date']['output']>;
  lastUsedTimezone: Maybe<Scalars['String']['output']>;
  legacy: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  legacyId: Maybe<Scalars['String']['output']>;
  linkedinProfileURL: Maybe<Scalars['String']['output']>;
  location: Maybe<Scalars['String']['output']>;
  lwWikiImport: Maybe<Scalars['Boolean']['output']>;
  mapLocation: Maybe<Scalars['JSON']['output']>;
  mapLocationLatLng: Maybe<LatLng>;
  mapLocationSet: Maybe<Scalars['Boolean']['output']>;
  mapMarkerText: Maybe<Scalars['String']['output']>;
  markDownPostEditor: Maybe<Scalars['Boolean']['output']>;
  maxCommentCount: Maybe<Scalars['Float']['output']>;
  maxPostCount: Maybe<Scalars['Float']['output']>;
  moderationGuidelines: Maybe<Revision>;
  moderationGuidelines_latest: Maybe<Scalars['String']['output']>;
  moderationStyle: Maybe<Scalars['String']['output']>;
  moderatorActions: Maybe<Array<Maybe<ModeratorAction>>>;
  moderatorAssistance: Maybe<Scalars['Boolean']['output']>;
  mongoLocation: Maybe<Scalars['JSON']['output']>;
  nearbyEventsNotifications: Maybe<Scalars['Boolean']['output']>;
  nearbyEventsNotificationsLocation: Maybe<Scalars['JSON']['output']>;
  nearbyEventsNotificationsMongoLocation: Maybe<Scalars['JSON']['output']>;
  nearbyEventsNotificationsRadius: Maybe<Scalars['Float']['output']>;
  nearbyPeopleNotificationThreshold: Maybe<Scalars['Float']['output']>;
  needsReview: Maybe<Scalars['Boolean']['output']>;
  noCollapseCommentsFrontpage: Maybe<Scalars['Boolean']['output']>;
  noCollapseCommentsPosts: Maybe<Scalars['Boolean']['output']>;
  noExpandUnreadCommentsReview: Maybe<Scalars['Boolean']['output']>;
  noKibitz: Maybe<Scalars['Boolean']['output']>;
  noSingleLineComments: Maybe<Scalars['Boolean']['output']>;
  noindex: Maybe<Scalars['Boolean']['output']>;
  notificationAddedAsCoauthor: Maybe<Scalars['JSON']['output']>;
  notificationAlignmentSubmissionApproved: Maybe<Scalars['JSON']['output']>;
  notificationCommentsOnDraft: Maybe<Scalars['JSON']['output']>;
  notificationCommentsOnSubscribedPost: Maybe<Scalars['JSON']['output']>;
  notificationDebateCommentsOnSubscribedPost: Maybe<Scalars['JSON']['output']>;
  notificationDebateReplies: Maybe<Scalars['JSON']['output']>;
  notificationDialogueMatch: Maybe<Scalars['JSON']['output']>;
  notificationDialogueMessages: Maybe<Scalars['JSON']['output']>;
  notificationEventInRadius: Maybe<Scalars['JSON']['output']>;
  notificationGroupAdministration: Maybe<Scalars['JSON']['output']>;
  notificationKarmaPowersGained: Maybe<Scalars['JSON']['output']>;
  notificationNewDialogueChecks: Maybe<Scalars['JSON']['output']>;
  notificationNewMention: Maybe<Scalars['JSON']['output']>;
  notificationPostsInGroups: Maybe<Scalars['JSON']['output']>;
  notificationPostsNominatedReview: Maybe<Scalars['JSON']['output']>;
  notificationPrivateMessage: Maybe<Scalars['JSON']['output']>;
  notificationPublishedDialogueMessages: Maybe<Scalars['JSON']['output']>;
  notificationRSVPs: Maybe<Scalars['JSON']['output']>;
  notificationRepliesToMyComments: Maybe<Scalars['JSON']['output']>;
  notificationRepliesToSubscribedComments: Maybe<Scalars['JSON']['output']>;
  notificationSharedWithMe: Maybe<Scalars['JSON']['output']>;
  notificationShortformContent: Maybe<Scalars['JSON']['output']>;
  notificationSubforumUnread: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedSequencePost: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedTagPost: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedUserComment: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedUserPost: Maybe<Scalars['JSON']['output']>;
  notificationYourTurnMatchForm: Maybe<Scalars['JSON']['output']>;
  nullifyVotes: Maybe<Scalars['Boolean']['output']>;
  oldSlugs: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  optedInToDialogueFacilitation: Maybe<Scalars['Boolean']['output']>;
  optedOutOfSurveys: Maybe<Scalars['Boolean']['output']>;
  organization: Maybe<Scalars['String']['output']>;
  organizerOfGroupIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  organizerOfGroups: Array<Localgroup>;
  pagePath: Maybe<Scalars['String']['output']>;
  pageUrl: Maybe<Scalars['String']['output']>;
  partiallyReadSequences: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  paymentEmail: Maybe<Scalars['String']['output']>;
  paymentInfo: Maybe<Scalars['String']['output']>;
  permanentDeletionRequestedAt: Maybe<Scalars['Date']['output']>;
  petrovLaunchCodeDate: Maybe<Scalars['Date']['output']>;
  petrovOptOut: Maybe<Scalars['Boolean']['output']>;
  petrovPressedButtonDate: Maybe<Scalars['Date']['output']>;
  postCount: Maybe<Scalars['Float']['output']>;
  postGlossariesPinned: Maybe<Scalars['Boolean']['output']>;
  postingDisabled: Maybe<Scalars['Boolean']['output']>;
  posts: Maybe<Array<Maybe<Post>>>;
  previousDisplayName: Maybe<Scalars['String']['output']>;
  profileImageId: Maybe<Scalars['String']['output']>;
  profileTagIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  profileTags: Array<Tag>;
  profileUpdatedAt: Maybe<Scalars['Date']['output']>;
  programParticipation: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  rateLimitNextAbleToComment: Maybe<Scalars['JSON']['output']>;
  rateLimitNextAbleToPost: Maybe<Scalars['JSON']['output']>;
  reactPaletteStyle: Maybe<Scalars['String']['output']>;
  recentKarmaInfo: Maybe<Scalars['JSON']['output']>;
  recommendationSettings: Maybe<Scalars['JSON']['output']>;
  reenableDraftJs: Maybe<Scalars['Boolean']['output']>;
  revealChecksToAdmins: Maybe<Scalars['Boolean']['output']>;
  reviewForAlignmentForumUserId: Maybe<Scalars['String']['output']>;
  reviewVoteCount: Scalars['Int']['output'];
  reviewVotesQuadratic: Maybe<Scalars['Boolean']['output']>;
  reviewVotesQuadratic2019: Maybe<Scalars['Boolean']['output']>;
  reviewVotesQuadratic2020: Maybe<Scalars['Boolean']['output']>;
  reviewedAt: Maybe<Scalars['Date']['output']>;
  reviewedByUser: Maybe<User>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  sequenceCount: Maybe<Scalars['Float']['output']>;
  sequenceDraftCount: Maybe<Scalars['Float']['output']>;
  services: Maybe<Scalars['JSON']['output']>;
  shortformFeed: Maybe<Post>;
  shortformFeedId: Maybe<Scalars['String']['output']>;
  showCommunityInRecentDiscussion: Maybe<Scalars['Boolean']['output']>;
  showDialoguesList: Maybe<Scalars['Boolean']['output']>;
  showHideKarmaOption: Maybe<Scalars['Boolean']['output']>;
  showMatches: Maybe<Scalars['Boolean']['output']>;
  showMyDialogues: Maybe<Scalars['Boolean']['output']>;
  showPostAuthorCard: Maybe<Scalars['Boolean']['output']>;
  showRecommendedPartners: Maybe<Scalars['Boolean']['output']>;
  signUpReCaptchaRating: Maybe<Scalars['Float']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  smallDownvoteCount: Maybe<Scalars['Float']['output']>;
  smallDownvoteReceivedCount: Maybe<Scalars['Float']['output']>;
  smallUpvoteCount: Maybe<Scalars['Float']['output']>;
  smallUpvoteReceivedCount: Maybe<Scalars['Float']['output']>;
  snoozedUntilContentCount: Maybe<Scalars['Float']['output']>;
  sortDraftsBy: Maybe<Scalars['String']['output']>;
  spamRiskScore: Scalars['Float']['output'];
  subforumPreferredLayout: Maybe<Scalars['String']['output']>;
  subscribedToDigest: Maybe<Scalars['Boolean']['output']>;
  sunshineFlagged: Maybe<Scalars['Boolean']['output']>;
  sunshineNotes: Maybe<Scalars['String']['output']>;
  sunshineSnoozed: Maybe<Scalars['Boolean']['output']>;
  tagRevisionCount: Maybe<Scalars['Float']['output']>;
  taggingDashboardCollapsed: Maybe<Scalars['Boolean']['output']>;
  theme: Maybe<Scalars['JSON']['output']>;
  twitterProfileURL: Maybe<Scalars['String']['output']>;
  twitterProfileURLAdmin: Maybe<Scalars['String']['output']>;
  unsubscribeFromAll: Maybe<Scalars['Boolean']['output']>;
  userSurveyEmailSentAt: Maybe<Scalars['Date']['output']>;
  username: Maybe<Scalars['String']['output']>;
  usernameUnset: Maybe<Scalars['Boolean']['output']>;
  usersContactedBeforeReview: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  viewUnreviewedComments: Maybe<Scalars['Boolean']['output']>;
  voteBanned: Maybe<Scalars['Boolean']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  voteReceivedCount: Maybe<Scalars['Float']['output']>;
  walledGardenInvite: Maybe<Scalars['Boolean']['output']>;
  walledGardenPortalOnboarded: Maybe<Scalars['Boolean']['output']>;
  website: Maybe<Scalars['String']['output']>;
  whenConfirmationEmailSent: Maybe<Scalars['Date']['output']>;
};


export type UserBiographyArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type UserHowICanHelpOthersArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type UserHowOthersCanHelpMeArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type UserKarmaChangesArgs = {
  endDate: InputMaybe<Scalars['Date']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
};


export type UserModerationGuidelinesArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type UserPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type UserRateLimitNextAbleToCommentArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
};


export type UserRateLimitNextAbleToPostArgs = {
  eventForm: InputMaybe<Scalars['Boolean']['input']>;
};

export type UserActivity = {
  __typename?: 'UserActivity';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
};

export enum UserActivityOrderByInput {
  Foobar = 'foobar'
}

export type UserActivityOutput = {
  __typename?: 'UserActivityOutput';
  data: Maybe<UserActivity>;
};

export type UserActivitySelectorInput = {
  AND: InputMaybe<Array<InputMaybe<UserActivitySelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<UserActivitySelectorInput>>>;
};

export type UserActivitySelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type UserCoreTagReads = {
  __typename?: 'UserCoreTagReads';
  tagId: Maybe<Scalars['String']['output']>;
  userReadCount: Maybe<Scalars['Int']['output']>;
};

export type UserDialogueUsefulData = {
  __typename?: 'UserDialogueUsefulData';
  activeDialogueMatchSeekers: Maybe<Array<Maybe<User>>>;
  dialogueUsers: Maybe<Array<Maybe<User>>>;
  topUsers: Maybe<Array<Maybe<UpvotedUser>>>;
};

export type UserEagDetail = {
  __typename?: 'UserEAGDetail';
  _id: Scalars['String']['output'];
  careerStage: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  countryOrRegion: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  experiencedIn: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  interestedIn: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  nearestCity: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
  willingnessToRelocate: Maybe<Scalars['JSON']['output']>;
};

export enum UserEagDetailOrderByInput {
  Foobar = 'foobar'
}

export type UserEagDetailOutput = {
  __typename?: 'UserEAGDetailOutput';
  data: Maybe<UserEagDetail>;
};

export type UserEagDetailSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<UserEagDetailSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<UserEagDetailSelectorInput>>>;
};

export type UserEagDetailSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type UserJobAd = {
  __typename?: 'UserJobAd';
  _id: Scalars['String']['output'];
  adState: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  jobName: Maybe<Scalars['String']['output']>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  reminderSetAt: Maybe<Scalars['Date']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum UserJobAdOrderByInput {
  Foobar = 'foobar'
}

export type UserJobAdOutput = {
  __typename?: 'UserJobAdOutput';
  data: Maybe<UserJobAd>;
};

export type UserJobAdSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<UserJobAdSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<UserJobAdSelectorInput>>>;
};

export type UserJobAdSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type UserLikingTag = {
  __typename?: 'UserLikingTag';
  _id: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
};

export type UserMostValuablePost = {
  __typename?: 'UserMostValuablePost';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  post: Maybe<Post>;
  postId: Maybe<Scalars['String']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum UserMostValuablePostOrderByInput {
  Foobar = 'foobar'
}

export type UserMostValuablePostOutput = {
  __typename?: 'UserMostValuablePostOutput';
  data: Maybe<UserMostValuablePost>;
};

export type UserMostValuablePostSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<UserMostValuablePostSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<UserMostValuablePostSelectorInput>>>;
};

export type UserMostValuablePostSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export enum UserOrderByInput {
  Foobar = 'foobar'
}

export type UserOutput = {
  __typename?: 'UserOutput';
  data: Maybe<User>;
};

export type UserRateLimit = {
  __typename?: 'UserRateLimit';
  _id: Scalars['String']['output'];
  actionsPerInterval: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  endedAt: Maybe<Scalars['Date']['output']>;
  intervalLength: Maybe<Scalars['Float']['output']>;
  intervalUnit: Maybe<Scalars['String']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  type: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum UserRateLimitOrderByInput {
  Foobar = 'foobar'
}

export type UserRateLimitOutput = {
  __typename?: 'UserRateLimitOutput';
  data: Maybe<UserRateLimit>;
};

export type UserRateLimitSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<UserRateLimitSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<UserRateLimitSelectorInput>>>;
};

export type UserRateLimitSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type UserReadHistoryResult = {
  __typename?: 'UserReadHistoryResult';
  posts: Maybe<Array<Post>>;
};

export type UserSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<UserSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<UserSelectorInput>>>;
};

export type UserSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type UserTagRel = {
  __typename?: 'UserTagRel';
  _id: Scalars['String']['output'];
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  subforumEmailNotifications: Maybe<Scalars['Boolean']['output']>;
  subforumHideIntroPost: Maybe<Scalars['Boolean']['output']>;
  subforumShowUnreadInSidebar: Maybe<Scalars['Boolean']['output']>;
  tag: Maybe<Tag>;
  tagId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userId: Maybe<Scalars['String']['output']>;
};

export enum UserTagRelOrderByInput {
  Foobar = 'foobar'
}

export type UserTagRelOutput = {
  __typename?: 'UserTagRelOutput';
  data: Maybe<UserTagRel>;
};

export type UserTagRelSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<UserTagRelSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<UserTagRelSelectorInput>>>;
};

export type UserTagRelSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type VertexRecommendedPost = {
  __typename?: 'VertexRecommendedPost';
  attributionId: Maybe<Scalars['String']['output']>;
  post: Post;
};

export type Vote = {
  __typename?: 'Vote';
  _id: Scalars['String']['output'];
  afPower: Maybe<Scalars['Float']['output']>;
  authorId: Maybe<Scalars['String']['output']>;
  authorIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  cancelled: Maybe<Scalars['Boolean']['output']>;
  collectionName: Maybe<Scalars['String']['output']>;
  comment: Maybe<Comment>;
  createdAt: Maybe<Scalars['Date']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  documentIsAf: Maybe<Scalars['Boolean']['output']>;
  extendedVoteType: Maybe<Scalars['JSON']['output']>;
  isUnvote: Maybe<Scalars['Boolean']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  post: Maybe<Post>;
  power: Maybe<Scalars['Float']['output']>;
  schemaVersion: Maybe<Scalars['Float']['output']>;
  silenceNotification: Maybe<Scalars['Boolean']['output']>;
  tagRel: Maybe<TagRel>;
  userId: Maybe<Scalars['String']['output']>;
  voteType: Maybe<Scalars['String']['output']>;
  votedAt: Maybe<Scalars['Date']['output']>;
};

export enum VoteOrderByInput {
  Foobar = 'foobar'
}

export type VoteOutput = {
  __typename?: 'VoteOutput';
  data: Maybe<Vote>;
};

export type VoteResultComment = {
  __typename?: 'VoteResultComment';
  document: Comment;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultElectionCandidate = {
  __typename?: 'VoteResultElectionCandidate';
  document: ElectionCandidate;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultMultiDocument = {
  __typename?: 'VoteResultMultiDocument';
  document: MultiDocument;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultPost = {
  __typename?: 'VoteResultPost';
  document: Post;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultRevision = {
  __typename?: 'VoteResultRevision';
  document: Revision;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultTag = {
  __typename?: 'VoteResultTag';
  document: Tag;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultTagRel = {
  __typename?: 'VoteResultTagRel';
  document: TagRel;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteSelectorInput = {
  AND: InputMaybe<Array<InputMaybe<VoteSelectorInput>>>;
  OR: InputMaybe<Array<InputMaybe<VoteSelectorInput>>>;
};

export type VoteSelectorUniqueInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

export type WrappedDataByYear = {
  __typename?: 'WrappedDataByYear';
  authorPercentile: Maybe<Scalars['Float']['output']>;
  combinedKarmaVals: Maybe<Array<Maybe<CombinedKarmaVals>>>;
  commentCount: Maybe<Scalars['Int']['output']>;
  commenterPercentile: Maybe<Scalars['Float']['output']>;
  daysVisited: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  engagementPercentile: Maybe<Scalars['Float']['output']>;
  karmaChange: Maybe<Scalars['Int']['output']>;
  mostReadAuthors: Maybe<Array<Maybe<MostReadAuthor>>>;
  mostReadTopics: Maybe<Array<Maybe<MostReadTopic>>>;
  mostReceivedReacts: Maybe<Array<Maybe<MostReceivedReact>>>;
  personality: Scalars['String']['output'];
  postCount: Maybe<Scalars['Int']['output']>;
  postsReadCount: Maybe<Scalars['Int']['output']>;
  relativeMostReadCoreTopics: Maybe<Array<Maybe<TagReadLikelihoodRatio>>>;
  shortformCount: Maybe<Scalars['Int']['output']>;
  shortformPercentile: Maybe<Scalars['Float']['output']>;
  topComment: Maybe<TopComment>;
  topPosts: Maybe<Array<Maybe<Post>>>;
  topShortform: Maybe<Comment>;
  totalSeconds: Maybe<Scalars['Int']['output']>;
};
