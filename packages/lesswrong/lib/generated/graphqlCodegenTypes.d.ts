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
  JSON: { input: any; output: any; }
  Date: { input: any; output: any; }
  ContentTypeData: { input: any; output: any; }
};

export type AdvisorRequest = {
  __typename?: 'AdvisorRequest';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  interestedInMetaculus: Maybe<Scalars['Boolean']['output']>;
  jobAds: Maybe<Scalars['JSON']['output']>;
};

export type DeleteAdvisorRequestInput = {
  selector: AdvisorRequestSelectorUniqueInput;
};

export type SingleAdvisorRequestInput = {
  selector: InputMaybe<AdvisorRequestSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiAdvisorRequestInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<AdvisorRequestSelectorInput>;
  orderBy: InputMaybe<AdvisorRequestOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleAdvisorRequestOutput = {
  __typename?: 'SingleAdvisorRequestOutput';
  result: Maybe<AdvisorRequest>;
};

export type MultiAdvisorRequestOutput = {
  __typename?: 'MultiAdvisorRequestOutput';
  results: Maybe<Array<Maybe<AdvisorRequest>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type AdvisorRequestOutput = {
  __typename?: 'AdvisorRequestOutput';
  data: Maybe<AdvisorRequest>;
};

export type CreateAdvisorRequestInput = {
  data: CreateAdvisorRequestDataInput;
};

export type CreateAdvisorRequestDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  interestedInMetaculus: InputMaybe<Scalars['Boolean']['input']>;
  jobAds: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateAdvisorRequestInput = {
  selector: AdvisorRequestSelectorUniqueInput;
  data: UpdateAdvisorRequestDataInput;
};

export type UpsertAdvisorRequestInput = {
  selector: AdvisorRequestSelectorUniqueInput;
  data: UpdateAdvisorRequestDataInput;
};

export type UpdateAdvisorRequestDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  interestedInMetaculus: InputMaybe<Scalars['Boolean']['input']>;
  jobAds: InputMaybe<Scalars['JSON']['input']>;
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

export enum AdvisorRequestOrderByInput {
  Foobar = 'foobar'
}

export type ArbitalCaches = {
  __typename?: 'ArbitalCaches';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteArbitalCachesInput = {
  selector: ArbitalCachesSelectorUniqueInput;
};

export type SingleArbitalCachesInput = {
  selector: InputMaybe<ArbitalCachesSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiArbitalCachesInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ArbitalCachesSelectorInput>;
  orderBy: InputMaybe<ArbitalCachesOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleArbitalCachesOutput = {
  __typename?: 'SingleArbitalCachesOutput';
  result: Maybe<ArbitalCaches>;
};

export type MultiArbitalCachesOutput = {
  __typename?: 'MultiArbitalCachesOutput';
  results: Maybe<Array<Maybe<ArbitalCaches>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ArbitalCachesOutput = {
  __typename?: 'ArbitalCachesOutput';
  data: Maybe<ArbitalCaches>;
};

export type CreateArbitalCachesInput = {
  data: CreateArbitalCachesDataInput;
};

export type CreateArbitalCachesDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateArbitalCachesInput = {
  selector: ArbitalCachesSelectorUniqueInput;
  data: UpdateArbitalCachesDataInput;
};

export type UpsertArbitalCachesInput = {
  selector: ArbitalCachesSelectorUniqueInput;
  data: UpdateArbitalCachesDataInput;
};

export type UpdateArbitalCachesDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum ArbitalCachesOrderByInput {
  Foobar = 'foobar'
}

export type ArbitalTagContentRel = {
  __typename?: 'ArbitalTagContentRel';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  parentDocumentId: Maybe<Scalars['String']['output']>;
  childDocumentId: Maybe<Scalars['String']['output']>;
  parentCollectionName: Maybe<Scalars['String']['output']>;
  childCollectionName: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
  level: Maybe<Scalars['Float']['output']>;
  isStrong: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteArbitalTagContentRelInput = {
  selector: ArbitalTagContentRelSelectorUniqueInput;
};

export type SingleArbitalTagContentRelInput = {
  selector: InputMaybe<ArbitalTagContentRelSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiArbitalTagContentRelInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ArbitalTagContentRelSelectorInput>;
  orderBy: InputMaybe<ArbitalTagContentRelOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleArbitalTagContentRelOutput = {
  __typename?: 'SingleArbitalTagContentRelOutput';
  result: Maybe<ArbitalTagContentRel>;
};

export type MultiArbitalTagContentRelOutput = {
  __typename?: 'MultiArbitalTagContentRelOutput';
  results: Maybe<Array<Maybe<ArbitalTagContentRel>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ArbitalTagContentRelOutput = {
  __typename?: 'ArbitalTagContentRelOutput';
  data: Maybe<ArbitalTagContentRel>;
};

export type CreateArbitalTagContentRelInput = {
  data: CreateArbitalTagContentRelDataInput;
};

export type CreateArbitalTagContentRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  parentDocumentId: Scalars['String']['input'];
  childDocumentId: Scalars['String']['input'];
  parentCollectionName: Scalars['String']['input'];
  childCollectionName: Scalars['String']['input'];
  type: Scalars['String']['input'];
  level: Scalars['Float']['input'];
  isStrong: Scalars['Boolean']['input'];
};

export type UpdateArbitalTagContentRelInput = {
  selector: ArbitalTagContentRelSelectorUniqueInput;
  data: UpdateArbitalTagContentRelDataInput;
};

export type UpsertArbitalTagContentRelInput = {
  selector: ArbitalTagContentRelSelectorUniqueInput;
  data: UpdateArbitalTagContentRelDataInput;
};

export type UpdateArbitalTagContentRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum ArbitalTagContentRelOrderByInput {
  Foobar = 'foobar'
}

export type Ban = {
  __typename?: 'Ban';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  expirationDate: Maybe<Scalars['Date']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  ip: Maybe<Scalars['String']['output']>;
  reason: Maybe<Scalars['String']['output']>;
  comment: Maybe<Scalars['String']['output']>;
  properties: Maybe<Scalars['JSON']['output']>;
};

export type DeleteBanInput = {
  selector: BanSelectorUniqueInput;
};

export type SingleBanInput = {
  selector: InputMaybe<BanSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiBanInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<BanSelectorInput>;
  orderBy: InputMaybe<BanOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleBanOutput = {
  __typename?: 'SingleBanOutput';
  result: Maybe<Ban>;
};

export type MultiBanOutput = {
  __typename?: 'MultiBanOutput';
  results: Maybe<Array<Maybe<Ban>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type BanOutput = {
  __typename?: 'BanOutput';
  data: Maybe<Ban>;
};

export type CreateBanInput = {
  data: CreateBanDataInput;
};

export type CreateBanDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  expirationDate: Scalars['Date']['input'];
  userId: InputMaybe<Scalars['String']['input']>;
  ip: InputMaybe<Scalars['String']['input']>;
  reason: InputMaybe<Scalars['String']['input']>;
  comment: InputMaybe<Scalars['String']['input']>;
  properties: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateBanInput = {
  selector: BanSelectorUniqueInput;
  data: UpdateBanDataInput;
};

export type UpsertBanInput = {
  selector: BanSelectorUniqueInput;
  data: UpdateBanDataInput;
};

export type UpdateBanDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  expirationDate: InputMaybe<Scalars['Date']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  ip: InputMaybe<Scalars['String']['input']>;
  reason: InputMaybe<Scalars['String']['input']>;
  comment: InputMaybe<Scalars['String']['input']>;
  properties: InputMaybe<Scalars['JSON']['input']>;
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

export enum BanOrderByInput {
  Foobar = 'foobar'
}

export type Book = {
  __typename?: 'Book';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
  title: Maybe<Scalars['String']['output']>;
  subtitle: Maybe<Scalars['String']['output']>;
  tocTitle: Maybe<Scalars['String']['output']>;
  collectionId: Maybe<Scalars['String']['output']>;
  number: Maybe<Scalars['Float']['output']>;
  postIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  posts: Array<Post>;
  sequenceIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  sequences: Array<Sequence>;
  displaySequencesAsGrid: Maybe<Scalars['Boolean']['output']>;
  hideProgressBar: Maybe<Scalars['Boolean']['output']>;
  showChapters: Maybe<Scalars['Boolean']['output']>;
};


export type BookContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteBookInput = {
  selector: BookSelectorUniqueInput;
};

export type SingleBookInput = {
  selector: InputMaybe<BookSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiBookInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<BookSelectorInput>;
  orderBy: InputMaybe<BookOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleBookOutput = {
  __typename?: 'SingleBookOutput';
  result: Maybe<Book>;
};

export type MultiBookOutput = {
  __typename?: 'MultiBookOutput';
  results: Maybe<Array<Maybe<Book>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type BookOutput = {
  __typename?: 'BookOutput';
  data: Maybe<Book>;
};

export type CreateBookInput = {
  data: CreateBookDataInput;
};

export type CreateBookDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  tocTitle: InputMaybe<Scalars['String']['input']>;
  collectionId: Scalars['String']['input'];
  number: InputMaybe<Scalars['Float']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sequenceIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  displaySequencesAsGrid: InputMaybe<Scalars['Boolean']['input']>;
  hideProgressBar: InputMaybe<Scalars['Boolean']['input']>;
  showChapters: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateBookInput = {
  selector: BookSelectorUniqueInput;
  data: UpdateBookDataInput;
};

export type UpsertBookInput = {
  selector: BookSelectorUniqueInput;
  data: UpdateBookDataInput;
};

export type UpdateBookDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  tocTitle: InputMaybe<Scalars['String']['input']>;
  collectionId: InputMaybe<Scalars['String']['input']>;
  number: InputMaybe<Scalars['Float']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sequenceIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  displaySequencesAsGrid: InputMaybe<Scalars['Boolean']['input']>;
  hideProgressBar: InputMaybe<Scalars['Boolean']['input']>;
  showChapters: InputMaybe<Scalars['Boolean']['input']>;
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

export enum BookOrderByInput {
  Foobar = 'foobar'
}

export type Chapter = {
  __typename?: 'Chapter';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  subtitle: Maybe<Scalars['String']['output']>;
  number: Maybe<Scalars['Float']['output']>;
  sequenceId: Maybe<Scalars['String']['output']>;
  sequence: Sequence;
  postIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  posts: Array<Post>;
};


export type ChapterContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteChapterInput = {
  selector: ChapterSelectorUniqueInput;
};

export type SingleChapterInput = {
  selector: InputMaybe<ChapterSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiChapterInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ChapterSelectorInput>;
  orderBy: InputMaybe<ChapterOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleChapterOutput = {
  __typename?: 'SingleChapterOutput';
  result: Maybe<Chapter>;
};

export type MultiChapterOutput = {
  __typename?: 'MultiChapterOutput';
  results: Maybe<Array<Maybe<Chapter>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ChapterOutput = {
  __typename?: 'ChapterOutput';
  data: Maybe<Chapter>;
};

export type CreateChapterInput = {
  data: CreateChapterDataInput;
};

export type CreateChapterDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  number: InputMaybe<Scalars['Float']['input']>;
  sequenceId: InputMaybe<Scalars['String']['input']>;
  postIds: Array<InputMaybe<Scalars['String']['input']>>;
};

export type UpdateChapterInput = {
  selector: ChapterSelectorUniqueInput;
  data: UpdateChapterDataInput;
};

export type UpsertChapterInput = {
  selector: ChapterSelectorUniqueInput;
  data: UpdateChapterDataInput;
};

export type UpdateChapterDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  number: InputMaybe<Scalars['Float']['input']>;
  sequenceId: InputMaybe<Scalars['String']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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

export enum ChapterOrderByInput {
  Foobar = 'foobar'
}

export type CkEditorUserSession = {
  __typename?: 'CkEditorUserSession';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  endedAt: Maybe<Scalars['Date']['output']>;
  endedBy: Maybe<Scalars['String']['output']>;
};

export type DeleteCkEditorUserSessionInput = {
  selector: CkEditorUserSessionSelectorUniqueInput;
};

export type SingleCkEditorUserSessionInput = {
  selector: InputMaybe<CkEditorUserSessionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiCkEditorUserSessionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CkEditorUserSessionSelectorInput>;
  orderBy: InputMaybe<CkEditorUserSessionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleCkEditorUserSessionOutput = {
  __typename?: 'SingleCkEditorUserSessionOutput';
  result: Maybe<CkEditorUserSession>;
};

export type MultiCkEditorUserSessionOutput = {
  __typename?: 'MultiCkEditorUserSessionOutput';
  results: Maybe<Array<Maybe<CkEditorUserSession>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type CkEditorUserSessionOutput = {
  __typename?: 'CkEditorUserSessionOutput';
  data: Maybe<CkEditorUserSession>;
};

export type CreateCkEditorUserSessionInput = {
  data: CreateCkEditorUserSessionDataInput;
};

export type CreateCkEditorUserSessionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  documentId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
  endedAt: InputMaybe<Scalars['Date']['input']>;
  endedBy: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCkEditorUserSessionInput = {
  selector: CkEditorUserSessionSelectorUniqueInput;
  data: UpdateCkEditorUserSessionDataInput;
};

export type UpsertCkEditorUserSessionInput = {
  selector: CkEditorUserSessionSelectorUniqueInput;
  data: UpdateCkEditorUserSessionDataInput;
};

export type UpdateCkEditorUserSessionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  endedAt: InputMaybe<Scalars['Date']['input']>;
  endedBy: InputMaybe<Scalars['String']['input']>;
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

export enum CkEditorUserSessionOrderByInput {
  Foobar = 'foobar'
}

export type ClientId = {
  __typename?: 'ClientId';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  clientId: Maybe<Scalars['String']['output']>;
  firstSeenReferrer: Maybe<Scalars['String']['output']>;
  firstSeenLandingPage: Maybe<Scalars['String']['output']>;
  userIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  users: Array<User>;
  invalidated: Maybe<Scalars['Boolean']['output']>;
  lastSeenAt: Maybe<Scalars['Date']['output']>;
  timesSeen: Maybe<Scalars['Float']['output']>;
};

export type DeleteClientIdInput = {
  selector: ClientIdSelectorUniqueInput;
};

export type SingleClientIdInput = {
  selector: InputMaybe<ClientIdSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiClientIdInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ClientIdSelectorInput>;
  orderBy: InputMaybe<ClientIdOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleClientIdOutput = {
  __typename?: 'SingleClientIdOutput';
  result: Maybe<ClientId>;
};

export type MultiClientIdOutput = {
  __typename?: 'MultiClientIdOutput';
  results: Maybe<Array<Maybe<ClientId>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ClientIdOutput = {
  __typename?: 'ClientIdOutput';
  data: Maybe<ClientId>;
};

export type CreateClientIdInput = {
  data: CreateClientIdDataInput;
};

export type CreateClientIdDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateClientIdInput = {
  selector: ClientIdSelectorUniqueInput;
  data: UpdateClientIdDataInput;
};

export type UpsertClientIdInput = {
  selector: ClientIdSelectorUniqueInput;
  data: UpdateClientIdDataInput;
};

export type UpdateClientIdDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum ClientIdOrderByInput {
  Foobar = 'foobar'
}

export type Collection = {
  __typename?: 'Collection';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  title: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  books: Maybe<Array<Maybe<Book>>>;
  postsCount: Scalars['Int']['output'];
  readPostsCount: Scalars['Int']['output'];
  gridImageId: Maybe<Scalars['String']['output']>;
  firstPageLink: Maybe<Scalars['String']['output']>;
  hideStartReadingButton: Maybe<Scalars['Boolean']['output']>;
  noindex: Maybe<Scalars['Boolean']['output']>;
};


export type CollectionContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteCollectionInput = {
  selector: CollectionSelectorUniqueInput;
};

export type SingleCollectionInput = {
  selector: InputMaybe<CollectionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiCollectionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CollectionSelectorInput>;
  orderBy: InputMaybe<CollectionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleCollectionOutput = {
  __typename?: 'SingleCollectionOutput';
  result: Maybe<Collection>;
};

export type MultiCollectionOutput = {
  __typename?: 'MultiCollectionOutput';
  results: Maybe<Array<Maybe<Collection>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type CollectionOutput = {
  __typename?: 'CollectionOutput';
  data: Maybe<Collection>;
};

export type CreateCollectionInput = {
  data: CreateCollectionDataInput;
};

export type CreateCollectionDataInput = {
  createdAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  gridImageId: InputMaybe<Scalars['String']['input']>;
  firstPageLink: InputMaybe<Scalars['String']['input']>;
  hideStartReadingButton: InputMaybe<Scalars['Boolean']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateCollectionInput = {
  selector: CollectionSelectorUniqueInput;
  data: UpdateCollectionDataInput;
};

export type UpsertCollectionInput = {
  selector: CollectionSelectorUniqueInput;
  data: UpdateCollectionDataInput;
};

export type UpdateCollectionDataInput = {
  createdAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  gridImageId: InputMaybe<Scalars['String']['input']>;
  firstPageLink: InputMaybe<Scalars['String']['input']>;
  hideStartReadingButton: InputMaybe<Scalars['Boolean']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
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

export enum CollectionOrderByInput {
  Foobar = 'foobar'
}

export type CommentModeratorAction = {
  __typename?: 'CommentModeratorAction';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  commentId: Maybe<Scalars['String']['output']>;
  comment: Comment;
  type: Maybe<Scalars['String']['output']>;
  endedAt: Maybe<Scalars['Date']['output']>;
  active: Scalars['Boolean']['output'];
};

export type DeleteCommentModeratorActionInput = {
  selector: CommentModeratorActionSelectorUniqueInput;
};

export type SingleCommentModeratorActionInput = {
  selector: InputMaybe<CommentModeratorActionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiCommentModeratorActionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CommentModeratorActionSelectorInput>;
  orderBy: InputMaybe<CommentModeratorActionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleCommentModeratorActionOutput = {
  __typename?: 'SingleCommentModeratorActionOutput';
  result: Maybe<CommentModeratorAction>;
};

export type MultiCommentModeratorActionOutput = {
  __typename?: 'MultiCommentModeratorActionOutput';
  results: Maybe<Array<Maybe<CommentModeratorAction>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type CommentModeratorActionOutput = {
  __typename?: 'CommentModeratorActionOutput';
  data: Maybe<CommentModeratorAction>;
};

export type CreateCommentModeratorActionInput = {
  data: CreateCommentModeratorActionDataInput;
};

export type CreateCommentModeratorActionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  commentId: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
  endedAt: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateCommentModeratorActionInput = {
  selector: CommentModeratorActionSelectorUniqueInput;
  data: UpdateCommentModeratorActionDataInput;
};

export type UpsertCommentModeratorActionInput = {
  selector: CommentModeratorActionSelectorUniqueInput;
  data: UpdateCommentModeratorActionDataInput;
};

export type UpdateCommentModeratorActionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  commentId: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
  endedAt: InputMaybe<Scalars['Date']['input']>;
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

export enum CommentModeratorActionOrderByInput {
  Foobar = 'foobar'
}

export type Comment = {
  __typename?: 'Comment';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  parentCommentId: Maybe<Scalars['String']['output']>;
  parentComment: Maybe<Comment>;
  topLevelCommentId: Maybe<Scalars['String']['output']>;
  topLevelComment: Maybe<Comment>;
  postedAt: Maybe<Scalars['Date']['output']>;
  lastEditedAt: Maybe<Scalars['Date']['output']>;
  author: Maybe<Scalars['String']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  post: Maybe<Post>;
  tagId: Maybe<Scalars['String']['output']>;
  tag: Maybe<Tag>;
  forumEventId: Maybe<Scalars['String']['output']>;
  forumEvent: Maybe<ForumEvent>;
  forumEventMetadata: Maybe<Scalars['JSON']['output']>;
  tagCommentType: Maybe<Scalars['String']['output']>;
  subforumStickyPriority: Maybe<Scalars['Float']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  userIP: Maybe<Scalars['String']['output']>;
  userAgent: Maybe<Scalars['String']['output']>;
  referrer: Maybe<Scalars['String']['output']>;
  authorIsUnreviewed: Maybe<Scalars['Boolean']['output']>;
  pageUrl: Maybe<Scalars['String']['output']>;
  pageUrlRelative: Maybe<Scalars['String']['output']>;
  answer: Maybe<Scalars['Boolean']['output']>;
  parentAnswerId: Maybe<Scalars['String']['output']>;
  parentAnswer: Maybe<Comment>;
  directChildrenCount: Maybe<Scalars['Float']['output']>;
  descendentCount: Maybe<Scalars['Float']['output']>;
  latestChildren: Maybe<Array<Maybe<Comment>>>;
  shortform: Maybe<Scalars['Boolean']['output']>;
  shortformFrontpage: Maybe<Scalars['Boolean']['output']>;
  nominatedForReview: Maybe<Scalars['String']['output']>;
  reviewingForReview: Maybe<Scalars['String']['output']>;
  lastSubthreadActivity: Maybe<Scalars['Date']['output']>;
  postVersion: Maybe<Scalars['String']['output']>;
  promoted: Maybe<Scalars['Boolean']['output']>;
  promotedByUserId: Maybe<Scalars['String']['output']>;
  promotedByUser: Maybe<User>;
  promotedAt: Maybe<Scalars['Date']['output']>;
  hideKarma: Maybe<Scalars['Boolean']['output']>;
  wordCount: Maybe<Scalars['Int']['output']>;
  htmlBody: Maybe<Scalars['String']['output']>;
  votingSystem: Scalars['String']['output'];
  legacy: Maybe<Scalars['Boolean']['output']>;
  legacyId: Maybe<Scalars['String']['output']>;
  legacyPoll: Maybe<Scalars['Boolean']['output']>;
  legacyParentId: Maybe<Scalars['String']['output']>;
  retracted: Maybe<Scalars['Boolean']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  deletedPublic: Maybe<Scalars['Boolean']['output']>;
  deletedReason: Maybe<Scalars['String']['output']>;
  deletedDate: Maybe<Scalars['Date']['output']>;
  deletedByUserId: Maybe<Scalars['String']['output']>;
  deletedByUser: Maybe<User>;
  spam: Maybe<Scalars['Boolean']['output']>;
  repliesBlockedUntil: Maybe<Scalars['Date']['output']>;
  needsReview: Maybe<Scalars['Boolean']['output']>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  reviewedByUser: Maybe<User>;
  hideAuthor: Maybe<Scalars['Boolean']['output']>;
  moderatorHat: Maybe<Scalars['Boolean']['output']>;
  hideModeratorHat: Maybe<Scalars['Boolean']['output']>;
  isPinnedOnProfile: Maybe<Scalars['Boolean']['output']>;
  title: Maybe<Scalars['String']['output']>;
  relevantTagIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  relevantTags: Array<Tag>;
  debateResponse: Maybe<Scalars['Boolean']['output']>;
  rejected: Maybe<Scalars['Boolean']['output']>;
  modGPTAnalysis: Maybe<Scalars['String']['output']>;
  modGPTRecommendation: Maybe<Scalars['String']['output']>;
  rejectedReason: Maybe<Scalars['String']['output']>;
  rejectedByUserId: Maybe<Scalars['String']['output']>;
  rejectedByUser: Maybe<User>;
  emojiReactors: Maybe<Scalars['JSON']['output']>;
  af: Maybe<Scalars['Boolean']['output']>;
  suggestForAlignmentUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  suggestForAlignmentUsers: Array<User>;
  reviewForAlignmentUserId: Maybe<Scalars['String']['output']>;
  afDate: Maybe<Scalars['Date']['output']>;
  moveToAlignmentUserId: Maybe<Scalars['String']['output']>;
  moveToAlignmentUser: Maybe<User>;
  agentFoundationsId: Maybe<Scalars['String']['output']>;
  originalDialogueId: Maybe<Scalars['String']['output']>;
  originalDialogue: Maybe<Post>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  allVotes: Maybe<Array<Maybe<Vote>>>;
  voteCount: Maybe<Scalars['Float']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
};


export type CommentContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteCommentInput = {
  selector: CommentSelectorUniqueInput;
};

export type SingleCommentInput = {
  selector: InputMaybe<CommentSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiCommentInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CommentSelectorInput>;
  orderBy: InputMaybe<CommentOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleCommentOutput = {
  __typename?: 'SingleCommentOutput';
  result: Maybe<Comment>;
};

export type MultiCommentOutput = {
  __typename?: 'MultiCommentOutput';
  results: Maybe<Array<Maybe<Comment>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type CommentOutput = {
  __typename?: 'CommentOutput';
  data: Maybe<Comment>;
};

export type CreateCommentInput = {
  data: CreateCommentDataInput;
};

export type CreateCommentDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  parentCommentId: InputMaybe<Scalars['String']['input']>;
  topLevelCommentId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  tagId: InputMaybe<Scalars['String']['input']>;
  forumEventId: InputMaybe<Scalars['String']['input']>;
  forumEventMetadata: InputMaybe<Scalars['JSON']['input']>;
  tagCommentType: InputMaybe<Scalars['String']['input']>;
  subforumStickyPriority: InputMaybe<Scalars['Float']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  authorIsUnreviewed: InputMaybe<Scalars['Boolean']['input']>;
  answer: InputMaybe<Scalars['Boolean']['input']>;
  parentAnswerId: InputMaybe<Scalars['String']['input']>;
  shortform: InputMaybe<Scalars['Boolean']['input']>;
  shortformFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  nominatedForReview: InputMaybe<Scalars['String']['input']>;
  reviewingForReview: InputMaybe<Scalars['String']['input']>;
  promotedByUserId: InputMaybe<Scalars['String']['input']>;
  hideKarma: InputMaybe<Scalars['Boolean']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  legacyPoll: InputMaybe<Scalars['Boolean']['input']>;
  legacyParentId: InputMaybe<Scalars['String']['input']>;
  retracted: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  deletedPublic: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason: InputMaybe<Scalars['String']['input']>;
  deletedDate: InputMaybe<Scalars['Date']['input']>;
  deletedByUserId: InputMaybe<Scalars['String']['input']>;
  spam: InputMaybe<Scalars['Boolean']['input']>;
  needsReview: InputMaybe<Scalars['Boolean']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  moderatorHat: InputMaybe<Scalars['Boolean']['input']>;
  hideModeratorHat: InputMaybe<Scalars['Boolean']['input']>;
  isPinnedOnProfile: InputMaybe<Scalars['Boolean']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  relevantTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  debateResponse: InputMaybe<Scalars['Boolean']['input']>;
  rejected: InputMaybe<Scalars['Boolean']['input']>;
  modGPTAnalysis: InputMaybe<Scalars['String']['input']>;
  modGPTRecommendation: InputMaybe<Scalars['String']['input']>;
  rejectedReason: InputMaybe<Scalars['String']['input']>;
  rejectedByUserId: InputMaybe<Scalars['String']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
  afDate: InputMaybe<Scalars['Date']['input']>;
  agentFoundationsId: InputMaybe<Scalars['String']['input']>;
  originalDialogueId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCommentInput = {
  selector: CommentSelectorUniqueInput;
  data: UpdateCommentDataInput;
};

export type UpsertCommentInput = {
  selector: CommentSelectorUniqueInput;
  data: UpdateCommentDataInput;
};

export type UpdateCommentDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  subforumStickyPriority: InputMaybe<Scalars['Float']['input']>;
  authorIsUnreviewed: InputMaybe<Scalars['Boolean']['input']>;
  answer: InputMaybe<Scalars['Boolean']['input']>;
  shortform: InputMaybe<Scalars['Boolean']['input']>;
  shortformFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  nominatedForReview: InputMaybe<Scalars['String']['input']>;
  reviewingForReview: InputMaybe<Scalars['String']['input']>;
  promoted: InputMaybe<Scalars['Boolean']['input']>;
  promotedByUserId: InputMaybe<Scalars['String']['input']>;
  hideKarma: InputMaybe<Scalars['Boolean']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  legacyPoll: InputMaybe<Scalars['Boolean']['input']>;
  legacyParentId: InputMaybe<Scalars['String']['input']>;
  retracted: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  deletedPublic: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason: InputMaybe<Scalars['String']['input']>;
  deletedDate: InputMaybe<Scalars['Date']['input']>;
  deletedByUserId: InputMaybe<Scalars['String']['input']>;
  spam: InputMaybe<Scalars['Boolean']['input']>;
  repliesBlockedUntil: InputMaybe<Scalars['Date']['input']>;
  needsReview: InputMaybe<Scalars['Boolean']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  hideAuthor: InputMaybe<Scalars['Boolean']['input']>;
  moderatorHat: InputMaybe<Scalars['Boolean']['input']>;
  hideModeratorHat: InputMaybe<Scalars['Boolean']['input']>;
  isPinnedOnProfile: InputMaybe<Scalars['Boolean']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  relevantTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  debateResponse: InputMaybe<Scalars['Boolean']['input']>;
  rejected: InputMaybe<Scalars['Boolean']['input']>;
  modGPTAnalysis: InputMaybe<Scalars['String']['input']>;
  modGPTRecommendation: InputMaybe<Scalars['String']['input']>;
  rejectedReason: InputMaybe<Scalars['String']['input']>;
  rejectedByUserId: InputMaybe<Scalars['String']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
  suggestForAlignmentUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  reviewForAlignmentUserId: InputMaybe<Scalars['String']['input']>;
  afDate: InputMaybe<Scalars['Date']['input']>;
  moveToAlignmentUserId: InputMaybe<Scalars['String']['input']>;
  agentFoundationsId: InputMaybe<Scalars['String']['input']>;
  originalDialogueId: InputMaybe<Scalars['String']['input']>;
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

export enum CommentOrderByInput {
  Foobar = 'foobar'
}

export type Conversation = {
  __typename?: 'Conversation';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  title: Maybe<Scalars['String']['output']>;
  participantIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  participants: Array<User>;
  latestActivity: Maybe<Scalars['Date']['output']>;
  af: Maybe<Scalars['Boolean']['output']>;
  messageCount: Maybe<Scalars['Float']['output']>;
  moderator: Maybe<Scalars['Boolean']['output']>;
  archivedByIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  archivedBy: Array<User>;
  latestMessage: Maybe<Message>;
  hasUnreadMessages: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteConversationInput = {
  selector: ConversationSelectorUniqueInput;
};

export type SingleConversationInput = {
  selector: InputMaybe<ConversationSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiConversationInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ConversationSelectorInput>;
  orderBy: InputMaybe<ConversationOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleConversationOutput = {
  __typename?: 'SingleConversationOutput';
  result: Maybe<Conversation>;
};

export type MultiConversationOutput = {
  __typename?: 'MultiConversationOutput';
  results: Maybe<Array<Maybe<Conversation>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ConversationOutput = {
  __typename?: 'ConversationOutput';
  data: Maybe<Conversation>;
};

export type CreateConversationInput = {
  data: CreateConversationDataInput;
};

export type CreateConversationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  participantIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  af: InputMaybe<Scalars['Boolean']['input']>;
  moderator: InputMaybe<Scalars['Boolean']['input']>;
  archivedByIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UpdateConversationInput = {
  selector: ConversationSelectorUniqueInput;
  data: UpdateConversationDataInput;
};

export type UpsertConversationInput = {
  selector: ConversationSelectorUniqueInput;
  data: UpdateConversationDataInput;
};

export type UpdateConversationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  participantIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  af: InputMaybe<Scalars['Boolean']['input']>;
  moderator: InputMaybe<Scalars['Boolean']['input']>;
  archivedByIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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

export enum ConversationOrderByInput {
  Foobar = 'foobar'
}

export type CronHistory = {
  __typename?: 'CronHistory';
  _id: Maybe<Scalars['String']['output']>;
  intendedAt: Maybe<Scalars['Date']['output']>;
  name: Maybe<Scalars['String']['output']>;
  startedAt: Maybe<Scalars['Date']['output']>;
  finishedAt: Maybe<Scalars['Date']['output']>;
  result: Maybe<Scalars['JSON']['output']>;
};

export type DeleteCronHistoryInput = {
  selector: CronHistorySelectorUniqueInput;
};

export type SingleCronHistoryInput = {
  selector: InputMaybe<CronHistorySelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiCronHistoryInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CronHistorySelectorInput>;
  orderBy: InputMaybe<CronHistoryOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleCronHistoryOutput = {
  __typename?: 'SingleCronHistoryOutput';
  result: Maybe<CronHistory>;
};

export type MultiCronHistoryOutput = {
  __typename?: 'MultiCronHistoryOutput';
  results: Maybe<Array<Maybe<CronHistory>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type CronHistoryOutput = {
  __typename?: 'CronHistoryOutput';
  data: Maybe<CronHistory>;
};

export type CreateCronHistoryInput = {
  data: CreateCronHistoryDataInput;
};

export type CreateCronHistoryDataInput = {
  _id: Scalars['String']['input'];
  intendedAt: Scalars['Date']['input'];
  name: Scalars['String']['input'];
  startedAt: Scalars['Date']['input'];
  finishedAt: InputMaybe<Scalars['Date']['input']>;
  result: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateCronHistoryInput = {
  selector: CronHistorySelectorUniqueInput;
  data: UpdateCronHistoryDataInput;
};

export type UpsertCronHistoryInput = {
  selector: CronHistorySelectorUniqueInput;
  data: UpdateCronHistoryDataInput;
};

export type UpdateCronHistoryDataInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  intendedAt: InputMaybe<Scalars['Date']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  startedAt: InputMaybe<Scalars['Date']['input']>;
  finishedAt: InputMaybe<Scalars['Date']['input']>;
  result: InputMaybe<Scalars['JSON']['input']>;
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

export enum CronHistoryOrderByInput {
  Foobar = 'foobar'
}

export type CurationEmail = {
  __typename?: 'CurationEmail';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  postId: Maybe<Scalars['String']['output']>;
};

export type DeleteCurationEmailInput = {
  selector: CurationEmailSelectorUniqueInput;
};

export type SingleCurationEmailInput = {
  selector: InputMaybe<CurationEmailSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiCurationEmailInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CurationEmailSelectorInput>;
  orderBy: InputMaybe<CurationEmailOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleCurationEmailOutput = {
  __typename?: 'SingleCurationEmailOutput';
  result: Maybe<CurationEmail>;
};

export type MultiCurationEmailOutput = {
  __typename?: 'MultiCurationEmailOutput';
  results: Maybe<Array<Maybe<CurationEmail>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type CurationEmailOutput = {
  __typename?: 'CurationEmailOutput';
  data: Maybe<CurationEmail>;
};

export type CreateCurationEmailInput = {
  data: CreateCurationEmailDataInput;
};

export type CreateCurationEmailDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};

export type UpdateCurationEmailInput = {
  selector: CurationEmailSelectorUniqueInput;
  data: UpdateCurationEmailDataInput;
};

export type UpsertCurationEmailInput = {
  selector: CurationEmailSelectorUniqueInput;
  data: UpdateCurationEmailDataInput;
};

export type UpdateCurationEmailDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
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

export enum CurationEmailOrderByInput {
  Foobar = 'foobar'
}

export type CurationNotice = {
  __typename?: 'CurationNotice';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  commentId: Maybe<Scalars['String']['output']>;
  comment: Maybe<Comment>;
  postId: Maybe<Scalars['String']['output']>;
  post: Maybe<Post>;
  deleted: Maybe<Scalars['Boolean']['output']>;
};


export type CurationNoticeContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteCurationNoticeInput = {
  selector: CurationNoticeSelectorUniqueInput;
};

export type SingleCurationNoticeInput = {
  selector: InputMaybe<CurationNoticeSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiCurationNoticeInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<CurationNoticeSelectorInput>;
  orderBy: InputMaybe<CurationNoticeOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleCurationNoticeOutput = {
  __typename?: 'SingleCurationNoticeOutput';
  result: Maybe<CurationNotice>;
};

export type MultiCurationNoticeOutput = {
  __typename?: 'MultiCurationNoticeOutput';
  results: Maybe<Array<Maybe<CurationNotice>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type CurationNoticeOutput = {
  __typename?: 'CurationNoticeOutput';
  data: Maybe<CurationNotice>;
};

export type CreateCurationNoticeInput = {
  data: CreateCurationNoticeDataInput;
};

export type CreateCurationNoticeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  commentId: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
};

export type UpdateCurationNoticeInput = {
  selector: CurationNoticeSelectorUniqueInput;
  data: UpdateCurationNoticeDataInput;
};

export type UpsertCurationNoticeInput = {
  selector: CurationNoticeSelectorUniqueInput;
  data: UpdateCurationNoticeDataInput;
};

export type UpdateCurationNoticeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  commentId: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
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

export enum CurationNoticeOrderByInput {
  Foobar = 'foobar'
}

export type DatabaseMetadata = {
  __typename?: 'DatabaseMetadata';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteDatabaseMetadataInput = {
  selector: DatabaseMetadataSelectorUniqueInput;
};

export type SingleDatabaseMetadataInput = {
  selector: InputMaybe<DatabaseMetadataSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiDatabaseMetadataInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DatabaseMetadataSelectorInput>;
  orderBy: InputMaybe<DatabaseMetadataOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleDatabaseMetadataOutput = {
  __typename?: 'SingleDatabaseMetadataOutput';
  result: Maybe<DatabaseMetadata>;
};

export type MultiDatabaseMetadataOutput = {
  __typename?: 'MultiDatabaseMetadataOutput';
  results: Maybe<Array<Maybe<DatabaseMetadata>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type DatabaseMetadataOutput = {
  __typename?: 'DatabaseMetadataOutput';
  data: Maybe<DatabaseMetadata>;
};

export type CreateDatabaseMetadataInput = {
  data: CreateDatabaseMetadataDataInput;
};

export type CreateDatabaseMetadataDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateDatabaseMetadataInput = {
  selector: DatabaseMetadataSelectorUniqueInput;
  data: UpdateDatabaseMetadataDataInput;
};

export type UpsertDatabaseMetadataInput = {
  selector: DatabaseMetadataSelectorUniqueInput;
  data: UpdateDatabaseMetadataDataInput;
};

export type UpdateDatabaseMetadataDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum DatabaseMetadataOrderByInput {
  Foobar = 'foobar'
}

export type DebouncerEvents = {
  __typename?: 'DebouncerEvents';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteDebouncerEventsInput = {
  selector: DebouncerEventsSelectorUniqueInput;
};

export type SingleDebouncerEventsInput = {
  selector: InputMaybe<DebouncerEventsSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiDebouncerEventsInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DebouncerEventsSelectorInput>;
  orderBy: InputMaybe<DebouncerEventsOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleDebouncerEventsOutput = {
  __typename?: 'SingleDebouncerEventsOutput';
  result: Maybe<DebouncerEvents>;
};

export type MultiDebouncerEventsOutput = {
  __typename?: 'MultiDebouncerEventsOutput';
  results: Maybe<Array<Maybe<DebouncerEvents>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type DebouncerEventsOutput = {
  __typename?: 'DebouncerEventsOutput';
  data: Maybe<DebouncerEvents>;
};

export type CreateDebouncerEventsInput = {
  data: CreateDebouncerEventsDataInput;
};

export type CreateDebouncerEventsDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateDebouncerEventsInput = {
  selector: DebouncerEventsSelectorUniqueInput;
  data: UpdateDebouncerEventsDataInput;
};

export type UpsertDebouncerEventsInput = {
  selector: DebouncerEventsSelectorUniqueInput;
  data: UpdateDebouncerEventsDataInput;
};

export type UpdateDebouncerEventsDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum DebouncerEventsOrderByInput {
  Foobar = 'foobar'
}

export type DialogueCheck = {
  __typename?: 'DialogueCheck';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  targetUserId: Maybe<Scalars['String']['output']>;
  checked: Maybe<Scalars['Boolean']['output']>;
  checkedAt: Maybe<Scalars['Date']['output']>;
  hideInRecommendations: Maybe<Scalars['Boolean']['output']>;
  matchPreference: Maybe<DialogueMatchPreference>;
  reciprocalMatchPreference: Maybe<DialogueMatchPreference>;
};

export type DeleteDialogueCheckInput = {
  selector: DialogueCheckSelectorUniqueInput;
};

export type SingleDialogueCheckInput = {
  selector: InputMaybe<DialogueCheckSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiDialogueCheckInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DialogueCheckSelectorInput>;
  orderBy: InputMaybe<DialogueCheckOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleDialogueCheckOutput = {
  __typename?: 'SingleDialogueCheckOutput';
  result: Maybe<DialogueCheck>;
};

export type MultiDialogueCheckOutput = {
  __typename?: 'MultiDialogueCheckOutput';
  results: Maybe<Array<Maybe<DialogueCheck>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type DialogueCheckOutput = {
  __typename?: 'DialogueCheckOutput';
  data: Maybe<DialogueCheck>;
};

export type CreateDialogueCheckInput = {
  data: CreateDialogueCheckDataInput;
};

export type CreateDialogueCheckDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  targetUserId: Scalars['String']['input'];
  checked: Scalars['Boolean']['input'];
  checkedAt: Scalars['Date']['input'];
  hideInRecommendations: Scalars['Boolean']['input'];
};

export type UpdateDialogueCheckInput = {
  selector: DialogueCheckSelectorUniqueInput;
  data: UpdateDialogueCheckDataInput;
};

export type UpsertDialogueCheckInput = {
  selector: DialogueCheckSelectorUniqueInput;
  data: UpdateDialogueCheckDataInput;
};

export type UpdateDialogueCheckDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum DialogueCheckOrderByInput {
  Foobar = 'foobar'
}

export type DialogueMatchPreference = {
  __typename?: 'DialogueMatchPreference';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  dialogueCheckId: Maybe<Scalars['String']['output']>;
  dialogueCheck: Maybe<DialogueCheck>;
  topicPreferences: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  topicNotes: Maybe<Scalars['String']['output']>;
  syncPreference: Maybe<Scalars['String']['output']>;
  asyncPreference: Maybe<Scalars['String']['output']>;
  formatNotes: Maybe<Scalars['String']['output']>;
  calendlyLink: Maybe<Scalars['String']['output']>;
  generatedDialogueId: Maybe<Scalars['String']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteDialogueMatchPreferenceInput = {
  selector: DialogueMatchPreferenceSelectorUniqueInput;
};

export type SingleDialogueMatchPreferenceInput = {
  selector: InputMaybe<DialogueMatchPreferenceSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiDialogueMatchPreferenceInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DialogueMatchPreferenceSelectorInput>;
  orderBy: InputMaybe<DialogueMatchPreferenceOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleDialogueMatchPreferenceOutput = {
  __typename?: 'SingleDialogueMatchPreferenceOutput';
  result: Maybe<DialogueMatchPreference>;
};

export type MultiDialogueMatchPreferenceOutput = {
  __typename?: 'MultiDialogueMatchPreferenceOutput';
  results: Maybe<Array<Maybe<DialogueMatchPreference>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type DialogueMatchPreferenceOutput = {
  __typename?: 'DialogueMatchPreferenceOutput';
  data: Maybe<DialogueMatchPreference>;
};

export type CreateDialogueMatchPreferenceInput = {
  data: CreateDialogueMatchPreferenceDataInput;
};

export type CreateDialogueMatchPreferenceDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  dialogueCheckId: Scalars['String']['input'];
  topicPreferences: Array<InputMaybe<Scalars['JSON']['input']>>;
  topicNotes: Scalars['String']['input'];
  syncPreference: Scalars['String']['input'];
  asyncPreference: Scalars['String']['input'];
  formatNotes: Scalars['String']['input'];
  calendlyLink: InputMaybe<Scalars['String']['input']>;
  generatedDialogueId: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateDialogueMatchPreferenceInput = {
  selector: DialogueMatchPreferenceSelectorUniqueInput;
  data: UpdateDialogueMatchPreferenceDataInput;
};

export type UpsertDialogueMatchPreferenceInput = {
  selector: DialogueMatchPreferenceSelectorUniqueInput;
  data: UpdateDialogueMatchPreferenceDataInput;
};

export type UpdateDialogueMatchPreferenceDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  dialogueCheckId: InputMaybe<Scalars['String']['input']>;
  topicPreferences: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  topicNotes: InputMaybe<Scalars['String']['input']>;
  syncPreference: InputMaybe<Scalars['String']['input']>;
  asyncPreference: InputMaybe<Scalars['String']['input']>;
  formatNotes: InputMaybe<Scalars['String']['input']>;
  calendlyLink: InputMaybe<Scalars['String']['input']>;
  generatedDialogueId: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
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

export enum DialogueMatchPreferenceOrderByInput {
  Foobar = 'foobar'
}

export type DigestPost = {
  __typename?: 'DigestPost';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  digestId: Maybe<Scalars['String']['output']>;
  digest: Digest;
  postId: Maybe<Scalars['String']['output']>;
  post: Post;
  emailDigestStatus: Maybe<Scalars['String']['output']>;
  onsiteDigestStatus: Maybe<Scalars['String']['output']>;
};

export type DeleteDigestPostInput = {
  selector: DigestPostSelectorUniqueInput;
};

export type SingleDigestPostInput = {
  selector: InputMaybe<DigestPostSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiDigestPostInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DigestPostSelectorInput>;
  orderBy: InputMaybe<DigestPostOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleDigestPostOutput = {
  __typename?: 'SingleDigestPostOutput';
  result: Maybe<DigestPost>;
};

export type MultiDigestPostOutput = {
  __typename?: 'MultiDigestPostOutput';
  results: Maybe<Array<Maybe<DigestPost>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type DigestPostOutput = {
  __typename?: 'DigestPostOutput';
  data: Maybe<DigestPost>;
};

export type CreateDigestPostInput = {
  data: CreateDigestPostDataInput;
};

export type CreateDigestPostDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  digestId: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  emailDigestStatus: InputMaybe<Scalars['String']['input']>;
  onsiteDigestStatus: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDigestPostInput = {
  selector: DigestPostSelectorUniqueInput;
  data: UpdateDigestPostDataInput;
};

export type UpsertDigestPostInput = {
  selector: DigestPostSelectorUniqueInput;
  data: UpdateDigestPostDataInput;
};

export type UpdateDigestPostDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  digestId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  emailDigestStatus: InputMaybe<Scalars['String']['input']>;
  onsiteDigestStatus: InputMaybe<Scalars['String']['input']>;
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

export enum DigestPostOrderByInput {
  Foobar = 'foobar'
}

export type Digest = {
  __typename?: 'Digest';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  num: Maybe<Scalars['Float']['output']>;
  startDate: Maybe<Scalars['Date']['output']>;
  endDate: Maybe<Scalars['Date']['output']>;
  publishedDate: Maybe<Scalars['Date']['output']>;
  onsiteImageId: Maybe<Scalars['String']['output']>;
  onsitePrimaryColor: Maybe<Scalars['String']['output']>;
};

export type DeleteDigestInput = {
  selector: DigestSelectorUniqueInput;
};

export type SingleDigestInput = {
  selector: InputMaybe<DigestSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiDigestInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<DigestSelectorInput>;
  orderBy: InputMaybe<DigestOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleDigestOutput = {
  __typename?: 'SingleDigestOutput';
  result: Maybe<Digest>;
};

export type MultiDigestOutput = {
  __typename?: 'MultiDigestOutput';
  results: Maybe<Array<Maybe<Digest>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type DigestOutput = {
  __typename?: 'DigestOutput';
  data: Maybe<Digest>;
};

export type CreateDigestInput = {
  data: CreateDigestDataInput;
};

export type CreateDigestDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  num: Scalars['Float']['input'];
  startDate: Scalars['Date']['input'];
  endDate: InputMaybe<Scalars['Date']['input']>;
  publishedDate: InputMaybe<Scalars['Date']['input']>;
  onsiteImageId: InputMaybe<Scalars['String']['input']>;
  onsitePrimaryColor: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDigestInput = {
  selector: DigestSelectorUniqueInput;
  data: UpdateDigestDataInput;
};

export type UpsertDigestInput = {
  selector: DigestSelectorUniqueInput;
  data: UpdateDigestDataInput;
};

export type UpdateDigestDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  num: InputMaybe<Scalars['Float']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
  publishedDate: InputMaybe<Scalars['Date']['input']>;
  onsiteImageId: InputMaybe<Scalars['String']['input']>;
  onsitePrimaryColor: InputMaybe<Scalars['String']['input']>;
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

export enum DigestOrderByInput {
  Foobar = 'foobar'
}

export type ElectionCandidate = {
  __typename?: 'ElectionCandidate';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  electionName: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  logoSrc: Maybe<Scalars['String']['output']>;
  href: Maybe<Scalars['String']['output']>;
  fundraiserLink: Maybe<Scalars['String']['output']>;
  gwwcLink: Maybe<Scalars['String']['output']>;
  gwwcId: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  postCount: Maybe<Scalars['Float']['output']>;
  tagId: Maybe<Scalars['String']['output']>;
  tag: Maybe<Tag>;
  isElectionFundraiser: Maybe<Scalars['Boolean']['output']>;
  amountRaised: Maybe<Scalars['Float']['output']>;
  targetAmount: Maybe<Scalars['Float']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
};

export type DeleteElectionCandidateInput = {
  selector: ElectionCandidateSelectorUniqueInput;
};

export type SingleElectionCandidateInput = {
  selector: InputMaybe<ElectionCandidateSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiElectionCandidateInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ElectionCandidateSelectorInput>;
  orderBy: InputMaybe<ElectionCandidateOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleElectionCandidateOutput = {
  __typename?: 'SingleElectionCandidateOutput';
  result: Maybe<ElectionCandidate>;
};

export type MultiElectionCandidateOutput = {
  __typename?: 'MultiElectionCandidateOutput';
  results: Maybe<Array<Maybe<ElectionCandidate>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ElectionCandidateOutput = {
  __typename?: 'ElectionCandidateOutput';
  data: Maybe<ElectionCandidate>;
};

export type CreateElectionCandidateInput = {
  data: CreateElectionCandidateDataInput;
};

export type CreateElectionCandidateDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  electionName: Scalars['String']['input'];
  name: Scalars['String']['input'];
  logoSrc: Scalars['String']['input'];
  href: Scalars['String']['input'];
  fundraiserLink: InputMaybe<Scalars['String']['input']>;
  gwwcLink: InputMaybe<Scalars['String']['input']>;
  gwwcId: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  userId: InputMaybe<Scalars['String']['input']>;
  tagId: Scalars['String']['input'];
  isElectionFundraiser: InputMaybe<Scalars['Boolean']['input']>;
  amountRaised: InputMaybe<Scalars['Float']['input']>;
  targetAmount: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateElectionCandidateInput = {
  selector: ElectionCandidateSelectorUniqueInput;
  data: UpdateElectionCandidateDataInput;
};

export type UpsertElectionCandidateInput = {
  selector: ElectionCandidateSelectorUniqueInput;
  data: UpdateElectionCandidateDataInput;
};

export type UpdateElectionCandidateDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  electionName: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  logoSrc: InputMaybe<Scalars['String']['input']>;
  href: InputMaybe<Scalars['String']['input']>;
  fundraiserLink: InputMaybe<Scalars['String']['input']>;
  gwwcLink: InputMaybe<Scalars['String']['input']>;
  gwwcId: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  tagId: InputMaybe<Scalars['String']['input']>;
  isElectionFundraiser: InputMaybe<Scalars['Boolean']['input']>;
  amountRaised: InputMaybe<Scalars['Float']['input']>;
  targetAmount: InputMaybe<Scalars['Float']['input']>;
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

export enum ElectionCandidateOrderByInput {
  Foobar = 'foobar'
}

export type ElectionVote = {
  __typename?: 'ElectionVote';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  electionName: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: User;
  compareState: Maybe<Scalars['JSON']['output']>;
  vote: Maybe<Scalars['JSON']['output']>;
  submittedAt: Maybe<Scalars['Date']['output']>;
  submissionComments: Maybe<Scalars['JSON']['output']>;
  userExplanation: Maybe<Scalars['String']['output']>;
  userOtherComments: Maybe<Scalars['String']['output']>;
};

export type DeleteElectionVoteInput = {
  selector: ElectionVoteSelectorUniqueInput;
};

export type SingleElectionVoteInput = {
  selector: InputMaybe<ElectionVoteSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiElectionVoteInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ElectionVoteSelectorInput>;
  orderBy: InputMaybe<ElectionVoteOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleElectionVoteOutput = {
  __typename?: 'SingleElectionVoteOutput';
  result: Maybe<ElectionVote>;
};

export type MultiElectionVoteOutput = {
  __typename?: 'MultiElectionVoteOutput';
  results: Maybe<Array<Maybe<ElectionVote>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ElectionVoteOutput = {
  __typename?: 'ElectionVoteOutput';
  data: Maybe<ElectionVote>;
};

export type CreateElectionVoteInput = {
  data: CreateElectionVoteDataInput;
};

export type CreateElectionVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  electionName: Scalars['String']['input'];
  userId: Scalars['String']['input'];
  compareState: InputMaybe<Scalars['JSON']['input']>;
  vote: InputMaybe<Scalars['JSON']['input']>;
  submittedAt: InputMaybe<Scalars['Date']['input']>;
  submissionComments: InputMaybe<Scalars['JSON']['input']>;
  userExplanation: InputMaybe<Scalars['String']['input']>;
  userOtherComments: InputMaybe<Scalars['String']['input']>;
};

export type UpdateElectionVoteInput = {
  selector: ElectionVoteSelectorUniqueInput;
  data: UpdateElectionVoteDataInput;
};

export type UpsertElectionVoteInput = {
  selector: ElectionVoteSelectorUniqueInput;
  data: UpdateElectionVoteDataInput;
};

export type UpdateElectionVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  electionName: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  compareState: InputMaybe<Scalars['JSON']['input']>;
  vote: InputMaybe<Scalars['JSON']['input']>;
  submittedAt: InputMaybe<Scalars['Date']['input']>;
  submissionComments: InputMaybe<Scalars['JSON']['input']>;
  userExplanation: InputMaybe<Scalars['String']['input']>;
  userOtherComments: InputMaybe<Scalars['String']['input']>;
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

export enum ElectionVoteOrderByInput {
  Foobar = 'foobar'
}

export type ElicitQuestionPrediction = {
  __typename?: 'ElicitQuestionPrediction';
  _id: Maybe<Scalars['String']['output']>;
  predictionId: Maybe<Scalars['String']['output']>;
  prediction: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  creator: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  sourceUrl: Maybe<Scalars['String']['output']>;
  sourceId: Maybe<Scalars['String']['output']>;
  binaryQuestionId: Maybe<Scalars['String']['output']>;
  question: ElicitQuestion;
  isDeleted: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteElicitQuestionPredictionInput = {
  selector: ElicitQuestionPredictionSelectorUniqueInput;
};

export type SingleElicitQuestionPredictionInput = {
  selector: InputMaybe<ElicitQuestionPredictionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiElicitQuestionPredictionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ElicitQuestionPredictionSelectorInput>;
  orderBy: InputMaybe<ElicitQuestionPredictionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleElicitQuestionPredictionOutput = {
  __typename?: 'SingleElicitQuestionPredictionOutput';
  result: Maybe<ElicitQuestionPrediction>;
};

export type MultiElicitQuestionPredictionOutput = {
  __typename?: 'MultiElicitQuestionPredictionOutput';
  results: Maybe<Array<Maybe<ElicitQuestionPrediction>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ElicitQuestionPredictionOutput = {
  __typename?: 'ElicitQuestionPredictionOutput';
  data: Maybe<ElicitQuestionPrediction>;
};

export type CreateElicitQuestionPredictionInput = {
  data: CreateElicitQuestionPredictionDataInput;
};

export type CreateElicitQuestionPredictionDataInput = {
  _id: Scalars['String']['input'];
  prediction: InputMaybe<Scalars['Float']['input']>;
  createdAt: Scalars['Date']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  creator: Scalars['JSON']['input'];
  userId: InputMaybe<Scalars['String']['input']>;
  sourceUrl: InputMaybe<Scalars['String']['input']>;
  sourceId: InputMaybe<Scalars['String']['input']>;
  binaryQuestionId: Scalars['String']['input'];
  isDeleted: Scalars['Boolean']['input'];
};

export type UpdateElicitQuestionPredictionInput = {
  selector: ElicitQuestionPredictionSelectorUniqueInput;
  data: UpdateElicitQuestionPredictionDataInput;
};

export type UpsertElicitQuestionPredictionInput = {
  selector: ElicitQuestionPredictionSelectorUniqueInput;
  data: UpdateElicitQuestionPredictionDataInput;
};

export type UpdateElicitQuestionPredictionDataInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  prediction: InputMaybe<Scalars['Float']['input']>;
  createdAt: InputMaybe<Scalars['Date']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  creator: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  sourceUrl: InputMaybe<Scalars['String']['input']>;
  sourceId: InputMaybe<Scalars['String']['input']>;
  binaryQuestionId: InputMaybe<Scalars['String']['input']>;
  isDeleted: InputMaybe<Scalars['Boolean']['input']>;
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

export enum ElicitQuestionPredictionOrderByInput {
  Foobar = 'foobar'
}

export type ElicitQuestion = {
  __typename?: 'ElicitQuestion';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  title: Maybe<Scalars['String']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  resolution: Maybe<Scalars['String']['output']>;
  resolvesBy: Maybe<Scalars['Date']['output']>;
};

export type DeleteElicitQuestionInput = {
  selector: ElicitQuestionSelectorUniqueInput;
};

export type SingleElicitQuestionInput = {
  selector: InputMaybe<ElicitQuestionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiElicitQuestionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ElicitQuestionSelectorInput>;
  orderBy: InputMaybe<ElicitQuestionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleElicitQuestionOutput = {
  __typename?: 'SingleElicitQuestionOutput';
  result: Maybe<ElicitQuestion>;
};

export type MultiElicitQuestionOutput = {
  __typename?: 'MultiElicitQuestionOutput';
  results: Maybe<Array<Maybe<ElicitQuestion>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ElicitQuestionOutput = {
  __typename?: 'ElicitQuestionOutput';
  data: Maybe<ElicitQuestion>;
};

export type CreateElicitQuestionInput = {
  data: CreateElicitQuestionDataInput;
};

export type CreateElicitQuestionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  title: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  resolution: InputMaybe<Scalars['String']['input']>;
  resolvesBy: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateElicitQuestionInput = {
  selector: ElicitQuestionSelectorUniqueInput;
  data: UpdateElicitQuestionDataInput;
};

export type UpsertElicitQuestionInput = {
  selector: ElicitQuestionSelectorUniqueInput;
  data: UpdateElicitQuestionDataInput;
};

export type UpdateElicitQuestionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  resolution: InputMaybe<Scalars['String']['input']>;
  resolvesBy: InputMaybe<Scalars['Date']['input']>;
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

export enum ElicitQuestionOrderByInput {
  Foobar = 'foobar'
}

export type EmailTokens = {
  __typename?: 'EmailTokens';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteEmailTokensInput = {
  selector: EmailTokensSelectorUniqueInput;
};

export type SingleEmailTokensInput = {
  selector: InputMaybe<EmailTokensSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiEmailTokensInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<EmailTokensSelectorInput>;
  orderBy: InputMaybe<EmailTokensOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleEmailTokensOutput = {
  __typename?: 'SingleEmailTokensOutput';
  result: Maybe<EmailTokens>;
};

export type MultiEmailTokensOutput = {
  __typename?: 'MultiEmailTokensOutput';
  results: Maybe<Array<Maybe<EmailTokens>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type EmailTokensOutput = {
  __typename?: 'EmailTokensOutput';
  data: Maybe<EmailTokens>;
};

export type CreateEmailTokensInput = {
  data: CreateEmailTokensDataInput;
};

export type CreateEmailTokensDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateEmailTokensInput = {
  selector: EmailTokensSelectorUniqueInput;
  data: UpdateEmailTokensDataInput;
};

export type UpsertEmailTokensInput = {
  selector: EmailTokensSelectorUniqueInput;
  data: UpdateEmailTokensDataInput;
};

export type UpdateEmailTokensDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum EmailTokensOrderByInput {
  Foobar = 'foobar'
}

export type FeaturedResource = {
  __typename?: 'FeaturedResource';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  title: Maybe<Scalars['String']['output']>;
  body: Maybe<Scalars['String']['output']>;
  ctaText: Maybe<Scalars['String']['output']>;
  ctaUrl: Maybe<Scalars['String']['output']>;
  expiresAt: Maybe<Scalars['Date']['output']>;
};

export type DeleteFeaturedResourceInput = {
  selector: FeaturedResourceSelectorUniqueInput;
};

export type SingleFeaturedResourceInput = {
  selector: InputMaybe<FeaturedResourceSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiFeaturedResourceInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<FeaturedResourceSelectorInput>;
  orderBy: InputMaybe<FeaturedResourceOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleFeaturedResourceOutput = {
  __typename?: 'SingleFeaturedResourceOutput';
  result: Maybe<FeaturedResource>;
};

export type MultiFeaturedResourceOutput = {
  __typename?: 'MultiFeaturedResourceOutput';
  results: Maybe<Array<Maybe<FeaturedResource>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type FeaturedResourceOutput = {
  __typename?: 'FeaturedResourceOutput';
  data: Maybe<FeaturedResource>;
};

export type CreateFeaturedResourceInput = {
  data: CreateFeaturedResourceDataInput;
};

export type CreateFeaturedResourceDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  title: Scalars['String']['input'];
  body: Scalars['String']['input'];
  ctaText: Scalars['String']['input'];
  ctaUrl: Scalars['String']['input'];
  expiresAt: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateFeaturedResourceInput = {
  selector: FeaturedResourceSelectorUniqueInput;
  data: UpdateFeaturedResourceDataInput;
};

export type UpsertFeaturedResourceInput = {
  selector: FeaturedResourceSelectorUniqueInput;
  data: UpdateFeaturedResourceDataInput;
};

export type UpdateFeaturedResourceDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  body: InputMaybe<Scalars['String']['input']>;
  ctaText: InputMaybe<Scalars['String']['input']>;
  ctaUrl: InputMaybe<Scalars['String']['input']>;
  expiresAt: InputMaybe<Scalars['Date']['input']>;
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

export enum FeaturedResourceOrderByInput {
  Foobar = 'foobar'
}

export type FieldChange = {
  __typename?: 'FieldChange';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  changeGroup: Maybe<Scalars['String']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  fieldName: Maybe<Scalars['String']['output']>;
  oldValue: Maybe<Scalars['JSON']['output']>;
  newValue: Maybe<Scalars['JSON']['output']>;
};

export type DeleteFieldChangeInput = {
  selector: FieldChangeSelectorUniqueInput;
};

export type SingleFieldChangeInput = {
  selector: InputMaybe<FieldChangeSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiFieldChangeInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<FieldChangeSelectorInput>;
  orderBy: InputMaybe<FieldChangeOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleFieldChangeOutput = {
  __typename?: 'SingleFieldChangeOutput';
  result: Maybe<FieldChange>;
};

export type MultiFieldChangeOutput = {
  __typename?: 'MultiFieldChangeOutput';
  results: Maybe<Array<Maybe<FieldChange>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type FieldChangeOutput = {
  __typename?: 'FieldChangeOutput';
  data: Maybe<FieldChange>;
};

export type CreateFieldChangeInput = {
  data: CreateFieldChangeDataInput;
};

export type CreateFieldChangeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateFieldChangeInput = {
  selector: FieldChangeSelectorUniqueInput;
  data: UpdateFieldChangeDataInput;
};

export type UpsertFieldChangeInput = {
  selector: FieldChangeSelectorUniqueInput;
  data: UpdateFieldChangeDataInput;
};

export type UpdateFieldChangeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum FieldChangeOrderByInput {
  Foobar = 'foobar'
}

export type ForumEvent = {
  __typename?: 'ForumEvent';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  frontpageDescription: Maybe<Revision>;
  frontpageDescription_latest: Maybe<Scalars['String']['output']>;
  frontpageDescriptionMobile: Maybe<Revision>;
  frontpageDescriptionMobile_latest: Maybe<Scalars['String']['output']>;
  postPageDescription: Maybe<Revision>;
  postPageDescription_latest: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  startDate: Maybe<Scalars['Date']['output']>;
  endDate: Maybe<Scalars['Date']['output']>;
  darkColor: Maybe<Scalars['String']['output']>;
  lightColor: Maybe<Scalars['String']['output']>;
  bannerTextColor: Maybe<Scalars['String']['output']>;
  contrastColor: Maybe<Scalars['String']['output']>;
  tagId: Maybe<Scalars['String']['output']>;
  tag: Maybe<Tag>;
  postId: Maybe<Scalars['String']['output']>;
  post: Maybe<Post>;
  bannerImageId: Maybe<Scalars['String']['output']>;
  includesPoll: Maybe<Scalars['Boolean']['output']>;
  eventFormat: Maybe<Scalars['String']['output']>;
  pollQuestion: Maybe<Revision>;
  pollQuestion_latest: Maybe<Scalars['String']['output']>;
  pollAgreeWording: Maybe<Scalars['String']['output']>;
  pollDisagreeWording: Maybe<Scalars['String']['output']>;
  maxStickersPerUser: Maybe<Scalars['Float']['output']>;
  customComponent: Maybe<Scalars['String']['output']>;
  commentPrompt: Maybe<Scalars['String']['output']>;
  publicData: Maybe<Scalars['JSON']['output']>;
  voteCount: Scalars['Int']['output'];
};


export type ForumEventFrontpageDescriptionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type ForumEventFrontpageDescriptionMobileArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type ForumEventPostPageDescriptionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type ForumEventPollQuestionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteForumEventInput = {
  selector: ForumEventSelectorUniqueInput;
};

export type SingleForumEventInput = {
  selector: InputMaybe<ForumEventSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiForumEventInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ForumEventSelectorInput>;
  orderBy: InputMaybe<ForumEventOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleForumEventOutput = {
  __typename?: 'SingleForumEventOutput';
  result: Maybe<ForumEvent>;
};

export type MultiForumEventOutput = {
  __typename?: 'MultiForumEventOutput';
  results: Maybe<Array<Maybe<ForumEvent>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ForumEventOutput = {
  __typename?: 'ForumEventOutput';
  data: Maybe<ForumEvent>;
};

export type CreateForumEventInput = {
  data: CreateForumEventDataInput;
};

export type CreateForumEventDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  frontpageDescription: InputMaybe<Scalars['JSON']['input']>;
  frontpageDescriptionMobile: InputMaybe<Scalars['JSON']['input']>;
  postPageDescription: InputMaybe<Scalars['JSON']['input']>;
  title: Scalars['String']['input'];
  startDate: Scalars['Date']['input'];
  endDate: Scalars['Date']['input'];
  darkColor: Scalars['String']['input'];
  lightColor: Scalars['String']['input'];
  bannerTextColor: Scalars['String']['input'];
  contrastColor: InputMaybe<Scalars['String']['input']>;
  tagId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  includesPoll: InputMaybe<Scalars['Boolean']['input']>;
  eventFormat: InputMaybe<Scalars['String']['input']>;
  pollQuestion: InputMaybe<Scalars['JSON']['input']>;
  pollAgreeWording: InputMaybe<Scalars['String']['input']>;
  pollDisagreeWording: InputMaybe<Scalars['String']['input']>;
  maxStickersPerUser: InputMaybe<Scalars['Float']['input']>;
  customComponent: InputMaybe<Scalars['String']['input']>;
  commentPrompt: InputMaybe<Scalars['String']['input']>;
  publicData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateForumEventInput = {
  selector: ForumEventSelectorUniqueInput;
  data: UpdateForumEventDataInput;
};

export type UpsertForumEventInput = {
  selector: ForumEventSelectorUniqueInput;
  data: UpdateForumEventDataInput;
};

export type UpdateForumEventDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  frontpageDescription: InputMaybe<Scalars['JSON']['input']>;
  frontpageDescriptionMobile: InputMaybe<Scalars['JSON']['input']>;
  postPageDescription: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
  darkColor: InputMaybe<Scalars['String']['input']>;
  lightColor: InputMaybe<Scalars['String']['input']>;
  bannerTextColor: InputMaybe<Scalars['String']['input']>;
  contrastColor: InputMaybe<Scalars['String']['input']>;
  tagId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  includesPoll: InputMaybe<Scalars['Boolean']['input']>;
  eventFormat: InputMaybe<Scalars['String']['input']>;
  pollQuestion: InputMaybe<Scalars['JSON']['input']>;
  pollAgreeWording: InputMaybe<Scalars['String']['input']>;
  pollDisagreeWording: InputMaybe<Scalars['String']['input']>;
  maxStickersPerUser: InputMaybe<Scalars['Float']['input']>;
  customComponent: InputMaybe<Scalars['String']['input']>;
  commentPrompt: InputMaybe<Scalars['String']['input']>;
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

export enum ForumEventOrderByInput {
  Foobar = 'foobar'
}

export type GardenCode = {
  __typename?: 'GardenCode';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  code: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  startTime: Maybe<Scalars['Date']['output']>;
  endTime: Maybe<Scalars['Date']['output']>;
  fbLink: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
  hidden: Maybe<Scalars['Boolean']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  afOnly: Maybe<Scalars['Boolean']['output']>;
};


export type GardenCodeContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteGardenCodeInput = {
  selector: GardenCodeSelectorUniqueInput;
};

export type SingleGardenCodeInput = {
  selector: InputMaybe<GardenCodeSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiGardenCodeInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<GardenCodeSelectorInput>;
  orderBy: InputMaybe<GardenCodeOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleGardenCodeOutput = {
  __typename?: 'SingleGardenCodeOutput';
  result: Maybe<GardenCode>;
};

export type MultiGardenCodeOutput = {
  __typename?: 'MultiGardenCodeOutput';
  results: Maybe<Array<Maybe<GardenCode>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type GardenCodeOutput = {
  __typename?: 'GardenCodeOutput';
  data: Maybe<GardenCode>;
};

export type CreateGardenCodeInput = {
  data: CreateGardenCodeDataInput;
};

export type CreateGardenCodeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: Scalars['String']['input'];
  startTime: InputMaybe<Scalars['Date']['input']>;
  fbLink: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
  afOnly: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateGardenCodeInput = {
  selector: GardenCodeSelectorUniqueInput;
  data: UpdateGardenCodeDataInput;
};

export type UpsertGardenCodeInput = {
  selector: GardenCodeSelectorUniqueInput;
  data: UpdateGardenCodeDataInput;
};

export type UpdateGardenCodeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  startTime: InputMaybe<Scalars['Date']['input']>;
  endTime: InputMaybe<Scalars['Date']['input']>;
  fbLink: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
  hidden: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  afOnly: InputMaybe<Scalars['Boolean']['input']>;
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

export enum GardenCodeOrderByInput {
  Foobar = 'foobar'
}

export type GoogleServiceAccountSession = {
  __typename?: 'GoogleServiceAccountSession';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  email: Maybe<Scalars['String']['output']>;
  refreshToken: Maybe<Scalars['String']['output']>;
  estimatedExpiry: Maybe<Scalars['Date']['output']>;
  active: Maybe<Scalars['Boolean']['output']>;
  revoked: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteGoogleServiceAccountSessionInput = {
  selector: GoogleServiceAccountSessionSelectorUniqueInput;
};

export type SingleGoogleServiceAccountSessionInput = {
  selector: InputMaybe<GoogleServiceAccountSessionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiGoogleServiceAccountSessionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<GoogleServiceAccountSessionSelectorInput>;
  orderBy: InputMaybe<GoogleServiceAccountSessionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleGoogleServiceAccountSessionOutput = {
  __typename?: 'SingleGoogleServiceAccountSessionOutput';
  result: Maybe<GoogleServiceAccountSession>;
};

export type MultiGoogleServiceAccountSessionOutput = {
  __typename?: 'MultiGoogleServiceAccountSessionOutput';
  results: Maybe<Array<Maybe<GoogleServiceAccountSession>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type GoogleServiceAccountSessionOutput = {
  __typename?: 'GoogleServiceAccountSessionOutput';
  data: Maybe<GoogleServiceAccountSession>;
};

export type CreateGoogleServiceAccountSessionInput = {
  data: CreateGoogleServiceAccountSessionDataInput;
};

export type CreateGoogleServiceAccountSessionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  email: Scalars['String']['input'];
  refreshToken: Scalars['String']['input'];
  estimatedExpiry: Scalars['Date']['input'];
  active: Scalars['Boolean']['input'];
  revoked: Scalars['Boolean']['input'];
};

export type UpdateGoogleServiceAccountSessionInput = {
  selector: GoogleServiceAccountSessionSelectorUniqueInput;
  data: UpdateGoogleServiceAccountSessionDataInput;
};

export type UpsertGoogleServiceAccountSessionInput = {
  selector: GoogleServiceAccountSessionSelectorUniqueInput;
  data: UpdateGoogleServiceAccountSessionDataInput;
};

export type UpdateGoogleServiceAccountSessionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  refreshToken: InputMaybe<Scalars['String']['input']>;
  estimatedExpiry: InputMaybe<Scalars['Date']['input']>;
  active: InputMaybe<Scalars['Boolean']['input']>;
  revoked: InputMaybe<Scalars['Boolean']['input']>;
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

export enum GoogleServiceAccountSessionOrderByInput {
  Foobar = 'foobar'
}

export type Images = {
  __typename?: 'Images';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteImagesInput = {
  selector: ImagesSelectorUniqueInput;
};

export type SingleImagesInput = {
  selector: InputMaybe<ImagesSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiImagesInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ImagesSelectorInput>;
  orderBy: InputMaybe<ImagesOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleImagesOutput = {
  __typename?: 'SingleImagesOutput';
  result: Maybe<Images>;
};

export type MultiImagesOutput = {
  __typename?: 'MultiImagesOutput';
  results: Maybe<Array<Maybe<Images>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ImagesOutput = {
  __typename?: 'ImagesOutput';
  data: Maybe<Images>;
};

export type CreateImagesInput = {
  data: CreateImagesDataInput;
};

export type CreateImagesDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateImagesInput = {
  selector: ImagesSelectorUniqueInput;
  data: UpdateImagesDataInput;
};

export type UpsertImagesInput = {
  selector: ImagesSelectorUniqueInput;
  data: UpdateImagesDataInput;
};

export type UpdateImagesDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum ImagesOrderByInput {
  Foobar = 'foobar'
}

export type JargonTerm = {
  __typename?: 'JargonTerm';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  post: Maybe<Post>;
  term: Maybe<Scalars['String']['output']>;
  humansAndOrAIEdited: Maybe<Scalars['String']['output']>;
  approved: Maybe<Scalars['Boolean']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  altTerms: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};


export type JargonTermContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteJargonTermInput = {
  selector: JargonTermSelectorUniqueInput;
};

export type SingleJargonTermInput = {
  selector: InputMaybe<JargonTermSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiJargonTermInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<JargonTermSelectorInput>;
  orderBy: InputMaybe<JargonTermOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleJargonTermOutput = {
  __typename?: 'SingleJargonTermOutput';
  result: Maybe<JargonTerm>;
};

export type MultiJargonTermOutput = {
  __typename?: 'MultiJargonTermOutput';
  results: Maybe<Array<Maybe<JargonTerm>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type JargonTermOutput = {
  __typename?: 'JargonTermOutput';
  data: Maybe<JargonTerm>;
};

export type CreateJargonTermInput = {
  data: CreateJargonTermDataInput;
};

export type CreateJargonTermDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  term: Scalars['String']['input'];
  approved: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  altTerms: Array<InputMaybe<Scalars['String']['input']>>;
};

export type UpdateJargonTermInput = {
  selector: JargonTermSelectorUniqueInput;
  data: UpdateJargonTermDataInput;
};

export type UpsertJargonTermInput = {
  selector: JargonTermSelectorUniqueInput;
  data: UpdateJargonTermDataInput;
};

export type UpdateJargonTermDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  term: InputMaybe<Scalars['String']['input']>;
  approved: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  altTerms: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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

export enum JargonTermOrderByInput {
  Foobar = 'foobar'
}

export type LwEvent = {
  __typename?: 'LWEvent';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  name: Maybe<Scalars['String']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  important: Maybe<Scalars['Boolean']['output']>;
  properties: Maybe<Scalars['JSON']['output']>;
  intercom: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteLwEventInput = {
  selector: LwEventSelectorUniqueInput;
};

export type SingleLwEventInput = {
  selector: InputMaybe<LwEventSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiLwEventInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LwEventSelectorInput>;
  orderBy: InputMaybe<LwEventOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleLwEventOutput = {
  __typename?: 'SingleLWEventOutput';
  result: Maybe<LwEvent>;
};

export type MultiLwEventOutput = {
  __typename?: 'MultiLWEventOutput';
  results: Maybe<Array<Maybe<LwEvent>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type LwEventOutput = {
  __typename?: 'LWEventOutput';
  data: Maybe<LwEvent>;
};

export type CreateLwEventInput = {
  data: CreateLwEventDataInput;
};

export type CreateLwEventDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  documentId: InputMaybe<Scalars['String']['input']>;
  important: InputMaybe<Scalars['Boolean']['input']>;
  properties: InputMaybe<Scalars['JSON']['input']>;
  intercom: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateLwEventInput = {
  selector: LwEventSelectorUniqueInput;
  data: UpdateLwEventDataInput;
};

export type UpsertLwEventInput = {
  selector: LwEventSelectorUniqueInput;
  data: UpdateLwEventDataInput;
};

export type UpdateLwEventDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  important: InputMaybe<Scalars['Boolean']['input']>;
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

export enum LwEventOrderByInput {
  Foobar = 'foobar'
}

export type LegacyData = {
  __typename?: 'LegacyData';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteLegacyDataInput = {
  selector: LegacyDataSelectorUniqueInput;
};

export type SingleLegacyDataInput = {
  selector: InputMaybe<LegacyDataSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiLegacyDataInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LegacyDataSelectorInput>;
  orderBy: InputMaybe<LegacyDataOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleLegacyDataOutput = {
  __typename?: 'SingleLegacyDataOutput';
  result: Maybe<LegacyData>;
};

export type MultiLegacyDataOutput = {
  __typename?: 'MultiLegacyDataOutput';
  results: Maybe<Array<Maybe<LegacyData>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type LegacyDataOutput = {
  __typename?: 'LegacyDataOutput';
  data: Maybe<LegacyData>;
};

export type CreateLegacyDataInput = {
  data: CreateLegacyDataDataInput;
};

export type CreateLegacyDataDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateLegacyDataInput = {
  selector: LegacyDataSelectorUniqueInput;
  data: UpdateLegacyDataDataInput;
};

export type UpsertLegacyDataInput = {
  selector: LegacyDataSelectorUniqueInput;
  data: UpdateLegacyDataDataInput;
};

export type UpdateLegacyDataDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum LegacyDataOrderByInput {
  Foobar = 'foobar'
}

export type LlmConversation = {
  __typename?: 'LlmConversation';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  title: Maybe<Scalars['String']['output']>;
  model: Maybe<Scalars['String']['output']>;
  systemPrompt: Maybe<Scalars['String']['output']>;
  lastUpdatedAt: Maybe<Scalars['Date']['output']>;
  messages: Maybe<Array<Maybe<LlmMessage>>>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  totalCharacterCount: Maybe<Scalars['Int']['output']>;
};

export type DeleteLlmConversationInput = {
  selector: LlmConversationSelectorUniqueInput;
};

export type SingleLlmConversationInput = {
  selector: InputMaybe<LlmConversationSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiLlmConversationInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LlmConversationSelectorInput>;
  orderBy: InputMaybe<LlmConversationOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleLlmConversationOutput = {
  __typename?: 'SingleLlmConversationOutput';
  result: Maybe<LlmConversation>;
};

export type MultiLlmConversationOutput = {
  __typename?: 'MultiLlmConversationOutput';
  results: Maybe<Array<Maybe<LlmConversation>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type LlmConversationOutput = {
  __typename?: 'LlmConversationOutput';
  data: Maybe<LlmConversation>;
};

export type CreateLlmConversationInput = {
  data: CreateLlmConversationDataInput;
};

export type CreateLlmConversationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  title: Scalars['String']['input'];
  model: Scalars['String']['input'];
  systemPrompt: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateLlmConversationInput = {
  selector: LlmConversationSelectorUniqueInput;
  data: UpdateLlmConversationDataInput;
};

export type UpsertLlmConversationInput = {
  selector: LlmConversationSelectorUniqueInput;
  data: UpdateLlmConversationDataInput;
};

export type UpdateLlmConversationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  model: InputMaybe<Scalars['String']['input']>;
  systemPrompt: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
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

export enum LlmConversationOrderByInput {
  Foobar = 'foobar'
}

export type LlmMessage = {
  __typename?: 'LlmMessage';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  conversationId: Maybe<Scalars['String']['output']>;
  role: Maybe<Scalars['String']['output']>;
  content: Maybe<Scalars['String']['output']>;
};

export type DeleteLlmMessageInput = {
  selector: LlmMessageSelectorUniqueInput;
};

export type SingleLlmMessageInput = {
  selector: InputMaybe<LlmMessageSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiLlmMessageInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LlmMessageSelectorInput>;
  orderBy: InputMaybe<LlmMessageOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleLlmMessageOutput = {
  __typename?: 'SingleLlmMessageOutput';
  result: Maybe<LlmMessage>;
};

export type MultiLlmMessageOutput = {
  __typename?: 'MultiLlmMessageOutput';
  results: Maybe<Array<Maybe<LlmMessage>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type LlmMessageOutput = {
  __typename?: 'LlmMessageOutput';
  data: Maybe<LlmMessage>;
};

export type CreateLlmMessageInput = {
  data: CreateLlmMessageDataInput;
};

export type CreateLlmMessageDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  conversationId: InputMaybe<Scalars['String']['input']>;
  role: Scalars['String']['input'];
  content: Scalars['String']['input'];
};

export type UpdateLlmMessageInput = {
  selector: LlmMessageSelectorUniqueInput;
  data: UpdateLlmMessageDataInput;
};

export type UpsertLlmMessageInput = {
  selector: LlmMessageSelectorUniqueInput;
  data: UpdateLlmMessageDataInput;
};

export type UpdateLlmMessageDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  conversationId: InputMaybe<Scalars['String']['input']>;
  role: InputMaybe<Scalars['String']['input']>;
  content: InputMaybe<Scalars['String']['input']>;
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

export enum LlmMessageOrderByInput {
  Foobar = 'foobar'
}

export type Localgroup = {
  __typename?: 'Localgroup';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  nameInAnotherLanguage: Maybe<Scalars['String']['output']>;
  organizerIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  organizers: Array<User>;
  lastActivity: Maybe<Scalars['Date']['output']>;
  types: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  categories: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  isOnline: Maybe<Scalars['Boolean']['output']>;
  mongoLocation: Maybe<Scalars['JSON']['output']>;
  googleLocation: Maybe<Scalars['JSON']['output']>;
  location: Maybe<Scalars['String']['output']>;
  contactInfo: Maybe<Scalars['String']['output']>;
  facebookLink: Maybe<Scalars['String']['output']>;
  facebookPageLink: Maybe<Scalars['String']['output']>;
  meetupLink: Maybe<Scalars['String']['output']>;
  slackLink: Maybe<Scalars['String']['output']>;
  website: Maybe<Scalars['String']['output']>;
  bannerImageId: Maybe<Scalars['String']['output']>;
  inactive: Maybe<Scalars['Boolean']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
};


export type LocalgroupContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteLocalgroupInput = {
  selector: LocalgroupSelectorUniqueInput;
};

export type SingleLocalgroupInput = {
  selector: InputMaybe<LocalgroupSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiLocalgroupInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<LocalgroupSelectorInput>;
  orderBy: InputMaybe<LocalgroupOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleLocalgroupOutput = {
  __typename?: 'SingleLocalgroupOutput';
  result: Maybe<Localgroup>;
};

export type MultiLocalgroupOutput = {
  __typename?: 'MultiLocalgroupOutput';
  results: Maybe<Array<Maybe<Localgroup>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type LocalgroupOutput = {
  __typename?: 'LocalgroupOutput';
  data: Maybe<Localgroup>;
};

export type CreateLocalgroupInput = {
  data: CreateLocalgroupDataInput;
};

export type CreateLocalgroupDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  nameInAnotherLanguage: InputMaybe<Scalars['String']['input']>;
  organizerIds: Array<InputMaybe<Scalars['String']['input']>>;
  lastActivity: InputMaybe<Scalars['Date']['input']>;
  types: Array<InputMaybe<Scalars['String']['input']>>;
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  isOnline: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  contactInfo: InputMaybe<Scalars['String']['input']>;
  facebookLink: InputMaybe<Scalars['String']['input']>;
  facebookPageLink: InputMaybe<Scalars['String']['input']>;
  meetupLink: InputMaybe<Scalars['String']['input']>;
  slackLink: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  inactive: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateLocalgroupInput = {
  selector: LocalgroupSelectorUniqueInput;
  data: UpdateLocalgroupDataInput;
};

export type UpsertLocalgroupInput = {
  selector: LocalgroupSelectorUniqueInput;
  data: UpdateLocalgroupDataInput;
};

export type UpdateLocalgroupDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  nameInAnotherLanguage: InputMaybe<Scalars['String']['input']>;
  organizerIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastActivity: InputMaybe<Scalars['Date']['input']>;
  types: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  isOnline: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  contactInfo: InputMaybe<Scalars['String']['input']>;
  facebookLink: InputMaybe<Scalars['String']['input']>;
  facebookPageLink: InputMaybe<Scalars['String']['input']>;
  meetupLink: InputMaybe<Scalars['String']['input']>;
  slackLink: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  inactive: InputMaybe<Scalars['Boolean']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
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

export enum LocalgroupOrderByInput {
  Foobar = 'foobar'
}

export type ManifoldProbabilitiesCache = {
  __typename?: 'ManifoldProbabilitiesCache';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  marketId: Maybe<Scalars['String']['output']>;
  probability: Maybe<Scalars['Float']['output']>;
  isResolved: Maybe<Scalars['Boolean']['output']>;
  year: Maybe<Scalars['Float']['output']>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

export type DeleteManifoldProbabilitiesCacheInput = {
  selector: ManifoldProbabilitiesCacheSelectorUniqueInput;
};

export type SingleManifoldProbabilitiesCacheInput = {
  selector: InputMaybe<ManifoldProbabilitiesCacheSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiManifoldProbabilitiesCacheInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ManifoldProbabilitiesCacheSelectorInput>;
  orderBy: InputMaybe<ManifoldProbabilitiesCacheOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleManifoldProbabilitiesCacheOutput = {
  __typename?: 'SingleManifoldProbabilitiesCacheOutput';
  result: Maybe<ManifoldProbabilitiesCache>;
};

export type MultiManifoldProbabilitiesCacheOutput = {
  __typename?: 'MultiManifoldProbabilitiesCacheOutput';
  results: Maybe<Array<Maybe<ManifoldProbabilitiesCache>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ManifoldProbabilitiesCacheOutput = {
  __typename?: 'ManifoldProbabilitiesCacheOutput';
  data: Maybe<ManifoldProbabilitiesCache>;
};

export type CreateManifoldProbabilitiesCacheInput = {
  data: CreateManifoldProbabilitiesCacheDataInput;
};

export type CreateManifoldProbabilitiesCacheDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  marketId: Scalars['String']['input'];
  probability: Scalars['Float']['input'];
  isResolved: Scalars['Boolean']['input'];
  year: Scalars['Float']['input'];
  lastUpdated: Scalars['Date']['input'];
  url: InputMaybe<Scalars['String']['input']>;
};

export type UpdateManifoldProbabilitiesCacheInput = {
  selector: ManifoldProbabilitiesCacheSelectorUniqueInput;
  data: UpdateManifoldProbabilitiesCacheDataInput;
};

export type UpsertManifoldProbabilitiesCacheInput = {
  selector: ManifoldProbabilitiesCacheSelectorUniqueInput;
  data: UpdateManifoldProbabilitiesCacheDataInput;
};

export type UpdateManifoldProbabilitiesCacheDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum ManifoldProbabilitiesCacheOrderByInput {
  Foobar = 'foobar'
}

export type Message = {
  __typename?: 'Message';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  conversationId: Maybe<Scalars['String']['output']>;
  conversation: Conversation;
  noEmail: Maybe<Scalars['Boolean']['output']>;
};


export type MessageContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteMessageInput = {
  selector: MessageSelectorUniqueInput;
};

export type SingleMessageInput = {
  selector: InputMaybe<MessageSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiMessageInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<MessageSelectorInput>;
  orderBy: InputMaybe<MessageOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleMessageOutput = {
  __typename?: 'SingleMessageOutput';
  result: Maybe<Message>;
};

export type MultiMessageOutput = {
  __typename?: 'MultiMessageOutput';
  results: Maybe<Array<Maybe<Message>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MessageOutput = {
  __typename?: 'MessageOutput';
  data: Maybe<Message>;
};

export type CreateMessageInput = {
  data: CreateMessageDataInput;
};

export type CreateMessageDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  conversationId: Scalars['String']['input'];
  noEmail: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateMessageInput = {
  selector: MessageSelectorUniqueInput;
  data: UpdateMessageDataInput;
};

export type UpsertMessageInput = {
  selector: MessageSelectorUniqueInput;
  data: UpdateMessageDataInput;
};

export type UpdateMessageDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
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

export enum MessageOrderByInput {
  Foobar = 'foobar'
}

export type Migration = {
  __typename?: 'Migration';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteMigrationInput = {
  selector: MigrationSelectorUniqueInput;
};

export type SingleMigrationInput = {
  selector: InputMaybe<MigrationSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiMigrationInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<MigrationSelectorInput>;
  orderBy: InputMaybe<MigrationOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleMigrationOutput = {
  __typename?: 'SingleMigrationOutput';
  result: Maybe<Migration>;
};

export type MultiMigrationOutput = {
  __typename?: 'MultiMigrationOutput';
  results: Maybe<Array<Maybe<Migration>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MigrationOutput = {
  __typename?: 'MigrationOutput';
  data: Maybe<Migration>;
};

export type CreateMigrationInput = {
  data: CreateMigrationDataInput;
};

export type CreateMigrationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateMigrationInput = {
  selector: MigrationSelectorUniqueInput;
  data: UpdateMigrationDataInput;
};

export type UpsertMigrationInput = {
  selector: MigrationSelectorUniqueInput;
  data: UpdateMigrationDataInput;
};

export type UpdateMigrationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum MigrationOrderByInput {
  Foobar = 'foobar'
}

export type ModerationTemplate = {
  __typename?: 'ModerationTemplate';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  collectionName: Maybe<Scalars['String']['output']>;
  order: Maybe<Scalars['Float']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
};


export type ModerationTemplateContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteModerationTemplateInput = {
  selector: ModerationTemplateSelectorUniqueInput;
};

export type SingleModerationTemplateInput = {
  selector: InputMaybe<ModerationTemplateSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiModerationTemplateInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ModerationTemplateSelectorInput>;
  orderBy: InputMaybe<ModerationTemplateOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleModerationTemplateOutput = {
  __typename?: 'SingleModerationTemplateOutput';
  result: Maybe<ModerationTemplate>;
};

export type MultiModerationTemplateOutput = {
  __typename?: 'MultiModerationTemplateOutput';
  results: Maybe<Array<Maybe<ModerationTemplate>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ModerationTemplateOutput = {
  __typename?: 'ModerationTemplateOutput';
  data: Maybe<ModerationTemplate>;
};

export type CreateModerationTemplateInput = {
  data: CreateModerationTemplateDataInput;
};

export type CreateModerationTemplateDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  collectionName: Scalars['String']['input'];
  order: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateModerationTemplateInput = {
  selector: ModerationTemplateSelectorUniqueInput;
  data: UpdateModerationTemplateDataInput;
};

export type UpsertModerationTemplateInput = {
  selector: ModerationTemplateSelectorUniqueInput;
  data: UpdateModerationTemplateDataInput;
};

export type UpdateModerationTemplateDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  collectionName: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
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

export enum ModerationTemplateOrderByInput {
  Foobar = 'foobar'
}

export type ModeratorAction = {
  __typename?: 'ModeratorAction';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  type: Maybe<Scalars['String']['output']>;
  endedAt: Maybe<Scalars['Date']['output']>;
  active: Scalars['Boolean']['output'];
};

export type DeleteModeratorActionInput = {
  selector: ModeratorActionSelectorUniqueInput;
};

export type SingleModeratorActionInput = {
  selector: InputMaybe<ModeratorActionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiModeratorActionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ModeratorActionSelectorInput>;
  orderBy: InputMaybe<ModeratorActionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleModeratorActionOutput = {
  __typename?: 'SingleModeratorActionOutput';
  result: Maybe<ModeratorAction>;
};

export type MultiModeratorActionOutput = {
  __typename?: 'MultiModeratorActionOutput';
  results: Maybe<Array<Maybe<ModeratorAction>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ModeratorActionOutput = {
  __typename?: 'ModeratorActionOutput';
  data: Maybe<ModeratorAction>;
};

export type CreateModeratorActionInput = {
  data: CreateModeratorActionDataInput;
};

export type CreateModeratorActionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
  endedAt: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateModeratorActionInput = {
  selector: ModeratorActionSelectorUniqueInput;
  data: UpdateModeratorActionDataInput;
};

export type UpsertModeratorActionInput = {
  selector: ModeratorActionSelectorUniqueInput;
  data: UpdateModeratorActionDataInput;
};

export type UpdateModeratorActionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
  endedAt: InputMaybe<Scalars['Date']['input']>;
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

export enum ModeratorActionOrderByInput {
  Foobar = 'foobar'
}

export type MultiDocument = {
  __typename?: 'MultiDocument';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  oldSlugs: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  title: Maybe<Scalars['String']['output']>;
  preview: Maybe<Scalars['String']['output']>;
  tabTitle: Maybe<Scalars['String']['output']>;
  tabSubtitle: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  parentDocumentId: Maybe<Scalars['String']['output']>;
  parentTag: Maybe<Tag>;
  parentLens: Maybe<MultiDocument>;
  collectionName: Maybe<Scalars['String']['output']>;
  fieldName: Maybe<Scalars['String']['output']>;
  index: Maybe<Scalars['Float']['output']>;
  tableOfContents: Maybe<Scalars['JSON']['output']>;
  contributors: Maybe<TagContributorsList>;
  contributionStats: Maybe<Scalars['JSON']['output']>;
  arbitalLinkedPages: Maybe<ArbitalLinkedPages>;
  htmlWithContributorAnnotations: Maybe<Scalars['String']['output']>;
  summaries: Array<MultiDocument>;
  textLastUpdatedAt: Maybe<Scalars['Date']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
};


export type MultiDocumentContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type MultiDocumentTableOfContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type MultiDocumentContributorsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteMultiDocumentInput = {
  selector: MultiDocumentSelectorUniqueInput;
};

export type SingleMultiDocumentInput = {
  selector: InputMaybe<MultiDocumentSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiMultiDocumentInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<MultiDocumentSelectorInput>;
  orderBy: InputMaybe<MultiDocumentOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleMultiDocumentOutput = {
  __typename?: 'SingleMultiDocumentOutput';
  result: Maybe<MultiDocument>;
};

export type MultiMultiDocumentOutput = {
  __typename?: 'MultiMultiDocumentOutput';
  results: Maybe<Array<Maybe<MultiDocument>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type MultiDocumentOutput = {
  __typename?: 'MultiDocumentOutput';
  data: Maybe<MultiDocument>;
};

export type CreateMultiDocumentInput = {
  data: CreateMultiDocumentDataInput;
};

export type CreateMultiDocumentDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  tabTitle: Scalars['String']['input'];
  tabSubtitle: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  parentDocumentId: Scalars['String']['input'];
  collectionName: Scalars['String']['input'];
  fieldName: Scalars['String']['input'];
};

export type UpdateMultiDocumentInput = {
  selector: MultiDocumentSelectorUniqueInput;
  data: UpdateMultiDocumentDataInput;
};

export type UpsertMultiDocumentInput = {
  selector: MultiDocumentSelectorUniqueInput;
  data: UpdateMultiDocumentDataInput;
};

export type UpdateMultiDocumentDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  tabTitle: InputMaybe<Scalars['String']['input']>;
  tabSubtitle: InputMaybe<Scalars['String']['input']>;
  index: InputMaybe<Scalars['Float']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
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

export enum MultiDocumentOrderByInput {
  Foobar = 'foobar'
}

export type Notification = {
  __typename?: 'Notification';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  documentType: Maybe<Scalars['String']['output']>;
  extraData: Maybe<Scalars['JSON']['output']>;
  link: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  message: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  viewed: Maybe<Scalars['Boolean']['output']>;
  emailed: Maybe<Scalars['Boolean']['output']>;
  waitingForBatch: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteNotificationInput = {
  selector: NotificationSelectorUniqueInput;
};

export type SingleNotificationInput = {
  selector: InputMaybe<NotificationSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiNotificationInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<NotificationSelectorInput>;
  orderBy: InputMaybe<NotificationOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleNotificationOutput = {
  __typename?: 'SingleNotificationOutput';
  result: Maybe<Notification>;
};

export type MultiNotificationOutput = {
  __typename?: 'MultiNotificationOutput';
  results: Maybe<Array<Maybe<Notification>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type NotificationOutput = {
  __typename?: 'NotificationOutput';
  data: Maybe<Notification>;
};

export type CreateNotificationInput = {
  data: CreateNotificationDataInput;
};

export type CreateNotificationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  viewed: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateNotificationInput = {
  selector: NotificationSelectorUniqueInput;
  data: UpdateNotificationDataInput;
};

export type UpsertNotificationInput = {
  selector: NotificationSelectorUniqueInput;
  data: UpdateNotificationDataInput;
};

export type UpdateNotificationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  viewed: InputMaybe<Scalars['Boolean']['input']>;
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

export enum NotificationOrderByInput {
  Foobar = 'foobar'
}

export type PageCacheEntry = {
  __typename?: 'PageCacheEntry';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeletePageCacheEntryInput = {
  selector: PageCacheEntrySelectorUniqueInput;
};

export type SinglePageCacheEntryInput = {
  selector: InputMaybe<PageCacheEntrySelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPageCacheEntryInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PageCacheEntrySelectorInput>;
  orderBy: InputMaybe<PageCacheEntryOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePageCacheEntryOutput = {
  __typename?: 'SinglePageCacheEntryOutput';
  result: Maybe<PageCacheEntry>;
};

export type MultiPageCacheEntryOutput = {
  __typename?: 'MultiPageCacheEntryOutput';
  results: Maybe<Array<Maybe<PageCacheEntry>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PageCacheEntryOutput = {
  __typename?: 'PageCacheEntryOutput';
  data: Maybe<PageCacheEntry>;
};

export type CreatePageCacheEntryInput = {
  data: CreatePageCacheEntryDataInput;
};

export type CreatePageCacheEntryDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePageCacheEntryInput = {
  selector: PageCacheEntrySelectorUniqueInput;
  data: UpdatePageCacheEntryDataInput;
};

export type UpsertPageCacheEntryInput = {
  selector: PageCacheEntrySelectorUniqueInput;
  data: UpdatePageCacheEntryDataInput;
};

export type UpdatePageCacheEntryDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum PageCacheEntryOrderByInput {
  Foobar = 'foobar'
}

export type PetrovDayAction = {
  __typename?: 'PetrovDayAction';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  actionType: Maybe<Scalars['String']['output']>;
  data: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type DeletePetrovDayActionInput = {
  selector: PetrovDayActionSelectorUniqueInput;
};

export type SinglePetrovDayActionInput = {
  selector: InputMaybe<PetrovDayActionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPetrovDayActionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PetrovDayActionSelectorInput>;
  orderBy: InputMaybe<PetrovDayActionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePetrovDayActionOutput = {
  __typename?: 'SinglePetrovDayActionOutput';
  result: Maybe<PetrovDayAction>;
};

export type MultiPetrovDayActionOutput = {
  __typename?: 'MultiPetrovDayActionOutput';
  results: Maybe<Array<Maybe<PetrovDayAction>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PetrovDayActionOutput = {
  __typename?: 'PetrovDayActionOutput';
  data: Maybe<PetrovDayAction>;
};

export type CreatePetrovDayActionInput = {
  data: CreatePetrovDayActionDataInput;
};

export type CreatePetrovDayActionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  actionType: Scalars['String']['input'];
  data: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
};

export type UpdatePetrovDayActionInput = {
  selector: PetrovDayActionSelectorUniqueInput;
  data: UpdatePetrovDayActionDataInput;
};

export type UpsertPetrovDayActionInput = {
  selector: PetrovDayActionSelectorUniqueInput;
  data: UpdatePetrovDayActionDataInput;
};

export type UpdatePetrovDayActionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum PetrovDayActionOrderByInput {
  Foobar = 'foobar'
}

export type PetrovDayLaunch = {
  __typename?: 'PetrovDayLaunch';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  launchCode: Maybe<Scalars['String']['output']>;
  hashedLaunchCode: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
};

export type DeletePetrovDayLaunchInput = {
  selector: PetrovDayLaunchSelectorUniqueInput;
};

export type SinglePetrovDayLaunchInput = {
  selector: InputMaybe<PetrovDayLaunchSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPetrovDayLaunchInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PetrovDayLaunchSelectorInput>;
  orderBy: InputMaybe<PetrovDayLaunchOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePetrovDayLaunchOutput = {
  __typename?: 'SinglePetrovDayLaunchOutput';
  result: Maybe<PetrovDayLaunch>;
};

export type MultiPetrovDayLaunchOutput = {
  __typename?: 'MultiPetrovDayLaunchOutput';
  results: Maybe<Array<Maybe<PetrovDayLaunch>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PetrovDayLaunchOutput = {
  __typename?: 'PetrovDayLaunchOutput';
  data: Maybe<PetrovDayLaunch>;
};

export type CreatePetrovDayLaunchInput = {
  data: CreatePetrovDayLaunchDataInput;
};

export type CreatePetrovDayLaunchDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  launchCode: InputMaybe<Scalars['String']['input']>;
  hashedLaunchCode: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePetrovDayLaunchInput = {
  selector: PetrovDayLaunchSelectorUniqueInput;
  data: UpdatePetrovDayLaunchDataInput;
};

export type UpsertPetrovDayLaunchInput = {
  selector: PetrovDayLaunchSelectorUniqueInput;
  data: UpdatePetrovDayLaunchDataInput;
};

export type UpdatePetrovDayLaunchDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  launchCode: InputMaybe<Scalars['String']['input']>;
  hashedLaunchCode: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
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

export enum PetrovDayLaunchOrderByInput {
  Foobar = 'foobar'
}

export type PodcastEpisode = {
  __typename?: 'PodcastEpisode';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  podcastId: Maybe<Scalars['String']['output']>;
  podcast: Podcast;
  title: Maybe<Scalars['String']['output']>;
  episodeLink: Maybe<Scalars['String']['output']>;
  externalEpisodeId: Maybe<Scalars['String']['output']>;
};

export type DeletePodcastEpisodeInput = {
  selector: PodcastEpisodeSelectorUniqueInput;
};

export type SinglePodcastEpisodeInput = {
  selector: InputMaybe<PodcastEpisodeSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPodcastEpisodeInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PodcastEpisodeSelectorInput>;
  orderBy: InputMaybe<PodcastEpisodeOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePodcastEpisodeOutput = {
  __typename?: 'SinglePodcastEpisodeOutput';
  result: Maybe<PodcastEpisode>;
};

export type MultiPodcastEpisodeOutput = {
  __typename?: 'MultiPodcastEpisodeOutput';
  results: Maybe<Array<Maybe<PodcastEpisode>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PodcastEpisodeOutput = {
  __typename?: 'PodcastEpisodeOutput';
  data: Maybe<PodcastEpisode>;
};

export type CreatePodcastEpisodeInput = {
  data: CreatePodcastEpisodeDataInput;
};

export type CreatePodcastEpisodeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  podcastId: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  episodeLink: Scalars['String']['input'];
  externalEpisodeId: Scalars['String']['input'];
};

export type UpdatePodcastEpisodeInput = {
  selector: PodcastEpisodeSelectorUniqueInput;
  data: UpdatePodcastEpisodeDataInput;
};

export type UpsertPodcastEpisodeInput = {
  selector: PodcastEpisodeSelectorUniqueInput;
  data: UpdatePodcastEpisodeDataInput;
};

export type UpdatePodcastEpisodeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum PodcastEpisodeOrderByInput {
  Foobar = 'foobar'
}

export type Podcast = {
  __typename?: 'Podcast';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  title: Maybe<Scalars['String']['output']>;
  applePodcastLink: Maybe<Scalars['String']['output']>;
  spotifyPodcastLink: Maybe<Scalars['String']['output']>;
};

export type DeletePodcastInput = {
  selector: PodcastSelectorUniqueInput;
};

export type SinglePodcastInput = {
  selector: InputMaybe<PodcastSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPodcastInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PodcastSelectorInput>;
  orderBy: InputMaybe<PodcastOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePodcastOutput = {
  __typename?: 'SinglePodcastOutput';
  result: Maybe<Podcast>;
};

export type MultiPodcastOutput = {
  __typename?: 'MultiPodcastOutput';
  results: Maybe<Array<Maybe<Podcast>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PodcastOutput = {
  __typename?: 'PodcastOutput';
  data: Maybe<Podcast>;
};

export type CreatePodcastInput = {
  data: CreatePodcastDataInput;
};

export type CreatePodcastDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePodcastInput = {
  selector: PodcastSelectorUniqueInput;
  data: UpdatePodcastDataInput;
};

export type UpsertPodcastInput = {
  selector: PodcastSelectorUniqueInput;
  data: UpdatePodcastDataInput;
};

export type UpdatePodcastDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum PodcastOrderByInput {
  Foobar = 'foobar'
}

export type PostEmbedding = {
  __typename?: 'PostEmbedding';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  post: Post;
  postHash: Maybe<Scalars['String']['output']>;
  lastGeneratedAt: Maybe<Scalars['Date']['output']>;
  model: Maybe<Scalars['String']['output']>;
  embeddings: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
};

export type DeletePostEmbeddingInput = {
  selector: PostEmbeddingSelectorUniqueInput;
};

export type SinglePostEmbeddingInput = {
  selector: InputMaybe<PostEmbeddingSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPostEmbeddingInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostEmbeddingSelectorInput>;
  orderBy: InputMaybe<PostEmbeddingOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePostEmbeddingOutput = {
  __typename?: 'SinglePostEmbeddingOutput';
  result: Maybe<PostEmbedding>;
};

export type MultiPostEmbeddingOutput = {
  __typename?: 'MultiPostEmbeddingOutput';
  results: Maybe<Array<Maybe<PostEmbedding>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PostEmbeddingOutput = {
  __typename?: 'PostEmbeddingOutput';
  data: Maybe<PostEmbedding>;
};

export type CreatePostEmbeddingInput = {
  data: CreatePostEmbeddingDataInput;
};

export type CreatePostEmbeddingDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  postHash: Scalars['String']['input'];
  lastGeneratedAt: Scalars['Date']['input'];
  model: Scalars['String']['input'];
  embeddings: Array<InputMaybe<Scalars['Float']['input']>>;
};

export type UpdatePostEmbeddingInput = {
  selector: PostEmbeddingSelectorUniqueInput;
  data: UpdatePostEmbeddingDataInput;
};

export type UpsertPostEmbeddingInput = {
  selector: PostEmbeddingSelectorUniqueInput;
  data: UpdatePostEmbeddingDataInput;
};

export type UpdatePostEmbeddingDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  postHash: InputMaybe<Scalars['String']['input']>;
  lastGeneratedAt: InputMaybe<Scalars['Date']['input']>;
  model: InputMaybe<Scalars['String']['input']>;
  embeddings: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
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

export enum PostEmbeddingOrderByInput {
  Foobar = 'foobar'
}

export type PostRecommendation = {
  __typename?: 'PostRecommendation';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: User;
  clientId: Maybe<Scalars['String']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  post: Post;
  strategyName: Maybe<Scalars['String']['output']>;
  strategySettings: Maybe<Scalars['JSON']['output']>;
  recommendationCount: Maybe<Scalars['Int']['output']>;
  lastRecommendedAt: Maybe<Scalars['Date']['output']>;
  clickedAt: Maybe<Scalars['Date']['output']>;
};

export type DeletePostRecommendationInput = {
  selector: PostRecommendationSelectorUniqueInput;
};

export type SinglePostRecommendationInput = {
  selector: InputMaybe<PostRecommendationSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPostRecommendationInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostRecommendationSelectorInput>;
  orderBy: InputMaybe<PostRecommendationOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePostRecommendationOutput = {
  __typename?: 'SinglePostRecommendationOutput';
  result: Maybe<PostRecommendation>;
};

export type MultiPostRecommendationOutput = {
  __typename?: 'MultiPostRecommendationOutput';
  results: Maybe<Array<Maybe<PostRecommendation>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PostRecommendationOutput = {
  __typename?: 'PostRecommendationOutput';
  data: Maybe<PostRecommendation>;
};

export type CreatePostRecommendationInput = {
  data: CreatePostRecommendationDataInput;
};

export type CreatePostRecommendationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  clientId: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
  strategyName: Scalars['String']['input'];
  strategySettings: InputMaybe<Scalars['JSON']['input']>;
  recommendationCount: Scalars['Int']['input'];
  lastRecommendedAt: Scalars['Date']['input'];
  clickedAt: InputMaybe<Scalars['Date']['input']>;
};

export type UpdatePostRecommendationInput = {
  selector: PostRecommendationSelectorUniqueInput;
  data: UpdatePostRecommendationDataInput;
};

export type UpsertPostRecommendationInput = {
  selector: PostRecommendationSelectorUniqueInput;
  data: UpdatePostRecommendationDataInput;
};

export type UpdatePostRecommendationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  clientId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  strategyName: InputMaybe<Scalars['String']['input']>;
  strategySettings: InputMaybe<Scalars['JSON']['input']>;
  recommendationCount: InputMaybe<Scalars['Int']['input']>;
  lastRecommendedAt: InputMaybe<Scalars['Date']['input']>;
  clickedAt: InputMaybe<Scalars['Date']['input']>;
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

export enum PostRecommendationOrderByInput {
  Foobar = 'foobar'
}

export type PostRelation = {
  __typename?: 'PostRelation';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  type: Maybe<Scalars['String']['output']>;
  sourcePostId: Maybe<Scalars['String']['output']>;
  sourcePost: Maybe<Post>;
  targetPostId: Maybe<Scalars['String']['output']>;
  targetPost: Maybe<Post>;
  order: Maybe<Scalars['Float']['output']>;
};

export type DeletePostRelationInput = {
  selector: PostRelationSelectorUniqueInput;
};

export type SinglePostRelationInput = {
  selector: InputMaybe<PostRelationSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPostRelationInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostRelationSelectorInput>;
  orderBy: InputMaybe<PostRelationOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePostRelationOutput = {
  __typename?: 'SinglePostRelationOutput';
  result: Maybe<PostRelation>;
};

export type MultiPostRelationOutput = {
  __typename?: 'MultiPostRelationOutput';
  results: Maybe<Array<Maybe<PostRelation>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PostRelationOutput = {
  __typename?: 'PostRelationOutput';
  data: Maybe<PostRelation>;
};

export type CreatePostRelationInput = {
  data: CreatePostRelationDataInput;
};

export type CreatePostRelationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
  sourcePostId: Scalars['String']['input'];
  targetPostId: Scalars['String']['input'];
  order: InputMaybe<Scalars['Float']['input']>;
};

export type UpdatePostRelationInput = {
  selector: PostRelationSelectorUniqueInput;
  data: UpdatePostRelationDataInput;
};

export type UpsertPostRelationInput = {
  selector: PostRelationSelectorUniqueInput;
  data: UpdatePostRelationDataInput;
};

export type UpdatePostRelationDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
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

export enum PostRelationOrderByInput {
  Foobar = 'foobar'
}

export type PostViewTime = {
  __typename?: 'PostViewTime';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeletePostViewTimeInput = {
  selector: PostViewTimeSelectorUniqueInput;
};

export type SinglePostViewTimeInput = {
  selector: InputMaybe<PostViewTimeSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPostViewTimeInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostViewTimeSelectorInput>;
  orderBy: InputMaybe<PostViewTimeOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePostViewTimeOutput = {
  __typename?: 'SinglePostViewTimeOutput';
  result: Maybe<PostViewTime>;
};

export type MultiPostViewTimeOutput = {
  __typename?: 'MultiPostViewTimeOutput';
  results: Maybe<Array<Maybe<PostViewTime>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PostViewTimeOutput = {
  __typename?: 'PostViewTimeOutput';
  data: Maybe<PostViewTime>;
};

export type CreatePostViewTimeInput = {
  data: CreatePostViewTimeDataInput;
};

export type CreatePostViewTimeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePostViewTimeInput = {
  selector: PostViewTimeSelectorUniqueInput;
  data: UpdatePostViewTimeDataInput;
};

export type UpsertPostViewTimeInput = {
  selector: PostViewTimeSelectorUniqueInput;
  data: UpdatePostViewTimeDataInput;
};

export type UpdatePostViewTimeDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum PostViewTimeOrderByInput {
  Foobar = 'foobar'
}

export type PostViews = {
  __typename?: 'PostViews';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeletePostViewsInput = {
  selector: PostViewsSelectorUniqueInput;
};

export type SinglePostViewsInput = {
  selector: InputMaybe<PostViewsSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPostViewsInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostViewsSelectorInput>;
  orderBy: InputMaybe<PostViewsOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePostViewsOutput = {
  __typename?: 'SinglePostViewsOutput';
  result: Maybe<PostViews>;
};

export type MultiPostViewsOutput = {
  __typename?: 'MultiPostViewsOutput';
  results: Maybe<Array<Maybe<PostViews>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PostViewsOutput = {
  __typename?: 'PostViewsOutput';
  data: Maybe<PostViews>;
};

export type CreatePostViewsInput = {
  data: CreatePostViewsDataInput;
};

export type CreatePostViewsDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdatePostViewsInput = {
  selector: PostViewsSelectorUniqueInput;
  data: UpdatePostViewsDataInput;
};

export type UpsertPostViewsInput = {
  selector: PostViewsSelectorUniqueInput;
  data: UpdatePostViewsDataInput;
};

export type UpdatePostViewsDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum PostViewsOrderByInput {
  Foobar = 'foobar'
}

export type Post = {
  __typename?: 'Post';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  revisions: Maybe<Array<Maybe<Revision>>>;
  version: Maybe<Scalars['String']['output']>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  moderationGuidelines: Maybe<Revision>;
  moderationGuidelines_latest: Maybe<Scalars['String']['output']>;
  customHighlight: Maybe<Revision>;
  customHighlight_latest: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
  modifiedAt: Maybe<Scalars['Date']['output']>;
  url: Maybe<Scalars['String']['output']>;
  postCategory: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  viewCount: Maybe<Scalars['Float']['output']>;
  lastCommentedAt: Maybe<Scalars['Date']['output']>;
  clickCount: Maybe<Scalars['Float']['output']>;
  deletedDraft: Maybe<Scalars['Boolean']['output']>;
  status: Maybe<Scalars['Float']['output']>;
  isFuture: Maybe<Scalars['Boolean']['output']>;
  sticky: Maybe<Scalars['Boolean']['output']>;
  stickyPriority: Maybe<Scalars['Int']['output']>;
  userIP: Maybe<Scalars['String']['output']>;
  userAgent: Maybe<Scalars['String']['output']>;
  referrer: Maybe<Scalars['String']['output']>;
  author: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  domain: Maybe<Scalars['String']['output']>;
  pageUrl: Scalars['String']['output'];
  pageUrlRelative: Maybe<Scalars['String']['output']>;
  linkUrl: Maybe<Scalars['String']['output']>;
  postedAtFormatted: Maybe<Scalars['String']['output']>;
  emailShareUrl: Maybe<Scalars['String']['output']>;
  twitterShareUrl: Maybe<Scalars['String']['output']>;
  facebookShareUrl: Maybe<Scalars['String']['output']>;
  socialPreviewImageUrl: Maybe<Scalars['String']['output']>;
  question: Maybe<Scalars['Boolean']['output']>;
  authorIsUnreviewed: Maybe<Scalars['Boolean']['output']>;
  readTimeMinutesOverride: Maybe<Scalars['Float']['output']>;
  readTimeMinutes: Scalars['Int']['output'];
  wordCount: Maybe<Scalars['Int']['output']>;
  htmlBody: Maybe<Scalars['String']['output']>;
  submitToFrontpage: Maybe<Scalars['Boolean']['output']>;
  hiddenRelatedQuestion: Maybe<Scalars['Boolean']['output']>;
  originalPostRelationSourceId: Maybe<Scalars['String']['output']>;
  sourcePostRelations: Array<PostRelation>;
  targetPostRelations: Array<PostRelation>;
  shortform: Maybe<Scalars['Boolean']['output']>;
  canonicalSource: Maybe<Scalars['String']['output']>;
  nominationCount2018: Maybe<Scalars['Float']['output']>;
  nominationCount2019: Maybe<Scalars['Float']['output']>;
  reviewCount2018: Maybe<Scalars['Float']['output']>;
  reviewCount2019: Maybe<Scalars['Float']['output']>;
  reviewCount: Maybe<Scalars['Float']['output']>;
  reviewVoteCount: Maybe<Scalars['Float']['output']>;
  positiveReviewVoteCount: Maybe<Scalars['Float']['output']>;
  manifoldReviewMarketId: Maybe<Scalars['String']['output']>;
  annualReviewMarketProbability: Maybe<Scalars['Float']['output']>;
  annualReviewMarketIsResolved: Maybe<Scalars['Boolean']['output']>;
  annualReviewMarketYear: Maybe<Scalars['Int']['output']>;
  annualReviewMarketUrl: Maybe<Scalars['String']['output']>;
  glossary: Array<JargonTerm>;
  reviewVoteScoreAF: Maybe<Scalars['Float']['output']>;
  reviewVotesAF: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  reviewVoteScoreHighKarma: Maybe<Scalars['Float']['output']>;
  reviewVotesHighKarma: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  reviewVoteScoreAllKarma: Maybe<Scalars['Float']['output']>;
  reviewVotesAllKarma: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  finalReviewVoteScoreHighKarma: Maybe<Scalars['Float']['output']>;
  finalReviewVotesHighKarma: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  finalReviewVoteScoreAllKarma: Maybe<Scalars['Float']['output']>;
  finalReviewVotesAllKarma: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  finalReviewVoteScoreAF: Maybe<Scalars['Float']['output']>;
  finalReviewVotesAF: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
  lastCommentPromotedAt: Maybe<Scalars['Date']['output']>;
  tagRel: Maybe<TagRel>;
  tags: Maybe<Array<Maybe<Tag>>>;
  tagRelevance: Maybe<Scalars['JSON']['output']>;
  lastPromotedComment: Maybe<Comment>;
  bestAnswer: Maybe<Comment>;
  noIndex: Maybe<Scalars['Boolean']['output']>;
  rsvps: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  rsvpCounts: Scalars['JSON']['output'];
  activateRSVPs: Maybe<Scalars['Boolean']['output']>;
  nextDayReminderSent: Maybe<Scalars['Boolean']['output']>;
  onlyVisibleToLoggedIn: Maybe<Scalars['Boolean']['output']>;
  onlyVisibleToEstablishedAccounts: Maybe<Scalars['Boolean']['output']>;
  hideFromRecentDiscussions: Maybe<Scalars['Boolean']['output']>;
  currentUserReviewVote: Maybe<ReviewVote>;
  reviewWinner: Maybe<ReviewWinner>;
  spotlight: Maybe<Spotlight>;
  votingSystem: Maybe<Scalars['String']['output']>;
  myEditorAccess: Scalars['String']['output'];
  podcastEpisodeId: Maybe<Scalars['String']['output']>;
  podcastEpisode: Maybe<PodcastEpisode>;
  forceAllowType3Audio: Maybe<Scalars['Boolean']['output']>;
  legacy: Maybe<Scalars['Boolean']['output']>;
  legacyId: Maybe<Scalars['String']['output']>;
  legacySpam: Maybe<Scalars['Boolean']['output']>;
  feedId: Maybe<Scalars['String']['output']>;
  feed: Maybe<RssFeed>;
  feedLink: Maybe<Scalars['String']['output']>;
  lastVisitedAt: Maybe<Scalars['Date']['output']>;
  isRead: Maybe<Scalars['Boolean']['output']>;
  curatedDate: Maybe<Scalars['Date']['output']>;
  metaDate: Maybe<Scalars['Date']['output']>;
  suggestForCuratedUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  suggestForCuratedUsernames: Maybe<Scalars['String']['output']>;
  frontpageDate: Maybe<Scalars['Date']['output']>;
  autoFrontpage: Maybe<Scalars['String']['output']>;
  collectionTitle: Maybe<Scalars['String']['output']>;
  coauthorStatuses: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  coauthors: Maybe<Array<User>>;
  hasCoauthorPermission: Maybe<Scalars['Boolean']['output']>;
  socialPreviewImageId: Maybe<Scalars['String']['output']>;
  socialPreviewImageAutoUrl: Maybe<Scalars['String']['output']>;
  socialPreview: Maybe<Scalars['JSON']['output']>;
  socialPreviewData: Maybe<SocialPreviewType>;
  fmCrosspost: Maybe<Scalars['JSON']['output']>;
  canonicalSequenceId: Maybe<Scalars['String']['output']>;
  canonicalSequence: Maybe<Sequence>;
  canonicalCollectionSlug: Maybe<Scalars['String']['output']>;
  canonicalCollection: Maybe<Collection>;
  canonicalBookId: Maybe<Scalars['String']['output']>;
  canonicalBook: Maybe<Book>;
  canonicalNextPostSlug: Maybe<Scalars['String']['output']>;
  canonicalPrevPostSlug: Maybe<Scalars['String']['output']>;
  nextPost: Maybe<Post>;
  prevPost: Maybe<Post>;
  sequence: Maybe<Sequence>;
  unlisted: Maybe<Scalars['Boolean']['output']>;
  disableRecommendation: Maybe<Scalars['Boolean']['output']>;
  defaultRecommendation: Maybe<Scalars['Boolean']['output']>;
  hideFromPopularComments: Maybe<Scalars['Boolean']['output']>;
  draft: Maybe<Scalars['Boolean']['output']>;
  wasEverUndrafted: Maybe<Scalars['Boolean']['output']>;
  meta: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageComments: Maybe<Scalars['Boolean']['output']>;
  maxBaseScore: Maybe<Scalars['Float']['output']>;
  scoreExceeded2Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded30Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded45Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded75Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded125Date: Maybe<Scalars['Date']['output']>;
  scoreExceeded200Date: Maybe<Scalars['Date']['output']>;
  bannedUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  commentsLocked: Maybe<Scalars['Boolean']['output']>;
  commentsLockedToAccountsCreatedAfter: Maybe<Scalars['Date']['output']>;
  organizerIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  organizers: Array<User>;
  groupId: Maybe<Scalars['String']['output']>;
  group: Maybe<Localgroup>;
  eventType: Maybe<Scalars['String']['output']>;
  isEvent: Maybe<Scalars['Boolean']['output']>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  reviewedByUser: Maybe<User>;
  reviewForCuratedUserId: Maybe<Scalars['String']['output']>;
  startTime: Maybe<Scalars['Date']['output']>;
  localStartTime: Maybe<Scalars['Date']['output']>;
  endTime: Maybe<Scalars['Date']['output']>;
  localEndTime: Maybe<Scalars['Date']['output']>;
  eventRegistrationLink: Maybe<Scalars['String']['output']>;
  joinEventLink: Maybe<Scalars['String']['output']>;
  onlineEvent: Maybe<Scalars['Boolean']['output']>;
  globalEvent: Maybe<Scalars['Boolean']['output']>;
  mongoLocation: Maybe<Scalars['JSON']['output']>;
  googleLocation: Maybe<Scalars['JSON']['output']>;
  location: Maybe<Scalars['String']['output']>;
  contactInfo: Maybe<Scalars['String']['output']>;
  facebookLink: Maybe<Scalars['String']['output']>;
  meetupLink: Maybe<Scalars['String']['output']>;
  website: Maybe<Scalars['String']['output']>;
  eventImageId: Maybe<Scalars['String']['output']>;
  types: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  metaSticky: Maybe<Scalars['Boolean']['output']>;
  sharingSettings: Maybe<Scalars['JSON']['output']>;
  shareWithUsers: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  usersSharedWith: Array<User>;
  linkSharingKey: Maybe<Scalars['String']['output']>;
  linkSharingKeyUsedBy: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  commentSortOrder: Maybe<Scalars['String']['output']>;
  hideAuthor: Maybe<Scalars['Boolean']['output']>;
  tableOfContents: Maybe<Scalars['JSON']['output']>;
  tableOfContentsRevision: Maybe<Scalars['JSON']['output']>;
  sideComments: Maybe<Scalars['JSON']['output']>;
  sideCommentsCache: Maybe<SideCommentCache>;
  sideCommentVisibility: Maybe<Scalars['String']['output']>;
  disableSidenotes: Maybe<Scalars['Boolean']['output']>;
  moderationStyle: Maybe<Scalars['String']['output']>;
  ignoreRateLimits: Maybe<Scalars['Boolean']['output']>;
  hideCommentKarma: Maybe<Scalars['Boolean']['output']>;
  commentCount: Maybe<Scalars['Float']['output']>;
  topLevelCommentCount: Maybe<Scalars['Float']['output']>;
  recentComments: Maybe<Array<Maybe<Comment>>>;
  languageModelSummary: Scalars['String']['output'];
  debate: Maybe<Scalars['Boolean']['output']>;
  collabEditorDialogue: Maybe<Scalars['Boolean']['output']>;
  totalDialogueResponseCount: Scalars['Int']['output'];
  mostRecentPublishedDialogueResponseDate: Maybe<Scalars['Date']['output']>;
  unreadDebateResponseCount: Scalars['Int']['output'];
  emojiReactors: Maybe<Scalars['JSON']['output']>;
  commentEmojiReactors: Maybe<Scalars['JSON']['output']>;
  rejected: Maybe<Scalars['Boolean']['output']>;
  rejectedReason: Maybe<Scalars['String']['output']>;
  rejectedByUserId: Maybe<Scalars['String']['output']>;
  rejectedByUser: Maybe<User>;
  dialogTooltipPreview: Maybe<Scalars['String']['output']>;
  dialogueMessageContents: Maybe<Scalars['String']['output']>;
  firstVideoAttribsForPreview: Maybe<Scalars['JSON']['output']>;
  subforumTagId: Maybe<Scalars['String']['output']>;
  subforumTag: Maybe<Tag>;
  af: Maybe<Scalars['Boolean']['output']>;
  afDate: Maybe<Scalars['Date']['output']>;
  afCommentCount: Maybe<Scalars['Float']['output']>;
  afLastCommentedAt: Maybe<Scalars['Date']['output']>;
  afSticky: Maybe<Scalars['Boolean']['output']>;
  suggestForAlignmentUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  suggestForAlignmentUsers: Array<User>;
  reviewForAlignmentUserId: Maybe<Scalars['String']['output']>;
  agentFoundationsId: Maybe<Scalars['String']['output']>;
  swrCachingEnabled: Maybe<Scalars['Boolean']['output']>;
  generateDraftJargon: Maybe<Scalars['Boolean']['output']>;
  curationNotices: Maybe<Array<Maybe<CurationNotice>>>;
  reviews: Maybe<Array<Maybe<Comment>>>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
};


export type PostContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type PostRevisionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type PostModerationGuidelinesArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type PostCustomHighlightArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type PostTagRelArgs = {
  tagId: InputMaybe<Scalars['String']['input']>;
};


export type PostNextPostArgs = {
  sequenceId: InputMaybe<Scalars['String']['input']>;
};


export type PostPrevPostArgs = {
  sequenceId: InputMaybe<Scalars['String']['input']>;
};


export type PostSequenceArgs = {
  sequenceId: InputMaybe<Scalars['String']['input']>;
  prevOrNext: InputMaybe<Scalars['String']['input']>;
};


export type PostTableOfContentsRevisionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type PostRecentCommentsArgs = {
  commentsLimit: InputMaybe<Scalars['Int']['input']>;
  maxAgeHours: InputMaybe<Scalars['Int']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type PostDialogueMessageContentsArgs = {
  dialogueMessageId: InputMaybe<Scalars['String']['input']>;
};

export type DeletePostInput = {
  selector: PostSelectorUniqueInput;
};

export type SinglePostInput = {
  selector: InputMaybe<PostSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiPostInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<PostSelectorInput>;
  orderBy: InputMaybe<PostOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SinglePostOutput = {
  __typename?: 'SinglePostOutput';
  result: Maybe<Post>;
};

export type MultiPostOutput = {
  __typename?: 'MultiPostOutput';
  results: Maybe<Array<Maybe<Post>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type PostOutput = {
  __typename?: 'PostOutput';
  data: Maybe<Post>;
};

export type CreatePostInput = {
  data: CreatePostDataInput;
};

export type CreatePostDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  customHighlight: InputMaybe<Scalars['JSON']['input']>;
  postedAt: InputMaybe<Scalars['Date']['input']>;
  url: InputMaybe<Scalars['String']['input']>;
  postCategory: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  status: InputMaybe<Scalars['Float']['input']>;
  sticky: InputMaybe<Scalars['Boolean']['input']>;
  stickyPriority: InputMaybe<Scalars['Int']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  question: InputMaybe<Scalars['Boolean']['input']>;
  authorIsUnreviewed: InputMaybe<Scalars['Boolean']['input']>;
  readTimeMinutesOverride: InputMaybe<Scalars['Float']['input']>;
  submitToFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  hiddenRelatedQuestion: InputMaybe<Scalars['Boolean']['input']>;
  originalPostRelationSourceId: InputMaybe<Scalars['String']['input']>;
  shortform: InputMaybe<Scalars['Boolean']['input']>;
  canonicalSource: InputMaybe<Scalars['String']['input']>;
  manifoldReviewMarketId: InputMaybe<Scalars['String']['input']>;
  tagRelevance: InputMaybe<Scalars['JSON']['input']>;
  noIndex: InputMaybe<Scalars['Boolean']['input']>;
  activateRSVPs: InputMaybe<Scalars['Boolean']['input']>;
  nextDayReminderSent: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToLoggedIn: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToEstablishedAccounts: InputMaybe<Scalars['Boolean']['input']>;
  hideFromRecentDiscussions: InputMaybe<Scalars['Boolean']['input']>;
  podcastEpisodeId: InputMaybe<Scalars['String']['input']>;
  forceAllowType3Audio: InputMaybe<Scalars['Boolean']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  legacySpam: InputMaybe<Scalars['Boolean']['input']>;
  feedId: InputMaybe<Scalars['String']['input']>;
  feedLink: InputMaybe<Scalars['String']['input']>;
  curatedDate: InputMaybe<Scalars['Date']['input']>;
  metaDate: InputMaybe<Scalars['Date']['input']>;
  suggestForCuratedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  frontpageDate: InputMaybe<Scalars['Date']['input']>;
  autoFrontpage: InputMaybe<Scalars['String']['input']>;
  collectionTitle: InputMaybe<Scalars['String']['input']>;
  coauthorStatuses: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  hasCoauthorPermission: InputMaybe<Scalars['Boolean']['input']>;
  socialPreviewImageId: InputMaybe<Scalars['String']['input']>;
  socialPreviewImageAutoUrl: InputMaybe<Scalars['String']['input']>;
  socialPreview: InputMaybe<Scalars['JSON']['input']>;
  fmCrosspost: InputMaybe<Scalars['JSON']['input']>;
  canonicalSequenceId: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug: InputMaybe<Scalars['String']['input']>;
  canonicalBookId: InputMaybe<Scalars['String']['input']>;
  canonicalNextPostSlug: InputMaybe<Scalars['String']['input']>;
  canonicalPrevPostSlug: InputMaybe<Scalars['String']['input']>;
  unlisted: InputMaybe<Scalars['Boolean']['input']>;
  disableRecommendation: InputMaybe<Scalars['Boolean']['input']>;
  defaultRecommendation: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPopularComments: InputMaybe<Scalars['Boolean']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  wasEverUndrafted: InputMaybe<Scalars['Boolean']['input']>;
  meta: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageComments: InputMaybe<Scalars['Boolean']['input']>;
  bannedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  commentsLocked: InputMaybe<Scalars['Boolean']['input']>;
  commentsLockedToAccountsCreatedAfter: InputMaybe<Scalars['Date']['input']>;
  organizerIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  groupId: InputMaybe<Scalars['String']['input']>;
  eventType: InputMaybe<Scalars['String']['input']>;
  isEvent: InputMaybe<Scalars['Boolean']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  reviewForCuratedUserId: InputMaybe<Scalars['String']['input']>;
  startTime: InputMaybe<Scalars['Date']['input']>;
  endTime: InputMaybe<Scalars['Date']['input']>;
  eventRegistrationLink: InputMaybe<Scalars['String']['input']>;
  joinEventLink: InputMaybe<Scalars['String']['input']>;
  onlineEvent: InputMaybe<Scalars['Boolean']['input']>;
  globalEvent: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  contactInfo: InputMaybe<Scalars['String']['input']>;
  facebookLink: InputMaybe<Scalars['String']['input']>;
  meetupLink: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
  eventImageId: InputMaybe<Scalars['String']['input']>;
  types: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  metaSticky: InputMaybe<Scalars['Boolean']['input']>;
  sharingSettings: InputMaybe<Scalars['JSON']['input']>;
  shareWithUsers: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  commentSortOrder: InputMaybe<Scalars['String']['input']>;
  hideAuthor: InputMaybe<Scalars['Boolean']['input']>;
  sideCommentVisibility: InputMaybe<Scalars['String']['input']>;
  disableSidenotes: InputMaybe<Scalars['Boolean']['input']>;
  moderationStyle: InputMaybe<Scalars['String']['input']>;
  ignoreRateLimits: InputMaybe<Scalars['Boolean']['input']>;
  hideCommentKarma: InputMaybe<Scalars['Boolean']['input']>;
  debate: InputMaybe<Scalars['Boolean']['input']>;
  collabEditorDialogue: InputMaybe<Scalars['Boolean']['input']>;
  rejected: InputMaybe<Scalars['Boolean']['input']>;
  rejectedReason: InputMaybe<Scalars['String']['input']>;
  rejectedByUserId: InputMaybe<Scalars['String']['input']>;
  subforumTagId: InputMaybe<Scalars['String']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
  afDate: InputMaybe<Scalars['Date']['input']>;
  afSticky: InputMaybe<Scalars['Boolean']['input']>;
  suggestForAlignmentUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  reviewForAlignmentUserId: InputMaybe<Scalars['String']['input']>;
  agentFoundationsId: InputMaybe<Scalars['String']['input']>;
  swrCachingEnabled: InputMaybe<Scalars['Boolean']['input']>;
  generateDraftJargon: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdatePostInput = {
  selector: PostSelectorUniqueInput;
  data: UpdatePostDataInput;
};

export type UpsertPostInput = {
  selector: PostSelectorUniqueInput;
  data: UpdatePostDataInput;
};

export type UpdatePostDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  customHighlight: InputMaybe<Scalars['JSON']['input']>;
  postedAt: InputMaybe<Scalars['Date']['input']>;
  url: InputMaybe<Scalars['String']['input']>;
  postCategory: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  deletedDraft: InputMaybe<Scalars['Boolean']['input']>;
  status: InputMaybe<Scalars['Float']['input']>;
  sticky: InputMaybe<Scalars['Boolean']['input']>;
  stickyPriority: InputMaybe<Scalars['Int']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  question: InputMaybe<Scalars['Boolean']['input']>;
  authorIsUnreviewed: InputMaybe<Scalars['Boolean']['input']>;
  readTimeMinutesOverride: InputMaybe<Scalars['Float']['input']>;
  submitToFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  hiddenRelatedQuestion: InputMaybe<Scalars['Boolean']['input']>;
  shortform: InputMaybe<Scalars['Boolean']['input']>;
  canonicalSource: InputMaybe<Scalars['String']['input']>;
  manifoldReviewMarketId: InputMaybe<Scalars['String']['input']>;
  tagRelevance: InputMaybe<Scalars['JSON']['input']>;
  noIndex: InputMaybe<Scalars['Boolean']['input']>;
  activateRSVPs: InputMaybe<Scalars['Boolean']['input']>;
  nextDayReminderSent: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToLoggedIn: InputMaybe<Scalars['Boolean']['input']>;
  onlyVisibleToEstablishedAccounts: InputMaybe<Scalars['Boolean']['input']>;
  hideFromRecentDiscussions: InputMaybe<Scalars['Boolean']['input']>;
  votingSystem: InputMaybe<Scalars['String']['input']>;
  podcastEpisodeId: InputMaybe<Scalars['String']['input']>;
  forceAllowType3Audio: InputMaybe<Scalars['Boolean']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  legacySpam: InputMaybe<Scalars['Boolean']['input']>;
  feedId: InputMaybe<Scalars['String']['input']>;
  feedLink: InputMaybe<Scalars['String']['input']>;
  curatedDate: InputMaybe<Scalars['Date']['input']>;
  metaDate: InputMaybe<Scalars['Date']['input']>;
  suggestForCuratedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  frontpageDate: InputMaybe<Scalars['Date']['input']>;
  autoFrontpage: InputMaybe<Scalars['String']['input']>;
  collectionTitle: InputMaybe<Scalars['String']['input']>;
  coauthorStatuses: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  hasCoauthorPermission: InputMaybe<Scalars['Boolean']['input']>;
  socialPreviewImageId: InputMaybe<Scalars['String']['input']>;
  socialPreviewImageAutoUrl: InputMaybe<Scalars['String']['input']>;
  socialPreview: InputMaybe<Scalars['JSON']['input']>;
  fmCrosspost: InputMaybe<Scalars['JSON']['input']>;
  canonicalSequenceId: InputMaybe<Scalars['String']['input']>;
  canonicalCollectionSlug: InputMaybe<Scalars['String']['input']>;
  canonicalBookId: InputMaybe<Scalars['String']['input']>;
  canonicalNextPostSlug: InputMaybe<Scalars['String']['input']>;
  canonicalPrevPostSlug: InputMaybe<Scalars['String']['input']>;
  unlisted: InputMaybe<Scalars['Boolean']['input']>;
  disableRecommendation: InputMaybe<Scalars['Boolean']['input']>;
  defaultRecommendation: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPopularComments: InputMaybe<Scalars['Boolean']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  wasEverUndrafted: InputMaybe<Scalars['Boolean']['input']>;
  meta: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageComments: InputMaybe<Scalars['Boolean']['input']>;
  bannedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  commentsLocked: InputMaybe<Scalars['Boolean']['input']>;
  commentsLockedToAccountsCreatedAfter: InputMaybe<Scalars['Date']['input']>;
  organizerIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  groupId: InputMaybe<Scalars['String']['input']>;
  eventType: InputMaybe<Scalars['String']['input']>;
  isEvent: InputMaybe<Scalars['Boolean']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  reviewForCuratedUserId: InputMaybe<Scalars['String']['input']>;
  startTime: InputMaybe<Scalars['Date']['input']>;
  endTime: InputMaybe<Scalars['Date']['input']>;
  eventRegistrationLink: InputMaybe<Scalars['String']['input']>;
  joinEventLink: InputMaybe<Scalars['String']['input']>;
  onlineEvent: InputMaybe<Scalars['Boolean']['input']>;
  globalEvent: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  contactInfo: InputMaybe<Scalars['String']['input']>;
  facebookLink: InputMaybe<Scalars['String']['input']>;
  meetupLink: InputMaybe<Scalars['String']['input']>;
  website: InputMaybe<Scalars['String']['input']>;
  eventImageId: InputMaybe<Scalars['String']['input']>;
  types: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  metaSticky: InputMaybe<Scalars['Boolean']['input']>;
  sharingSettings: InputMaybe<Scalars['JSON']['input']>;
  shareWithUsers: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  linkSharingKey: InputMaybe<Scalars['String']['input']>;
  commentSortOrder: InputMaybe<Scalars['String']['input']>;
  hideAuthor: InputMaybe<Scalars['Boolean']['input']>;
  sideCommentVisibility: InputMaybe<Scalars['String']['input']>;
  disableSidenotes: InputMaybe<Scalars['Boolean']['input']>;
  moderationStyle: InputMaybe<Scalars['String']['input']>;
  ignoreRateLimits: InputMaybe<Scalars['Boolean']['input']>;
  hideCommentKarma: InputMaybe<Scalars['Boolean']['input']>;
  debate: InputMaybe<Scalars['Boolean']['input']>;
  collabEditorDialogue: InputMaybe<Scalars['Boolean']['input']>;
  rejected: InputMaybe<Scalars['Boolean']['input']>;
  rejectedReason: InputMaybe<Scalars['String']['input']>;
  rejectedByUserId: InputMaybe<Scalars['String']['input']>;
  subforumTagId: InputMaybe<Scalars['String']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
  afDate: InputMaybe<Scalars['Date']['input']>;
  afSticky: InputMaybe<Scalars['Boolean']['input']>;
  suggestForAlignmentUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  reviewForAlignmentUserId: InputMaybe<Scalars['String']['input']>;
  agentFoundationsId: InputMaybe<Scalars['String']['input']>;
  swrCachingEnabled: InputMaybe<Scalars['Boolean']['input']>;
  generateDraftJargon: InputMaybe<Scalars['Boolean']['input']>;
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

export enum PostOrderByInput {
  Foobar = 'foobar'
}

export type RssFeed = {
  __typename?: 'RSSFeed';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  ownedByUser: Maybe<Scalars['Boolean']['output']>;
  displayFullContent: Maybe<Scalars['Boolean']['output']>;
  nickname: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  rawFeed: Maybe<Scalars['JSON']['output']>;
  setCanonicalUrl: Maybe<Scalars['Boolean']['output']>;
  importAsDraft: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteRssFeedInput = {
  selector: RssFeedSelectorUniqueInput;
};

export type SingleRssFeedInput = {
  selector: InputMaybe<RssFeedSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiRssFeedInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<RssFeedSelectorInput>;
  orderBy: InputMaybe<RssFeedOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleRssFeedOutput = {
  __typename?: 'SingleRSSFeedOutput';
  result: Maybe<RssFeed>;
};

export type MultiRssFeedOutput = {
  __typename?: 'MultiRSSFeedOutput';
  results: Maybe<Array<Maybe<RssFeed>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type RssFeedOutput = {
  __typename?: 'RSSFeedOutput';
  data: Maybe<RssFeed>;
};

export type CreateRssFeedInput = {
  data: CreateRssFeedDataInput;
};

export type CreateRssFeedDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  ownedByUser: InputMaybe<Scalars['Boolean']['input']>;
  displayFullContent: InputMaybe<Scalars['Boolean']['input']>;
  nickname: InputMaybe<Scalars['String']['input']>;
  url: InputMaybe<Scalars['String']['input']>;
  rawFeed: InputMaybe<Scalars['JSON']['input']>;
  setCanonicalUrl: InputMaybe<Scalars['Boolean']['input']>;
  importAsDraft: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateRssFeedInput = {
  selector: RssFeedSelectorUniqueInput;
  data: UpdateRssFeedDataInput;
};

export type UpsertRssFeedInput = {
  selector: RssFeedSelectorUniqueInput;
  data: UpdateRssFeedDataInput;
};

export type UpdateRssFeedDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  ownedByUser: InputMaybe<Scalars['Boolean']['input']>;
  displayFullContent: InputMaybe<Scalars['Boolean']['input']>;
  nickname: InputMaybe<Scalars['String']['input']>;
  url: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
  rawFeed: InputMaybe<Scalars['JSON']['input']>;
  setCanonicalUrl: InputMaybe<Scalars['Boolean']['input']>;
  importAsDraft: InputMaybe<Scalars['Boolean']['input']>;
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

export enum RssFeedOrderByInput {
  Foobar = 'foobar'
}

export type ReadStatus = {
  __typename?: 'ReadStatus';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteReadStatusInput = {
  selector: ReadStatusSelectorUniqueInput;
};

export type SingleReadStatusInput = {
  selector: InputMaybe<ReadStatusSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiReadStatusInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReadStatusSelectorInput>;
  orderBy: InputMaybe<ReadStatusOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleReadStatusOutput = {
  __typename?: 'SingleReadStatusOutput';
  result: Maybe<ReadStatus>;
};

export type MultiReadStatusOutput = {
  __typename?: 'MultiReadStatusOutput';
  results: Maybe<Array<Maybe<ReadStatus>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ReadStatusOutput = {
  __typename?: 'ReadStatusOutput';
  data: Maybe<ReadStatus>;
};

export type CreateReadStatusInput = {
  data: CreateReadStatusDataInput;
};

export type CreateReadStatusDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateReadStatusInput = {
  selector: ReadStatusSelectorUniqueInput;
  data: UpdateReadStatusDataInput;
};

export type UpsertReadStatusInput = {
  selector: ReadStatusSelectorUniqueInput;
  data: UpdateReadStatusDataInput;
};

export type UpdateReadStatusDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum ReadStatusOrderByInput {
  Foobar = 'foobar'
}

export type RecommendationsCache = {
  __typename?: 'RecommendationsCache';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
  scenario: Maybe<Scalars['String']['output']>;
  attributionId: Maybe<Scalars['String']['output']>;
  ttlMs: Maybe<Scalars['Float']['output']>;
};

export type DeleteRecommendationsCacheInput = {
  selector: RecommendationsCacheSelectorUniqueInput;
};

export type SingleRecommendationsCacheInput = {
  selector: InputMaybe<RecommendationsCacheSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiRecommendationsCacheInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<RecommendationsCacheSelectorInput>;
  orderBy: InputMaybe<RecommendationsCacheOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleRecommendationsCacheOutput = {
  __typename?: 'SingleRecommendationsCacheOutput';
  result: Maybe<RecommendationsCache>;
};

export type MultiRecommendationsCacheOutput = {
  __typename?: 'MultiRecommendationsCacheOutput';
  results: Maybe<Array<Maybe<RecommendationsCache>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type RecommendationsCacheOutput = {
  __typename?: 'RecommendationsCacheOutput';
  data: Maybe<RecommendationsCache>;
};

export type CreateRecommendationsCacheInput = {
  data: CreateRecommendationsCacheDataInput;
};

export type CreateRecommendationsCacheDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  source: Scalars['String']['input'];
  scenario: Scalars['String']['input'];
  attributionId: Scalars['String']['input'];
  ttlMs: Scalars['Float']['input'];
};

export type UpdateRecommendationsCacheInput = {
  selector: RecommendationsCacheSelectorUniqueInput;
  data: UpdateRecommendationsCacheDataInput;
};

export type UpsertRecommendationsCacheInput = {
  selector: RecommendationsCacheSelectorUniqueInput;
  data: UpdateRecommendationsCacheDataInput;
};

export type UpdateRecommendationsCacheDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  source: InputMaybe<Scalars['String']['input']>;
  scenario: InputMaybe<Scalars['String']['input']>;
  attributionId: InputMaybe<Scalars['String']['input']>;
  ttlMs: InputMaybe<Scalars['Float']['input']>;
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

export enum RecommendationsCacheOrderByInput {
  Foobar = 'foobar'
}

export type Report = {
  __typename?: 'Report';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: User;
  reportedUserId: Maybe<Scalars['String']['output']>;
  reportedUser: Maybe<User>;
  commentId: Maybe<Scalars['String']['output']>;
  comment: Maybe<Comment>;
  postId: Maybe<Scalars['String']['output']>;
  post: Maybe<Post>;
  link: Maybe<Scalars['String']['output']>;
  claimedUserId: Maybe<Scalars['String']['output']>;
  claimedUser: Maybe<User>;
  description: Maybe<Scalars['String']['output']>;
  closedAt: Maybe<Scalars['Date']['output']>;
  markedAsSpam: Maybe<Scalars['Boolean']['output']>;
  reportedAsSpam: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteReportInput = {
  selector: ReportSelectorUniqueInput;
};

export type SingleReportInput = {
  selector: InputMaybe<ReportSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiReportInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReportSelectorInput>;
  orderBy: InputMaybe<ReportOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleReportOutput = {
  __typename?: 'SingleReportOutput';
  result: Maybe<Report>;
};

export type MultiReportOutput = {
  __typename?: 'MultiReportOutput';
  results: Maybe<Array<Maybe<Report>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ReportOutput = {
  __typename?: 'ReportOutput';
  data: Maybe<Report>;
};

export type CreateReportInput = {
  data: CreateReportDataInput;
};

export type CreateReportDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  reportedUserId: InputMaybe<Scalars['String']['input']>;
  commentId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  link: Scalars['String']['input'];
  claimedUserId: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  reportedAsSpam: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateReportInput = {
  selector: ReportSelectorUniqueInput;
  data: UpdateReportDataInput;
};

export type UpsertReportInput = {
  selector: ReportSelectorUniqueInput;
  data: UpdateReportDataInput;
};

export type UpdateReportDataInput = {
  createdAt: InputMaybe<Scalars['Date']['input']>;
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  claimedUserId: InputMaybe<Scalars['String']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  closedAt: InputMaybe<Scalars['Date']['input']>;
  markedAsSpam: InputMaybe<Scalars['Boolean']['input']>;
  reportedAsSpam: InputMaybe<Scalars['Boolean']['input']>;
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

export enum ReportOrderByInput {
  Foobar = 'foobar'
}

export type ReviewVote = {
  __typename?: 'ReviewVote';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  postId: Maybe<Scalars['String']['output']>;
  post: Maybe<Post>;
  qualitativeScore: Maybe<Scalars['Int']['output']>;
  quadraticScore: Maybe<Scalars['Int']['output']>;
  comment: Maybe<Scalars['String']['output']>;
  year: Maybe<Scalars['String']['output']>;
  dummy: Maybe<Scalars['Boolean']['output']>;
  reactions: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type DeleteReviewVoteInput = {
  selector: ReviewVoteSelectorUniqueInput;
};

export type SingleReviewVoteInput = {
  selector: InputMaybe<ReviewVoteSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiReviewVoteInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReviewVoteSelectorInput>;
  orderBy: InputMaybe<ReviewVoteOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleReviewVoteOutput = {
  __typename?: 'SingleReviewVoteOutput';
  result: Maybe<ReviewVote>;
};

export type MultiReviewVoteOutput = {
  __typename?: 'MultiReviewVoteOutput';
  results: Maybe<Array<Maybe<ReviewVote>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ReviewVoteOutput = {
  __typename?: 'ReviewVoteOutput';
  data: Maybe<ReviewVote>;
};

export type CreateReviewVoteInput = {
  data: CreateReviewVoteDataInput;
};

export type CreateReviewVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateReviewVoteInput = {
  selector: ReviewVoteSelectorUniqueInput;
  data: UpdateReviewVoteDataInput;
};

export type UpsertReviewVoteInput = {
  selector: ReviewVoteSelectorUniqueInput;
  data: UpdateReviewVoteDataInput;
};

export type UpdateReviewVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum ReviewVoteOrderByInput {
  Foobar = 'foobar'
}

export type ReviewWinnerArt = {
  __typename?: 'ReviewWinnerArt';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  splashArtImagePrompt: Maybe<Scalars['String']['output']>;
  splashArtImageUrl: Maybe<Scalars['String']['output']>;
  activeSplashArtCoordinates: Maybe<SplashArtCoordinate>;
};

export type DeleteReviewWinnerArtInput = {
  selector: ReviewWinnerArtSelectorUniqueInput;
};

export type SingleReviewWinnerArtInput = {
  selector: InputMaybe<ReviewWinnerArtSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiReviewWinnerArtInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReviewWinnerArtSelectorInput>;
  orderBy: InputMaybe<ReviewWinnerArtOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleReviewWinnerArtOutput = {
  __typename?: 'SingleReviewWinnerArtOutput';
  result: Maybe<ReviewWinnerArt>;
};

export type MultiReviewWinnerArtOutput = {
  __typename?: 'MultiReviewWinnerArtOutput';
  results: Maybe<Array<Maybe<ReviewWinnerArt>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ReviewWinnerArtOutput = {
  __typename?: 'ReviewWinnerArtOutput';
  data: Maybe<ReviewWinnerArt>;
};

export type CreateReviewWinnerArtInput = {
  data: CreateReviewWinnerArtDataInput;
};

export type CreateReviewWinnerArtDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  splashArtImagePrompt: Scalars['String']['input'];
  splashArtImageUrl: Scalars['String']['input'];
};

export type UpdateReviewWinnerArtInput = {
  selector: ReviewWinnerArtSelectorUniqueInput;
  data: UpdateReviewWinnerArtDataInput;
};

export type UpsertReviewWinnerArtInput = {
  selector: ReviewWinnerArtSelectorUniqueInput;
  data: UpdateReviewWinnerArtDataInput;
};

export type UpdateReviewWinnerArtDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  splashArtImagePrompt: InputMaybe<Scalars['String']['input']>;
  splashArtImageUrl: InputMaybe<Scalars['String']['input']>;
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

export enum ReviewWinnerArtOrderByInput {
  Foobar = 'foobar'
}

export type ReviewWinner = {
  __typename?: 'ReviewWinner';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  post: Post;
  reviewWinnerArt: Maybe<ReviewWinnerArt>;
  competitorCount: Maybe<Scalars['Int']['output']>;
  reviewYear: Maybe<Scalars['Float']['output']>;
  category: Maybe<Scalars['String']['output']>;
  curatedOrder: Maybe<Scalars['Float']['output']>;
  reviewRanking: Maybe<Scalars['Float']['output']>;
  isAI: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteReviewWinnerInput = {
  selector: ReviewWinnerSelectorUniqueInput;
};

export type SingleReviewWinnerInput = {
  selector: InputMaybe<ReviewWinnerSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiReviewWinnerInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<ReviewWinnerSelectorInput>;
  orderBy: InputMaybe<ReviewWinnerOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleReviewWinnerOutput = {
  __typename?: 'SingleReviewWinnerOutput';
  result: Maybe<ReviewWinner>;
};

export type MultiReviewWinnerOutput = {
  __typename?: 'MultiReviewWinnerOutput';
  results: Maybe<Array<Maybe<ReviewWinner>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type ReviewWinnerOutput = {
  __typename?: 'ReviewWinnerOutput';
  data: Maybe<ReviewWinner>;
};

export type CreateReviewWinnerInput = {
  data: CreateReviewWinnerDataInput;
};

export type CreateReviewWinnerDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: Scalars['String']['input'];
  reviewYear: Scalars['Float']['input'];
  category: Scalars['String']['input'];
  curatedOrder: InputMaybe<Scalars['Float']['input']>;
  reviewRanking: Scalars['Float']['input'];
  isAI: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateReviewWinnerInput = {
  selector: ReviewWinnerSelectorUniqueInput;
  data: UpdateReviewWinnerDataInput;
};

export type UpsertReviewWinnerInput = {
  selector: ReviewWinnerSelectorUniqueInput;
  data: UpdateReviewWinnerDataInput;
};

export type UpdateReviewWinnerDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  reviewYear: InputMaybe<Scalars['Float']['input']>;
  category: InputMaybe<Scalars['String']['input']>;
  curatedOrder: InputMaybe<Scalars['Float']['input']>;
  reviewRanking: InputMaybe<Scalars['Float']['input']>;
  isAI: InputMaybe<Scalars['Boolean']['input']>;
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

export enum ReviewWinnerOrderByInput {
  Foobar = 'foobar'
}

export type Revision = {
  __typename?: 'Revision';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  collectionName: Maybe<Scalars['String']['output']>;
  fieldName: Maybe<Scalars['String']['output']>;
  editedAt: Maybe<Scalars['Date']['output']>;
  updateType: Maybe<Scalars['String']['output']>;
  version: Maybe<Scalars['String']['output']>;
  commitMessage: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  draft: Maybe<Scalars['Boolean']['output']>;
  originalContents: Maybe<ContentType>;
  html: Maybe<Scalars['String']['output']>;
  markdown: Maybe<Scalars['String']['output']>;
  draftJS: Maybe<Scalars['JSON']['output']>;
  ckEditorMarkup: Maybe<Scalars['String']['output']>;
  wordCount: Maybe<Scalars['Float']['output']>;
  htmlHighlight: Scalars['String']['output'];
  htmlHighlightStartingAtHash: Scalars['String']['output'];
  plaintextDescription: Scalars['String']['output'];
  plaintextMainText: Scalars['String']['output'];
  hasFootnotes: Maybe<Scalars['Boolean']['output']>;
  changeMetrics: Maybe<Scalars['JSON']['output']>;
  googleDocMetadata: Maybe<Scalars['JSON']['output']>;
  skipAttributions: Maybe<Scalars['Boolean']['output']>;
  tag: Maybe<Tag>;
  post: Maybe<Post>;
  lens: Maybe<MultiDocument>;
  summary: Maybe<MultiDocument>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
};


export type RevisionHtmlHighlightStartingAtHashArgs = {
  hash: InputMaybe<Scalars['String']['input']>;
};

export type DeleteRevisionInput = {
  selector: RevisionSelectorUniqueInput;
};

export type SingleRevisionInput = {
  selector: InputMaybe<RevisionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiRevisionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<RevisionSelectorInput>;
  orderBy: InputMaybe<RevisionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleRevisionOutput = {
  __typename?: 'SingleRevisionOutput';
  result: Maybe<Revision>;
};

export type MultiRevisionOutput = {
  __typename?: 'MultiRevisionOutput';
  results: Maybe<Array<Maybe<Revision>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type RevisionOutput = {
  __typename?: 'RevisionOutput';
  data: Maybe<Revision>;
};

export type CreateRevisionInput = {
  data: CreateRevisionDataInput;
};

export type CreateRevisionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  updateType: InputMaybe<Scalars['String']['input']>;
  commitMessage: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRevisionInput = {
  selector: RevisionSelectorUniqueInput;
  data: UpdateRevisionDataInput;
};

export type UpsertRevisionInput = {
  selector: RevisionSelectorUniqueInput;
  data: UpdateRevisionDataInput;
};

export type UpdateRevisionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  skipAttributions: InputMaybe<Scalars['Boolean']['input']>;
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

export enum RevisionOrderByInput {
  Foobar = 'foobar'
}

export type Sequence = {
  __typename?: 'Sequence';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  title: Maybe<Scalars['String']['output']>;
  bannerImageId: Maybe<Scalars['String']['output']>;
  gridImageId: Maybe<Scalars['String']['output']>;
  hideFromAuthorPage: Maybe<Scalars['Boolean']['output']>;
  draft: Maybe<Scalars['Boolean']['output']>;
  isDeleted: Maybe<Scalars['Boolean']['output']>;
  curatedOrder: Maybe<Scalars['Float']['output']>;
  userProfileOrder: Maybe<Scalars['Float']['output']>;
  canonicalCollectionSlug: Maybe<Scalars['String']['output']>;
  canonicalCollection: Maybe<Collection>;
  hidden: Maybe<Scalars['Boolean']['output']>;
  noindex: Maybe<Scalars['Boolean']['output']>;
  postsCount: Scalars['Int']['output'];
  readPostsCount: Scalars['Int']['output'];
  chapters: Maybe<Array<Maybe<Chapter>>>;
  af: Maybe<Scalars['Boolean']['output']>;
};


export type SequenceContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteSequenceInput = {
  selector: SequenceSelectorUniqueInput;
};

export type SingleSequenceInput = {
  selector: InputMaybe<SequenceSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSequenceInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SequenceSelectorInput>;
  orderBy: InputMaybe<SequenceOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSequenceOutput = {
  __typename?: 'SingleSequenceOutput';
  result: Maybe<Sequence>;
};

export type MultiSequenceOutput = {
  __typename?: 'MultiSequenceOutput';
  results: Maybe<Array<Maybe<Sequence>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SequenceOutput = {
  __typename?: 'SequenceOutput';
  data: Maybe<Sequence>;
};

export type CreateSequenceInput = {
  data: CreateSequenceDataInput;
};

export type CreateSequenceDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  gridImageId: InputMaybe<Scalars['String']['input']>;
  hideFromAuthorPage: InputMaybe<Scalars['Boolean']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  isDeleted: InputMaybe<Scalars['Boolean']['input']>;
  curatedOrder: InputMaybe<Scalars['Float']['input']>;
  userProfileOrder: InputMaybe<Scalars['Float']['input']>;
  canonicalCollectionSlug: InputMaybe<Scalars['String']['input']>;
  hidden: InputMaybe<Scalars['Boolean']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateSequenceInput = {
  selector: SequenceSelectorUniqueInput;
  data: UpdateSequenceDataInput;
};

export type UpsertSequenceInput = {
  selector: SequenceSelectorUniqueInput;
  data: UpdateSequenceDataInput;
};

export type UpdateSequenceDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  title: InputMaybe<Scalars['String']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  gridImageId: InputMaybe<Scalars['String']['input']>;
  hideFromAuthorPage: InputMaybe<Scalars['Boolean']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  isDeleted: InputMaybe<Scalars['Boolean']['input']>;
  curatedOrder: InputMaybe<Scalars['Float']['input']>;
  userProfileOrder: InputMaybe<Scalars['Float']['input']>;
  canonicalCollectionSlug: InputMaybe<Scalars['String']['input']>;
  hidden: InputMaybe<Scalars['Boolean']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
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

export enum SequenceOrderByInput {
  Foobar = 'foobar'
}

export type Session = {
  __typename?: 'Session';
  _id: Maybe<Scalars['String']['output']>;
  session: Maybe<Scalars['JSON']['output']>;
  expires: Maybe<Scalars['Date']['output']>;
  lastModified: Maybe<Scalars['Date']['output']>;
};

export type DeleteSessionInput = {
  selector: SessionSelectorUniqueInput;
};

export type SingleSessionInput = {
  selector: InputMaybe<SessionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSessionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SessionSelectorInput>;
  orderBy: InputMaybe<SessionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSessionOutput = {
  __typename?: 'SingleSessionOutput';
  result: Maybe<Session>;
};

export type MultiSessionOutput = {
  __typename?: 'MultiSessionOutput';
  results: Maybe<Array<Maybe<Session>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SessionOutput = {
  __typename?: 'SessionOutput';
  data: Maybe<Session>;
};

export type CreateSessionInput = {
  data: CreateSessionDataInput;
};

export type CreateSessionDataInput = {
  _id: Scalars['String']['input'];
  session: InputMaybe<Scalars['JSON']['input']>;
  expires: InputMaybe<Scalars['Date']['input']>;
  lastModified: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateSessionInput = {
  selector: SessionSelectorUniqueInput;
  data: UpdateSessionDataInput;
};

export type UpsertSessionInput = {
  selector: SessionSelectorUniqueInput;
  data: UpdateSessionDataInput;
};

export type UpdateSessionDataInput = {
  _id: InputMaybe<Scalars['String']['input']>;
  session: InputMaybe<Scalars['JSON']['input']>;
  expires: InputMaybe<Scalars['Date']['input']>;
  lastModified: InputMaybe<Scalars['Date']['input']>;
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

export enum SessionOrderByInput {
  Foobar = 'foobar'
}

export type SideCommentCache = {
  __typename?: 'SideCommentCache';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  annotatedHtml: Maybe<Scalars['String']['output']>;
  commentsByBlock: Maybe<Scalars['JSON']['output']>;
  version: Maybe<Scalars['Float']['output']>;
};

export type DeleteSideCommentCacheInput = {
  selector: SideCommentCacheSelectorUniqueInput;
};

export type SingleSideCommentCacheInput = {
  selector: InputMaybe<SideCommentCacheSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSideCommentCacheInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SideCommentCacheSelectorInput>;
  orderBy: InputMaybe<SideCommentCacheOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSideCommentCacheOutput = {
  __typename?: 'SingleSideCommentCacheOutput';
  result: Maybe<SideCommentCache>;
};

export type MultiSideCommentCacheOutput = {
  __typename?: 'MultiSideCommentCacheOutput';
  results: Maybe<Array<Maybe<SideCommentCache>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SideCommentCacheOutput = {
  __typename?: 'SideCommentCacheOutput';
  data: Maybe<SideCommentCache>;
};

export type CreateSideCommentCacheInput = {
  data: CreateSideCommentCacheDataInput;
};

export type CreateSideCommentCacheDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateSideCommentCacheInput = {
  selector: SideCommentCacheSelectorUniqueInput;
  data: UpdateSideCommentCacheDataInput;
};

export type UpsertSideCommentCacheInput = {
  selector: SideCommentCacheSelectorUniqueInput;
  data: UpdateSideCommentCacheDataInput;
};

export type UpdateSideCommentCacheDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum SideCommentCacheOrderByInput {
  Foobar = 'foobar'
}

export type SplashArtCoordinate = {
  __typename?: 'SplashArtCoordinate';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  reviewWinnerArtId: Maybe<Scalars['String']['output']>;
  reviewWinnerArt: ReviewWinnerArt;
  leftXPct: Maybe<Scalars['Float']['output']>;
  leftYPct: Maybe<Scalars['Float']['output']>;
  leftHeightPct: Maybe<Scalars['Float']['output']>;
  leftWidthPct: Maybe<Scalars['Float']['output']>;
  leftFlipped: Maybe<Scalars['Boolean']['output']>;
  middleXPct: Maybe<Scalars['Float']['output']>;
  middleYPct: Maybe<Scalars['Float']['output']>;
  middleHeightPct: Maybe<Scalars['Float']['output']>;
  middleWidthPct: Maybe<Scalars['Float']['output']>;
  middleFlipped: Maybe<Scalars['Boolean']['output']>;
  rightXPct: Maybe<Scalars['Float']['output']>;
  rightYPct: Maybe<Scalars['Float']['output']>;
  rightHeightPct: Maybe<Scalars['Float']['output']>;
  rightWidthPct: Maybe<Scalars['Float']['output']>;
  rightFlipped: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteSplashArtCoordinateInput = {
  selector: SplashArtCoordinateSelectorUniqueInput;
};

export type SingleSplashArtCoordinateInput = {
  selector: InputMaybe<SplashArtCoordinateSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSplashArtCoordinateInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SplashArtCoordinateSelectorInput>;
  orderBy: InputMaybe<SplashArtCoordinateOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSplashArtCoordinateOutput = {
  __typename?: 'SingleSplashArtCoordinateOutput';
  result: Maybe<SplashArtCoordinate>;
};

export type MultiSplashArtCoordinateOutput = {
  __typename?: 'MultiSplashArtCoordinateOutput';
  results: Maybe<Array<Maybe<SplashArtCoordinate>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SplashArtCoordinateOutput = {
  __typename?: 'SplashArtCoordinateOutput';
  data: Maybe<SplashArtCoordinate>;
};

export type CreateSplashArtCoordinateInput = {
  data: CreateSplashArtCoordinateDataInput;
};

export type CreateSplashArtCoordinateDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  reviewWinnerArtId: Scalars['String']['input'];
  leftXPct: Scalars['Float']['input'];
  leftYPct: Scalars['Float']['input'];
  leftHeightPct: Scalars['Float']['input'];
  leftWidthPct: Scalars['Float']['input'];
  leftFlipped: InputMaybe<Scalars['Boolean']['input']>;
  middleXPct: Scalars['Float']['input'];
  middleYPct: Scalars['Float']['input'];
  middleHeightPct: Scalars['Float']['input'];
  middleWidthPct: Scalars['Float']['input'];
  middleFlipped: InputMaybe<Scalars['Boolean']['input']>;
  rightXPct: Scalars['Float']['input'];
  rightYPct: Scalars['Float']['input'];
  rightHeightPct: Scalars['Float']['input'];
  rightWidthPct: Scalars['Float']['input'];
  rightFlipped: Scalars['Boolean']['input'];
};

export type UpdateSplashArtCoordinateInput = {
  selector: SplashArtCoordinateSelectorUniqueInput;
  data: UpdateSplashArtCoordinateDataInput;
};

export type UpsertSplashArtCoordinateInput = {
  selector: SplashArtCoordinateSelectorUniqueInput;
  data: UpdateSplashArtCoordinateDataInput;
};

export type UpdateSplashArtCoordinateDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  reviewWinnerArtId: InputMaybe<Scalars['String']['input']>;
  leftXPct: InputMaybe<Scalars['Float']['input']>;
  leftYPct: InputMaybe<Scalars['Float']['input']>;
  leftHeightPct: InputMaybe<Scalars['Float']['input']>;
  leftWidthPct: InputMaybe<Scalars['Float']['input']>;
  leftFlipped: InputMaybe<Scalars['Boolean']['input']>;
  middleXPct: InputMaybe<Scalars['Float']['input']>;
  middleYPct: InputMaybe<Scalars['Float']['input']>;
  middleHeightPct: InputMaybe<Scalars['Float']['input']>;
  middleWidthPct: InputMaybe<Scalars['Float']['input']>;
  middleFlipped: InputMaybe<Scalars['Boolean']['input']>;
  rightXPct: InputMaybe<Scalars['Float']['input']>;
  rightYPct: InputMaybe<Scalars['Float']['input']>;
  rightHeightPct: InputMaybe<Scalars['Float']['input']>;
  rightWidthPct: InputMaybe<Scalars['Float']['input']>;
  rightFlipped: InputMaybe<Scalars['Boolean']['input']>;
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

export enum SplashArtCoordinateOrderByInput {
  Foobar = 'foobar'
}

export type Spotlight = {
  __typename?: 'Spotlight';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  description: Maybe<Revision>;
  description_latest: Maybe<Scalars['String']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  document: Post;
  post: Maybe<Post>;
  sequence: Maybe<Sequence>;
  tag: Maybe<Tag>;
  documentType: Maybe<Scalars['String']['output']>;
  position: Maybe<Scalars['Float']['output']>;
  duration: Maybe<Scalars['Float']['output']>;
  customTitle: Maybe<Scalars['String']['output']>;
  customSubtitle: Maybe<Scalars['String']['output']>;
  subtitleUrl: Maybe<Scalars['String']['output']>;
  headerTitle: Maybe<Scalars['String']['output']>;
  headerTitleLeftColor: Maybe<Scalars['String']['output']>;
  headerTitleRightColor: Maybe<Scalars['String']['output']>;
  lastPromotedAt: Maybe<Scalars['Date']['output']>;
  spotlightSplashImageUrl: Maybe<Scalars['String']['output']>;
  draft: Maybe<Scalars['Boolean']['output']>;
  deletedDraft: Maybe<Scalars['Boolean']['output']>;
  showAuthor: Maybe<Scalars['Boolean']['output']>;
  imageFade: Maybe<Scalars['Boolean']['output']>;
  imageFadeColor: Maybe<Scalars['String']['output']>;
  spotlightImageId: Maybe<Scalars['String']['output']>;
  spotlightDarkImageId: Maybe<Scalars['String']['output']>;
  sequenceChapters: Maybe<Array<Maybe<Chapter>>>;
};


export type SpotlightDescriptionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteSpotlightInput = {
  selector: SpotlightSelectorUniqueInput;
};

export type SingleSpotlightInput = {
  selector: InputMaybe<SpotlightSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSpotlightInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SpotlightSelectorInput>;
  orderBy: InputMaybe<SpotlightOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSpotlightOutput = {
  __typename?: 'SingleSpotlightOutput';
  result: Maybe<Spotlight>;
};

export type MultiSpotlightOutput = {
  __typename?: 'MultiSpotlightOutput';
  results: Maybe<Array<Maybe<Spotlight>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SpotlightOutput = {
  __typename?: 'SpotlightOutput';
  data: Maybe<Spotlight>;
};

export type CreateSpotlightInput = {
  data: CreateSpotlightDataInput;
};

export type CreateSpotlightDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  description: InputMaybe<Scalars['JSON']['input']>;
  documentId: Scalars['String']['input'];
  documentType: Scalars['String']['input'];
  position: InputMaybe<Scalars['Float']['input']>;
  duration: Scalars['Float']['input'];
  customTitle: InputMaybe<Scalars['String']['input']>;
  customSubtitle: InputMaybe<Scalars['String']['input']>;
  subtitleUrl: InputMaybe<Scalars['String']['input']>;
  headerTitle: InputMaybe<Scalars['String']['input']>;
  headerTitleLeftColor: InputMaybe<Scalars['String']['input']>;
  headerTitleRightColor: InputMaybe<Scalars['String']['input']>;
  lastPromotedAt: Scalars['Date']['input'];
  spotlightSplashImageUrl: InputMaybe<Scalars['String']['input']>;
  draft: Scalars['Boolean']['input'];
  showAuthor: InputMaybe<Scalars['Boolean']['input']>;
  imageFade: InputMaybe<Scalars['Boolean']['input']>;
  imageFadeColor: InputMaybe<Scalars['String']['input']>;
  spotlightImageId: InputMaybe<Scalars['String']['input']>;
  spotlightDarkImageId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSpotlightInput = {
  selector: SpotlightSelectorUniqueInput;
  data: UpdateSpotlightDataInput;
};

export type UpsertSpotlightInput = {
  selector: SpotlightSelectorUniqueInput;
  data: UpdateSpotlightDataInput;
};

export type UpdateSpotlightDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  description: InputMaybe<Scalars['JSON']['input']>;
  documentId: InputMaybe<Scalars['String']['input']>;
  documentType: InputMaybe<Scalars['String']['input']>;
  position: InputMaybe<Scalars['Float']['input']>;
  duration: InputMaybe<Scalars['Float']['input']>;
  customTitle: InputMaybe<Scalars['String']['input']>;
  customSubtitle: InputMaybe<Scalars['String']['input']>;
  subtitleUrl: InputMaybe<Scalars['String']['input']>;
  headerTitle: InputMaybe<Scalars['String']['input']>;
  headerTitleLeftColor: InputMaybe<Scalars['String']['input']>;
  headerTitleRightColor: InputMaybe<Scalars['String']['input']>;
  lastPromotedAt: InputMaybe<Scalars['Date']['input']>;
  spotlightSplashImageUrl: InputMaybe<Scalars['String']['input']>;
  draft: InputMaybe<Scalars['Boolean']['input']>;
  deletedDraft: InputMaybe<Scalars['Boolean']['input']>;
  showAuthor: InputMaybe<Scalars['Boolean']['input']>;
  imageFade: InputMaybe<Scalars['Boolean']['input']>;
  imageFadeColor: InputMaybe<Scalars['String']['input']>;
  spotlightImageId: InputMaybe<Scalars['String']['input']>;
  spotlightDarkImageId: InputMaybe<Scalars['String']['input']>;
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

export enum SpotlightOrderByInput {
  Foobar = 'foobar'
}

export type Subscription = {
  __typename?: 'Subscription';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: User;
  state: Maybe<Scalars['String']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  collectionName: Maybe<Scalars['String']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  type: Maybe<Scalars['String']['output']>;
};

export type DeleteSubscriptionInput = {
  selector: SubscriptionSelectorUniqueInput;
};

export type SingleSubscriptionInput = {
  selector: InputMaybe<SubscriptionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSubscriptionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SubscriptionSelectorInput>;
  orderBy: InputMaybe<SubscriptionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSubscriptionOutput = {
  __typename?: 'SingleSubscriptionOutput';
  result: Maybe<Subscription>;
};

export type MultiSubscriptionOutput = {
  __typename?: 'MultiSubscriptionOutput';
  results: Maybe<Array<Maybe<Subscription>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SubscriptionOutput = {
  __typename?: 'SubscriptionOutput';
  data: Maybe<Subscription>;
};

export type CreateSubscriptionInput = {
  data: CreateSubscriptionDataInput;
};

export type CreateSubscriptionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  state: Scalars['String']['input'];
  documentId: Scalars['String']['input'];
  collectionName: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type UpdateSubscriptionInput = {
  selector: SubscriptionSelectorUniqueInput;
  data: UpdateSubscriptionDataInput;
};

export type UpsertSubscriptionInput = {
  selector: SubscriptionSelectorUniqueInput;
  data: UpdateSubscriptionDataInput;
};

export type UpdateSubscriptionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum SubscriptionOrderByInput {
  Foobar = 'foobar'
}

export type SurveyQuestion = {
  __typename?: 'SurveyQuestion';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  surveyId: Maybe<Scalars['String']['output']>;
  survey: Survey;
  question: Maybe<Scalars['String']['output']>;
  format: Maybe<Scalars['String']['output']>;
  order: Maybe<Scalars['Float']['output']>;
};

export type DeleteSurveyQuestionInput = {
  selector: SurveyQuestionSelectorUniqueInput;
};

export type SingleSurveyQuestionInput = {
  selector: InputMaybe<SurveyQuestionSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSurveyQuestionInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SurveyQuestionSelectorInput>;
  orderBy: InputMaybe<SurveyQuestionOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSurveyQuestionOutput = {
  __typename?: 'SingleSurveyQuestionOutput';
  result: Maybe<SurveyQuestion>;
};

export type MultiSurveyQuestionOutput = {
  __typename?: 'MultiSurveyQuestionOutput';
  results: Maybe<Array<Maybe<SurveyQuestion>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SurveyQuestionOutput = {
  __typename?: 'SurveyQuestionOutput';
  data: Maybe<SurveyQuestion>;
};

export type CreateSurveyQuestionInput = {
  data: CreateSurveyQuestionDataInput;
};

export type CreateSurveyQuestionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  surveyId: Scalars['String']['input'];
  question: Scalars['String']['input'];
  format: Scalars['String']['input'];
  order: Scalars['Float']['input'];
};

export type UpdateSurveyQuestionInput = {
  selector: SurveyQuestionSelectorUniqueInput;
  data: UpdateSurveyQuestionDataInput;
};

export type UpsertSurveyQuestionInput = {
  selector: SurveyQuestionSelectorUniqueInput;
  data: UpdateSurveyQuestionDataInput;
};

export type UpdateSurveyQuestionDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  surveyId: InputMaybe<Scalars['String']['input']>;
  question: InputMaybe<Scalars['String']['input']>;
  format: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
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

export enum SurveyQuestionOrderByInput {
  Foobar = 'foobar'
}

export type SurveyResponse = {
  __typename?: 'SurveyResponse';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  surveyId: Maybe<Scalars['String']['output']>;
  survey: Survey;
  surveyScheduleId: Maybe<Scalars['String']['output']>;
  surveySchedule: Maybe<SurveySchedule>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  clientId: Maybe<Scalars['String']['output']>;
  client: Maybe<ClientId>;
  response: Maybe<Scalars['JSON']['output']>;
};

export type DeleteSurveyResponseInput = {
  selector: SurveyResponseSelectorUniqueInput;
};

export type SingleSurveyResponseInput = {
  selector: InputMaybe<SurveyResponseSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSurveyResponseInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SurveyResponseSelectorInput>;
  orderBy: InputMaybe<SurveyResponseOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSurveyResponseOutput = {
  __typename?: 'SingleSurveyResponseOutput';
  result: Maybe<SurveyResponse>;
};

export type MultiSurveyResponseOutput = {
  __typename?: 'MultiSurveyResponseOutput';
  results: Maybe<Array<Maybe<SurveyResponse>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SurveyResponseOutput = {
  __typename?: 'SurveyResponseOutput';
  data: Maybe<SurveyResponse>;
};

export type CreateSurveyResponseInput = {
  data: CreateSurveyResponseDataInput;
};

export type CreateSurveyResponseDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  surveyId: Scalars['String']['input'];
  surveyScheduleId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
  clientId: Scalars['String']['input'];
  response: Scalars['JSON']['input'];
};

export type UpdateSurveyResponseInput = {
  selector: SurveyResponseSelectorUniqueInput;
  data: UpdateSurveyResponseDataInput;
};

export type UpsertSurveyResponseInput = {
  selector: SurveyResponseSelectorUniqueInput;
  data: UpdateSurveyResponseDataInput;
};

export type UpdateSurveyResponseDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  surveyId: InputMaybe<Scalars['String']['input']>;
  surveyScheduleId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  clientId: InputMaybe<Scalars['String']['input']>;
  response: InputMaybe<Scalars['JSON']['input']>;
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

export enum SurveyResponseOrderByInput {
  Foobar = 'foobar'
}

export type SurveySchedule = {
  __typename?: 'SurveySchedule';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  surveyId: Maybe<Scalars['String']['output']>;
  survey: Survey;
  name: Maybe<Scalars['String']['output']>;
  impressionsLimit: Maybe<Scalars['Float']['output']>;
  maxVisitorPercentage: Maybe<Scalars['Float']['output']>;
  minKarma: Maybe<Scalars['Float']['output']>;
  maxKarma: Maybe<Scalars['Float']['output']>;
  target: Maybe<Scalars['String']['output']>;
  startDate: Maybe<Scalars['Date']['output']>;
  endDate: Maybe<Scalars['Date']['output']>;
  deactivated: Maybe<Scalars['Boolean']['output']>;
  clientIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  clients: Array<ClientId>;
};

export type DeleteSurveyScheduleInput = {
  selector: SurveyScheduleSelectorUniqueInput;
};

export type SingleSurveyScheduleInput = {
  selector: InputMaybe<SurveyScheduleSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSurveyScheduleInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SurveyScheduleSelectorInput>;
  orderBy: InputMaybe<SurveyScheduleOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSurveyScheduleOutput = {
  __typename?: 'SingleSurveyScheduleOutput';
  result: Maybe<SurveySchedule>;
};

export type MultiSurveyScheduleOutput = {
  __typename?: 'MultiSurveyScheduleOutput';
  results: Maybe<Array<Maybe<SurveySchedule>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SurveyScheduleOutput = {
  __typename?: 'SurveyScheduleOutput';
  data: Maybe<SurveySchedule>;
};

export type CreateSurveyScheduleInput = {
  data: CreateSurveyScheduleDataInput;
};

export type CreateSurveyScheduleDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  surveyId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  impressionsLimit: InputMaybe<Scalars['Float']['input']>;
  maxVisitorPercentage: InputMaybe<Scalars['Float']['input']>;
  minKarma: InputMaybe<Scalars['Float']['input']>;
  maxKarma: InputMaybe<Scalars['Float']['input']>;
  target: Scalars['String']['input'];
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
  deactivated: InputMaybe<Scalars['Boolean']['input']>;
  clientIds: Array<InputMaybe<Scalars['String']['input']>>;
};

export type UpdateSurveyScheduleInput = {
  selector: SurveyScheduleSelectorUniqueInput;
  data: UpdateSurveyScheduleDataInput;
};

export type UpsertSurveyScheduleInput = {
  selector: SurveyScheduleSelectorUniqueInput;
  data: UpdateSurveyScheduleDataInput;
};

export type UpdateSurveyScheduleDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  surveyId: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  impressionsLimit: InputMaybe<Scalars['Float']['input']>;
  maxVisitorPercentage: InputMaybe<Scalars['Float']['input']>;
  minKarma: InputMaybe<Scalars['Float']['input']>;
  maxKarma: InputMaybe<Scalars['Float']['input']>;
  target: InputMaybe<Scalars['String']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
  deactivated: InputMaybe<Scalars['Boolean']['input']>;
  clientIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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

export enum SurveyScheduleOrderByInput {
  Foobar = 'foobar'
}

export type Survey = {
  __typename?: 'Survey';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  name: Maybe<Scalars['String']['output']>;
  questions: Array<SurveyQuestion>;
};

export type DeleteSurveyInput = {
  selector: SurveySelectorUniqueInput;
};

export type SingleSurveyInput = {
  selector: InputMaybe<SurveySelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiSurveyInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<SurveySelectorInput>;
  orderBy: InputMaybe<SurveyOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleSurveyOutput = {
  __typename?: 'SingleSurveyOutput';
  result: Maybe<Survey>;
};

export type MultiSurveyOutput = {
  __typename?: 'MultiSurveyOutput';
  results: Maybe<Array<Maybe<Survey>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type SurveyOutput = {
  __typename?: 'SurveyOutput';
  data: Maybe<Survey>;
};

export type CreateSurveyInput = {
  data: CreateSurveyDataInput;
};

export type CreateSurveyDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
};

export type UpdateSurveyInput = {
  selector: SurveySelectorUniqueInput;
  data: UpdateSurveyDataInput;
};

export type UpsertSurveyInput = {
  selector: SurveySelectorUniqueInput;
  data: UpdateSurveyDataInput;
};

export type UpdateSurveyDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
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

export enum SurveyOrderByInput {
  Foobar = 'foobar'
}

export type TagFlag = {
  __typename?: 'TagFlag';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<Revision>;
  contents_latest: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  order: Maybe<Scalars['Float']['output']>;
};


export type TagFlagContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};

export type DeleteTagFlagInput = {
  selector: TagFlagSelectorUniqueInput;
};

export type SingleTagFlagInput = {
  selector: InputMaybe<TagFlagSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiTagFlagInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TagFlagSelectorInput>;
  orderBy: InputMaybe<TagFlagOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleTagFlagOutput = {
  __typename?: 'SingleTagFlagOutput';
  result: Maybe<TagFlag>;
};

export type MultiTagFlagOutput = {
  __typename?: 'MultiTagFlagOutput';
  results: Maybe<Array<Maybe<TagFlag>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type TagFlagOutput = {
  __typename?: 'TagFlagOutput';
  data: Maybe<TagFlag>;
};

export type CreateTagFlagInput = {
  data: CreateTagFlagDataInput;
};

export type CreateTagFlagDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  name: Scalars['String']['input'];
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateTagFlagInput = {
  selector: TagFlagSelectorUniqueInput;
  data: UpdateTagFlagDataInput;
};

export type UpsertTagFlagInput = {
  selector: TagFlagSelectorUniqueInput;
  data: UpdateTagFlagDataInput;
};

export type UpdateTagFlagDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  contents: InputMaybe<Scalars['JSON']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  order: InputMaybe<Scalars['Float']['input']>;
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

export enum TagFlagOrderByInput {
  Foobar = 'foobar'
}

export type TagRel = {
  __typename?: 'TagRel';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  tagId: Maybe<Scalars['String']['output']>;
  tag: Maybe<Tag>;
  postId: Maybe<Scalars['String']['output']>;
  post: Maybe<Post>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  currentUserCanVote: Scalars['Boolean']['output'];
  autoApplied: Scalars['Boolean']['output'];
  backfilled: Maybe<Scalars['Boolean']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
};

export type DeleteTagRelInput = {
  selector: TagRelSelectorUniqueInput;
};

export type SingleTagRelInput = {
  selector: InputMaybe<TagRelSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiTagRelInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TagRelSelectorInput>;
  orderBy: InputMaybe<TagRelOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleTagRelOutput = {
  __typename?: 'SingleTagRelOutput';
  result: Maybe<TagRel>;
};

export type MultiTagRelOutput = {
  __typename?: 'MultiTagRelOutput';
  results: Maybe<Array<Maybe<TagRel>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type TagRelOutput = {
  __typename?: 'TagRelOutput';
  data: Maybe<TagRel>;
};

export type CreateTagRelInput = {
  data: CreateTagRelDataInput;
};

export type CreateTagRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  tagId: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type UpdateTagRelInput = {
  selector: TagRelSelectorUniqueInput;
  data: UpdateTagRelDataInput;
};

export type UpsertTagRelInput = {
  selector: TagRelSelectorUniqueInput;
  data: UpdateTagRelDataInput;
};

export type UpdateTagRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
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

export enum TagRelOrderByInput {
  Foobar = 'foobar'
}

export type Tag = {
  __typename?: 'Tag';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  description: Maybe<Revision>;
  description_latest: Maybe<Scalars['String']['output']>;
  pingbacks: Maybe<Scalars['JSON']['output']>;
  subforumWelcomeText: Maybe<Revision>;
  subforumWelcomeText_latest: Maybe<Scalars['String']['output']>;
  moderationGuidelines: Maybe<Revision>;
  moderationGuidelines_latest: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  oldSlugs: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  name: Maybe<Scalars['String']['output']>;
  shortName: Maybe<Scalars['String']['output']>;
  subtitle: Maybe<Scalars['String']['output']>;
  core: Maybe<Scalars['Boolean']['output']>;
  isPostType: Maybe<Scalars['Boolean']['output']>;
  suggestedAsFilter: Maybe<Scalars['Boolean']['output']>;
  defaultOrder: Maybe<Scalars['Float']['output']>;
  descriptionTruncationCount: Maybe<Scalars['Float']['output']>;
  postCount: Maybe<Scalars['Float']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  adminOnly: Maybe<Scalars['Boolean']['output']>;
  canEditUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  charsAdded: Maybe<Scalars['Float']['output']>;
  charsRemoved: Maybe<Scalars['Float']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  lastCommentedAt: Maybe<Scalars['Date']['output']>;
  lastSubforumCommentAt: Maybe<Scalars['Date']['output']>;
  needsReview: Maybe<Scalars['Boolean']['output']>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  reviewedByUser: Maybe<User>;
  wikiGrade: Maybe<Scalars['Int']['output']>;
  recentComments: Maybe<Array<Maybe<Comment>>>;
  wikiOnly: Maybe<Scalars['Boolean']['output']>;
  bannerImageId: Maybe<Scalars['String']['output']>;
  squareImageId: Maybe<Scalars['String']['output']>;
  tagFlagsIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  tagFlags: Array<TagFlag>;
  lesswrongWikiImportRevision: Maybe<Scalars['String']['output']>;
  lesswrongWikiImportSlug: Maybe<Scalars['String']['output']>;
  lesswrongWikiImportCompleted: Maybe<Scalars['Boolean']['output']>;
  lastVisitedAt: Maybe<Scalars['Date']['output']>;
  isRead: Maybe<Scalars['Boolean']['output']>;
  tableOfContents: Maybe<Scalars['JSON']['output']>;
  htmlWithContributorAnnotations: Maybe<Scalars['String']['output']>;
  contributors: Maybe<TagContributorsList>;
  contributionStats: Maybe<Scalars['JSON']['output']>;
  introSequenceId: Maybe<Scalars['String']['output']>;
  sequence: Maybe<Sequence>;
  postsDefaultSortOrder: Maybe<Scalars['String']['output']>;
  canVoteOnRels: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  isSubforum: Maybe<Scalars['Boolean']['output']>;
  subforumUnreadMessagesCount: Maybe<Scalars['Int']['output']>;
  subforumModeratorIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  subforumModerators: Array<User>;
  subforumIntroPostId: Maybe<Scalars['String']['output']>;
  subforumIntroPost: Maybe<Post>;
  parentTagId: Maybe<Scalars['String']['output']>;
  parentTag: Maybe<Tag>;
  subTagIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  subTags: Array<Tag>;
  autoTagModel: Maybe<Scalars['String']['output']>;
  autoTagPrompt: Maybe<Scalars['String']['output']>;
  noindex: Maybe<Scalars['Boolean']['output']>;
  lenses: Array<MultiDocument>;
  lensesIncludingDeleted: Array<MultiDocument>;
  isPlaceholderPage: Maybe<Scalars['Boolean']['output']>;
  summaries: Array<MultiDocument>;
  textLastUpdatedAt: Maybe<Scalars['Date']['output']>;
  isArbitalImport: Maybe<Scalars['Boolean']['output']>;
  arbitalLinkedPages: Maybe<ArbitalLinkedPages>;
  coreTagId: Maybe<Scalars['String']['output']>;
  maxScore: Maybe<Scalars['Int']['output']>;
  usersWhoLiked: Array<UserLikingTag>;
  forceAllowType3Audio: Maybe<Scalars['Boolean']['output']>;
  currentUserVote: Maybe<Scalars['String']['output']>;
  currentUserExtendedVote: Maybe<Scalars['JSON']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  baseScore: Maybe<Scalars['Float']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  afBaseScore: Maybe<Scalars['Float']['output']>;
  afExtendedScore: Maybe<Scalars['JSON']['output']>;
  afVoteCount: Maybe<Scalars['Float']['output']>;
};


export type TagDescriptionArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagSubforumWelcomeTextArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagModerationGuidelinesArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagRecentCommentsArgs = {
  tagCommentsLimit: InputMaybe<Scalars['Int']['input']>;
  maxAgeHours: InputMaybe<Scalars['Int']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
  tagCommentType: InputMaybe<Scalars['String']['input']>;
};


export type TagTableOfContentsArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type TagContributorsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
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

export type DeleteTagInput = {
  selector: TagSelectorUniqueInput;
};

export type SingleTagInput = {
  selector: InputMaybe<TagSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiTagInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TagSelectorInput>;
  orderBy: InputMaybe<TagOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleTagOutput = {
  __typename?: 'SingleTagOutput';
  result: Maybe<Tag>;
};

export type MultiTagOutput = {
  __typename?: 'MultiTagOutput';
  results: Maybe<Array<Maybe<Tag>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type TagOutput = {
  __typename?: 'TagOutput';
  data: Maybe<Tag>;
};

export type CreateTagInput = {
  data: CreateTagDataInput;
};

export type CreateTagDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  description: InputMaybe<Scalars['JSON']['input']>;
  subforumWelcomeText: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  shortName: InputMaybe<Scalars['String']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  core: InputMaybe<Scalars['Boolean']['input']>;
  isPostType: InputMaybe<Scalars['Boolean']['input']>;
  suggestedAsFilter: InputMaybe<Scalars['Boolean']['input']>;
  defaultOrder: InputMaybe<Scalars['Float']['input']>;
  descriptionTruncationCount: InputMaybe<Scalars['Float']['input']>;
  adminOnly: InputMaybe<Scalars['Boolean']['input']>;
  canEditUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  wikiGrade: InputMaybe<Scalars['Int']['input']>;
  wikiOnly: InputMaybe<Scalars['Boolean']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  squareImageId: InputMaybe<Scalars['String']['input']>;
  tagFlagsIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  introSequenceId: InputMaybe<Scalars['String']['input']>;
  postsDefaultSortOrder: InputMaybe<Scalars['String']['input']>;
  canVoteOnRels: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  isSubforum: InputMaybe<Scalars['Boolean']['input']>;
  subforumModeratorIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  subforumIntroPostId: InputMaybe<Scalars['String']['input']>;
  parentTagId: InputMaybe<Scalars['String']['input']>;
  subTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  autoTagModel: InputMaybe<Scalars['String']['input']>;
  autoTagPrompt: InputMaybe<Scalars['String']['input']>;
  coreTagId: InputMaybe<Scalars['String']['input']>;
  forceAllowType3Audio: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateTagInput = {
  selector: TagSelectorUniqueInput;
  data: UpdateTagDataInput;
};

export type UpsertTagInput = {
  selector: TagSelectorUniqueInput;
  data: UpdateTagDataInput;
};

export type UpdateTagDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  description: InputMaybe<Scalars['JSON']['input']>;
  subforumWelcomeText: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  shortName: InputMaybe<Scalars['String']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  core: InputMaybe<Scalars['Boolean']['input']>;
  isPostType: InputMaybe<Scalars['Boolean']['input']>;
  suggestedAsFilter: InputMaybe<Scalars['Boolean']['input']>;
  defaultOrder: InputMaybe<Scalars['Float']['input']>;
  descriptionTruncationCount: InputMaybe<Scalars['Float']['input']>;
  adminOnly: InputMaybe<Scalars['Boolean']['input']>;
  canEditUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  needsReview: InputMaybe<Scalars['Boolean']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  wikiGrade: InputMaybe<Scalars['Int']['input']>;
  wikiOnly: InputMaybe<Scalars['Boolean']['input']>;
  bannerImageId: InputMaybe<Scalars['String']['input']>;
  squareImageId: InputMaybe<Scalars['String']['input']>;
  tagFlagsIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  introSequenceId: InputMaybe<Scalars['String']['input']>;
  postsDefaultSortOrder: InputMaybe<Scalars['String']['input']>;
  canVoteOnRels: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  isSubforum: InputMaybe<Scalars['Boolean']['input']>;
  subforumModeratorIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  subforumIntroPostId: InputMaybe<Scalars['String']['input']>;
  parentTagId: InputMaybe<Scalars['String']['input']>;
  subTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  autoTagModel: InputMaybe<Scalars['String']['input']>;
  autoTagPrompt: InputMaybe<Scalars['String']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  isPlaceholderPage: InputMaybe<Scalars['Boolean']['input']>;
  coreTagId: InputMaybe<Scalars['String']['input']>;
  forceAllowType3Audio: InputMaybe<Scalars['Boolean']['input']>;
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

export enum TagOrderByInput {
  Foobar = 'foobar'
}

export type Tweet = {
  __typename?: 'Tweet';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteTweetInput = {
  selector: TweetSelectorUniqueInput;
};

export type SingleTweetInput = {
  selector: InputMaybe<TweetSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiTweetInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TweetSelectorInput>;
  orderBy: InputMaybe<TweetOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleTweetOutput = {
  __typename?: 'SingleTweetOutput';
  result: Maybe<Tweet>;
};

export type MultiTweetOutput = {
  __typename?: 'MultiTweetOutput';
  results: Maybe<Array<Maybe<Tweet>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type TweetOutput = {
  __typename?: 'TweetOutput';
  data: Maybe<Tweet>;
};

export type CreateTweetInput = {
  data: CreateTweetDataInput;
};

export type CreateTweetDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateTweetInput = {
  selector: TweetSelectorUniqueInput;
  data: UpdateTweetDataInput;
};

export type UpsertTweetInput = {
  selector: TweetSelectorUniqueInput;
  data: UpdateTweetDataInput;
};

export type UpdateTweetDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum TweetOrderByInput {
  Foobar = 'foobar'
}

export type TypingIndicator = {
  __typename?: 'TypingIndicator';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
};

export type DeleteTypingIndicatorInput = {
  selector: TypingIndicatorSelectorUniqueInput;
};

export type SingleTypingIndicatorInput = {
  selector: InputMaybe<TypingIndicatorSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiTypingIndicatorInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<TypingIndicatorSelectorInput>;
  orderBy: InputMaybe<TypingIndicatorOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleTypingIndicatorOutput = {
  __typename?: 'SingleTypingIndicatorOutput';
  result: Maybe<TypingIndicator>;
};

export type MultiTypingIndicatorOutput = {
  __typename?: 'MultiTypingIndicatorOutput';
  results: Maybe<Array<Maybe<TypingIndicator>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type TypingIndicatorOutput = {
  __typename?: 'TypingIndicatorOutput';
  data: Maybe<TypingIndicator>;
};

export type CreateTypingIndicatorInput = {
  data: CreateTypingIndicatorDataInput;
};

export type CreateTypingIndicatorDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  documentId: Scalars['String']['input'];
  lastUpdated: Scalars['Date']['input'];
};

export type UpdateTypingIndicatorInput = {
  selector: TypingIndicatorSelectorUniqueInput;
  data: UpdateTypingIndicatorDataInput;
};

export type UpsertTypingIndicatorInput = {
  selector: TypingIndicatorSelectorUniqueInput;
  data: UpdateTypingIndicatorDataInput;
};

export type UpdateTypingIndicatorDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
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

export enum TypingIndicatorOrderByInput {
  Foobar = 'foobar'
}

export type UserActivity = {
  __typename?: 'UserActivity';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
};

export type DeleteUserActivityInput = {
  selector: UserActivitySelectorUniqueInput;
};

export type SingleUserActivityInput = {
  selector: InputMaybe<UserActivitySelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiUserActivityInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserActivitySelectorInput>;
  orderBy: InputMaybe<UserActivityOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleUserActivityOutput = {
  __typename?: 'SingleUserActivityOutput';
  result: Maybe<UserActivity>;
};

export type MultiUserActivityOutput = {
  __typename?: 'MultiUserActivityOutput';
  results: Maybe<Array<Maybe<UserActivity>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type UserActivityOutput = {
  __typename?: 'UserActivityOutput';
  data: Maybe<UserActivity>;
};

export type CreateUserActivityInput = {
  data: CreateUserActivityDataInput;
};

export type CreateUserActivityDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateUserActivityInput = {
  selector: UserActivitySelectorUniqueInput;
  data: UpdateUserActivityDataInput;
};

export type UpsertUserActivityInput = {
  selector: UserActivitySelectorUniqueInput;
  data: UpdateUserActivityDataInput;
};

export type UpdateUserActivityDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum UserActivityOrderByInput {
  Foobar = 'foobar'
}

export type UserEagDetail = {
  __typename?: 'UserEAGDetail';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  careerStage: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  countryOrRegion: Maybe<Scalars['String']['output']>;
  nearestCity: Maybe<Scalars['String']['output']>;
  willingnessToRelocate: Maybe<Scalars['JSON']['output']>;
  experiencedIn: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  interestedIn: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
};

export type DeleteUserEagDetailInput = {
  selector: UserEagDetailSelectorUniqueInput;
};

export type SingleUserEagDetailInput = {
  selector: InputMaybe<UserEagDetailSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiUserEagDetailInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserEagDetailSelectorInput>;
  orderBy: InputMaybe<UserEagDetailOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleUserEagDetailOutput = {
  __typename?: 'SingleUserEAGDetailOutput';
  result: Maybe<UserEagDetail>;
};

export type MultiUserEagDetailOutput = {
  __typename?: 'MultiUserEAGDetailOutput';
  results: Maybe<Array<Maybe<UserEagDetail>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type UserEagDetailOutput = {
  __typename?: 'UserEAGDetailOutput';
  data: Maybe<UserEagDetail>;
};

export type CreateUserEagDetailInput = {
  data: CreateUserEagDetailDataInput;
};

export type CreateUserEagDetailDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateUserEagDetailInput = {
  selector: UserEagDetailSelectorUniqueInput;
  data: UpdateUserEagDetailDataInput;
};

export type UpsertUserEagDetailInput = {
  selector: UserEagDetailSelectorUniqueInput;
  data: UpdateUserEagDetailDataInput;
};

export type UpdateUserEagDetailDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  careerStage: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  countryOrRegion: InputMaybe<Scalars['String']['input']>;
  nearestCity: InputMaybe<Scalars['String']['input']>;
  willingnessToRelocate: InputMaybe<Scalars['JSON']['input']>;
  experiencedIn: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  interestedIn: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
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

export enum UserEagDetailOrderByInput {
  Foobar = 'foobar'
}

export type UserJobAd = {
  __typename?: 'UserJobAd';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  jobName: Maybe<Scalars['String']['output']>;
  adState: Maybe<Scalars['String']['output']>;
  reminderSetAt: Maybe<Scalars['Date']['output']>;
  lastUpdated: Maybe<Scalars['Date']['output']>;
};

export type DeleteUserJobAdInput = {
  selector: UserJobAdSelectorUniqueInput;
};

export type SingleUserJobAdInput = {
  selector: InputMaybe<UserJobAdSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiUserJobAdInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserJobAdSelectorInput>;
  orderBy: InputMaybe<UserJobAdOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleUserJobAdOutput = {
  __typename?: 'SingleUserJobAdOutput';
  result: Maybe<UserJobAd>;
};

export type MultiUserJobAdOutput = {
  __typename?: 'MultiUserJobAdOutput';
  results: Maybe<Array<Maybe<UserJobAd>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type UserJobAdOutput = {
  __typename?: 'UserJobAdOutput';
  data: Maybe<UserJobAd>;
};

export type CreateUserJobAdInput = {
  data: CreateUserJobAdDataInput;
};

export type CreateUserJobAdDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  jobName: Scalars['String']['input'];
  adState: Scalars['String']['input'];
  reminderSetAt: InputMaybe<Scalars['Date']['input']>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateUserJobAdInput = {
  selector: UserJobAdSelectorUniqueInput;
  data: UpdateUserJobAdDataInput;
};

export type UpsertUserJobAdInput = {
  selector: UserJobAdSelectorUniqueInput;
  data: UpdateUserJobAdDataInput;
};

export type UpdateUserJobAdDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  adState: InputMaybe<Scalars['String']['input']>;
  reminderSetAt: InputMaybe<Scalars['Date']['input']>;
  lastUpdated: InputMaybe<Scalars['Date']['input']>;
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

export enum UserJobAdOrderByInput {
  Foobar = 'foobar'
}

export type UserMostValuablePost = {
  __typename?: 'UserMostValuablePost';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  postId: Maybe<Scalars['String']['output']>;
  post: Maybe<Post>;
  deleted: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteUserMostValuablePostInput = {
  selector: UserMostValuablePostSelectorUniqueInput;
};

export type SingleUserMostValuablePostInput = {
  selector: InputMaybe<UserMostValuablePostSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiUserMostValuablePostInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserMostValuablePostSelectorInput>;
  orderBy: InputMaybe<UserMostValuablePostOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleUserMostValuablePostOutput = {
  __typename?: 'SingleUserMostValuablePostOutput';
  result: Maybe<UserMostValuablePost>;
};

export type MultiUserMostValuablePostOutput = {
  __typename?: 'MultiUserMostValuablePostOutput';
  results: Maybe<Array<Maybe<UserMostValuablePost>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type UserMostValuablePostOutput = {
  __typename?: 'UserMostValuablePostOutput';
  data: Maybe<UserMostValuablePost>;
};

export type CreateUserMostValuablePostInput = {
  data: CreateUserMostValuablePostDataInput;
};

export type CreateUserMostValuablePostDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  deleted: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateUserMostValuablePostInput = {
  selector: UserMostValuablePostSelectorUniqueInput;
  data: UpdateUserMostValuablePostDataInput;
};

export type UpsertUserMostValuablePostInput = {
  selector: UserMostValuablePostSelectorUniqueInput;
  data: UpdateUserMostValuablePostDataInput;
};

export type UpdateUserMostValuablePostDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
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

export enum UserMostValuablePostOrderByInput {
  Foobar = 'foobar'
}

export type UserRateLimit = {
  __typename?: 'UserRateLimit';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  type: Maybe<Scalars['String']['output']>;
  intervalUnit: Maybe<Scalars['String']['output']>;
  intervalLength: Maybe<Scalars['Float']['output']>;
  actionsPerInterval: Maybe<Scalars['Float']['output']>;
  endedAt: Maybe<Scalars['Date']['output']>;
};

export type DeleteUserRateLimitInput = {
  selector: UserRateLimitSelectorUniqueInput;
};

export type SingleUserRateLimitInput = {
  selector: InputMaybe<UserRateLimitSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiUserRateLimitInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserRateLimitSelectorInput>;
  orderBy: InputMaybe<UserRateLimitOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleUserRateLimitOutput = {
  __typename?: 'SingleUserRateLimitOutput';
  result: Maybe<UserRateLimit>;
};

export type MultiUserRateLimitOutput = {
  __typename?: 'MultiUserRateLimitOutput';
  results: Maybe<Array<Maybe<UserRateLimit>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type UserRateLimitOutput = {
  __typename?: 'UserRateLimitOutput';
  data: Maybe<UserRateLimit>;
};

export type CreateUserRateLimitInput = {
  data: CreateUserRateLimitDataInput;
};

export type CreateUserRateLimitDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: Scalars['String']['input'];
  type: Scalars['String']['input'];
  intervalUnit: Scalars['String']['input'];
  intervalLength: Scalars['Float']['input'];
  actionsPerInterval: Scalars['Float']['input'];
  endedAt: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateUserRateLimitInput = {
  selector: UserRateLimitSelectorUniqueInput;
  data: UpdateUserRateLimitDataInput;
};

export type UpsertUserRateLimitInput = {
  selector: UserRateLimitSelectorUniqueInput;
  data: UpdateUserRateLimitDataInput;
};

export type UpdateUserRateLimitDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
  intervalUnit: InputMaybe<Scalars['String']['input']>;
  intervalLength: InputMaybe<Scalars['Float']['input']>;
  actionsPerInterval: InputMaybe<Scalars['Float']['input']>;
  endedAt: InputMaybe<Scalars['Date']['input']>;
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

export enum UserRateLimitOrderByInput {
  Foobar = 'foobar'
}

export type UserTagRel = {
  __typename?: 'UserTagRel';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  tagId: Maybe<Scalars['String']['output']>;
  tag: Maybe<Tag>;
  userId: Maybe<Scalars['String']['output']>;
  user: Maybe<User>;
  subforumShowUnreadInSidebar: Maybe<Scalars['Boolean']['output']>;
  subforumEmailNotifications: Maybe<Scalars['Boolean']['output']>;
  subforumHideIntroPost: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteUserTagRelInput = {
  selector: UserTagRelSelectorUniqueInput;
};

export type SingleUserTagRelInput = {
  selector: InputMaybe<UserTagRelSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiUserTagRelInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserTagRelSelectorInput>;
  orderBy: InputMaybe<UserTagRelOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleUserTagRelOutput = {
  __typename?: 'SingleUserTagRelOutput';
  result: Maybe<UserTagRel>;
};

export type MultiUserTagRelOutput = {
  __typename?: 'MultiUserTagRelOutput';
  results: Maybe<Array<Maybe<UserTagRel>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type UserTagRelOutput = {
  __typename?: 'UserTagRelOutput';
  data: Maybe<UserTagRel>;
};

export type CreateUserTagRelInput = {
  data: CreateUserTagRelDataInput;
};

export type CreateUserTagRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  tagId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
  subforumShowUnreadInSidebar: InputMaybe<Scalars['Boolean']['input']>;
  subforumEmailNotifications: InputMaybe<Scalars['Boolean']['input']>;
  subforumHideIntroPost: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateUserTagRelInput = {
  selector: UserTagRelSelectorUniqueInput;
  data: UpdateUserTagRelDataInput;
};

export type UpsertUserTagRelInput = {
  selector: UserTagRelSelectorUniqueInput;
  data: UpdateUserTagRelDataInput;
};

export type UpdateUserTagRelDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  subforumShowUnreadInSidebar: InputMaybe<Scalars['Boolean']['input']>;
  subforumEmailNotifications: InputMaybe<Scalars['Boolean']['input']>;
  subforumHideIntroPost: InputMaybe<Scalars['Boolean']['input']>;
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

export enum UserTagRelOrderByInput {
  Foobar = 'foobar'
}

export type User = {
  __typename?: 'User';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  moderationGuidelines: Maybe<Revision>;
  moderationGuidelines_latest: Maybe<Scalars['String']['output']>;
  howOthersCanHelpMe: Maybe<Revision>;
  howOthersCanHelpMe_latest: Maybe<Scalars['String']['output']>;
  howICanHelpOthers: Maybe<Revision>;
  howICanHelpOthers_latest: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  oldSlugs: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  biography: Maybe<Revision>;
  biography_latest: Maybe<Scalars['String']['output']>;
  username: Maybe<Scalars['String']['output']>;
  emails: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  isAdmin: Maybe<Scalars['Boolean']['output']>;
  services: Maybe<Scalars['JSON']['output']>;
  hasAuth0Id: Maybe<Scalars['Boolean']['output']>;
  displayName: Maybe<Scalars['String']['output']>;
  previousDisplayName: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  noindex: Maybe<Scalars['Boolean']['output']>;
  groups: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  pageUrl: Maybe<Scalars['String']['output']>;
  pagePath: Maybe<Scalars['String']['output']>;
  editUrl: Maybe<Scalars['String']['output']>;
  lwWikiImport: Maybe<Scalars['Boolean']['output']>;
  theme: Maybe<Scalars['JSON']['output']>;
  lastUsedTimezone: Maybe<Scalars['String']['output']>;
  whenConfirmationEmailSent: Maybe<Scalars['Date']['output']>;
  legacy: Maybe<Scalars['Boolean']['output']>;
  commentSorting: Maybe<Scalars['String']['output']>;
  sortDraftsBy: Maybe<Scalars['String']['output']>;
  reactPaletteStyle: Maybe<Scalars['String']['output']>;
  noKibitz: Maybe<Scalars['Boolean']['output']>;
  showHideKarmaOption: Maybe<Scalars['Boolean']['output']>;
  showPostAuthorCard: Maybe<Scalars['Boolean']['output']>;
  hideIntercom: Maybe<Scalars['Boolean']['output']>;
  markDownPostEditor: Maybe<Scalars['Boolean']['output']>;
  hideElicitPredictions: Maybe<Scalars['Boolean']['output']>;
  hideAFNonMemberInitialWarning: Maybe<Scalars['Boolean']['output']>;
  noSingleLineComments: Maybe<Scalars['Boolean']['output']>;
  noCollapseCommentsPosts: Maybe<Scalars['Boolean']['output']>;
  noCollapseCommentsFrontpage: Maybe<Scalars['Boolean']['output']>;
  hideCommunitySection: Maybe<Scalars['Boolean']['output']>;
  expandedFrontpageSections: Maybe<Scalars['JSON']['output']>;
  showCommunityInRecentDiscussion: Maybe<Scalars['Boolean']['output']>;
  hidePostsRecommendations: Maybe<Scalars['Boolean']['output']>;
  petrovOptOut: Maybe<Scalars['Boolean']['output']>;
  optedOutOfSurveys: Maybe<Scalars['Boolean']['output']>;
  postGlossariesPinned: Maybe<Scalars['Boolean']['output']>;
  generateJargonForDrafts: Maybe<Scalars['Boolean']['output']>;
  generateJargonForPublishedPosts: Maybe<Scalars['Boolean']['output']>;
  acceptedTos: Maybe<Scalars['Boolean']['output']>;
  hideNavigationSidebar: Maybe<Scalars['Boolean']['output']>;
  currentFrontpageFilter: Maybe<Scalars['String']['output']>;
  frontpageSelectedTab: Maybe<Scalars['String']['output']>;
  frontpageFilterSettings: Maybe<Scalars['JSON']['output']>;
  hideFrontpageFilterSettingsDesktop: Maybe<Scalars['Boolean']['output']>;
  allPostsTimeframe: Maybe<Scalars['String']['output']>;
  allPostsFilter: Maybe<Scalars['String']['output']>;
  allPostsSorting: Maybe<Scalars['String']['output']>;
  allPostsShowLowKarma: Maybe<Scalars['Boolean']['output']>;
  allPostsIncludeEvents: Maybe<Scalars['Boolean']['output']>;
  allPostsHideCommunity: Maybe<Scalars['Boolean']['output']>;
  allPostsOpenSettings: Maybe<Scalars['Boolean']['output']>;
  draftsListSorting: Maybe<Scalars['String']['output']>;
  draftsListShowArchived: Maybe<Scalars['Boolean']['output']>;
  draftsListShowShared: Maybe<Scalars['Boolean']['output']>;
  lastNotificationsCheck: Maybe<Scalars['Date']['output']>;
  karma: Maybe<Scalars['Float']['output']>;
  goodHeartTokens: Maybe<Scalars['Float']['output']>;
  moderationStyle: Maybe<Scalars['String']['output']>;
  moderatorAssistance: Maybe<Scalars['Boolean']['output']>;
  collapseModerationGuidelines: Maybe<Scalars['Boolean']['output']>;
  bannedUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  bannedPersonalUserIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  bookmarkedPostsMetadata: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  bookmarkedPosts: Array<Post>;
  hiddenPostsMetadata: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  hiddenPosts: Array<Post>;
  legacyId: Maybe<Scalars['String']['output']>;
  deleted: Maybe<Scalars['Boolean']['output']>;
  permanentDeletionRequestedAt: Maybe<Scalars['Date']['output']>;
  voteBanned: Maybe<Scalars['Boolean']['output']>;
  nullifyVotes: Maybe<Scalars['Boolean']['output']>;
  deleteContent: Maybe<Scalars['Boolean']['output']>;
  banned: Maybe<Scalars['Date']['output']>;
  IPs: Maybe<Array<Scalars['String']['output']>>;
  auto_subscribe_to_my_posts: Maybe<Scalars['Boolean']['output']>;
  auto_subscribe_to_my_comments: Maybe<Scalars['Boolean']['output']>;
  autoSubscribeAsOrganizer: Maybe<Scalars['Boolean']['output']>;
  notificationCommentsOnSubscribedPost: Maybe<Scalars['JSON']['output']>;
  notificationShortformContent: Maybe<Scalars['JSON']['output']>;
  notificationRepliesToMyComments: Maybe<Scalars['JSON']['output']>;
  notificationRepliesToSubscribedComments: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedUserPost: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedUserComment: Maybe<Scalars['JSON']['output']>;
  notificationPostsInGroups: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedTagPost: Maybe<Scalars['JSON']['output']>;
  notificationSubscribedSequencePost: Maybe<Scalars['JSON']['output']>;
  notificationPrivateMessage: Maybe<Scalars['JSON']['output']>;
  notificationSharedWithMe: Maybe<Scalars['JSON']['output']>;
  notificationAlignmentSubmissionApproved: Maybe<Scalars['JSON']['output']>;
  notificationEventInRadius: Maybe<Scalars['JSON']['output']>;
  notificationKarmaPowersGained: Maybe<Scalars['JSON']['output']>;
  notificationRSVPs: Maybe<Scalars['JSON']['output']>;
  notificationGroupAdministration: Maybe<Scalars['JSON']['output']>;
  notificationCommentsOnDraft: Maybe<Scalars['JSON']['output']>;
  notificationPostsNominatedReview: Maybe<Scalars['JSON']['output']>;
  notificationSubforumUnread: Maybe<Scalars['JSON']['output']>;
  notificationNewMention: Maybe<Scalars['JSON']['output']>;
  notificationDialogueMessages: Maybe<Scalars['JSON']['output']>;
  notificationPublishedDialogueMessages: Maybe<Scalars['JSON']['output']>;
  notificationAddedAsCoauthor: Maybe<Scalars['JSON']['output']>;
  notificationDebateCommentsOnSubscribedPost: Maybe<Scalars['JSON']['output']>;
  notificationDebateReplies: Maybe<Scalars['JSON']['output']>;
  notificationDialogueMatch: Maybe<Scalars['JSON']['output']>;
  notificationNewDialogueChecks: Maybe<Scalars['JSON']['output']>;
  notificationYourTurnMatchForm: Maybe<Scalars['JSON']['output']>;
  hideDialogueFacilitation: Maybe<Scalars['Boolean']['output']>;
  revealChecksToAdmins: Maybe<Scalars['Boolean']['output']>;
  optedInToDialogueFacilitation: Maybe<Scalars['Boolean']['output']>;
  showDialoguesList: Maybe<Scalars['Boolean']['output']>;
  showMyDialogues: Maybe<Scalars['Boolean']['output']>;
  showMatches: Maybe<Scalars['Boolean']['output']>;
  showRecommendedPartners: Maybe<Scalars['Boolean']['output']>;
  hideActiveDialogueUsers: Maybe<Scalars['Boolean']['output']>;
  karmaChangeNotifierSettings: Maybe<Scalars['JSON']['output']>;
  karmaChangeLastOpened: Maybe<Scalars['Date']['output']>;
  karmaChangeBatchStart: Maybe<Scalars['Date']['output']>;
  emailSubscribedToCurated: Maybe<Scalars['Boolean']['output']>;
  subscribedToDigest: Maybe<Scalars['Boolean']['output']>;
  unsubscribeFromAll: Maybe<Scalars['Boolean']['output']>;
  hideSubscribePoke: Maybe<Scalars['Boolean']['output']>;
  hideMeetupsPoke: Maybe<Scalars['Boolean']['output']>;
  hideHomeRHS: Maybe<Scalars['Boolean']['output']>;
  frontpagePostCount: Maybe<Scalars['Float']['output']>;
  sequenceCount: Maybe<Scalars['Float']['output']>;
  sequenceDraftCount: Maybe<Scalars['Float']['output']>;
  mongoLocation: Maybe<Scalars['JSON']['output']>;
  googleLocation: Maybe<Scalars['JSON']['output']>;
  location: Maybe<Scalars['String']['output']>;
  mapLocation: Maybe<Scalars['JSON']['output']>;
  mapLocationLatLng: Maybe<LatLng>;
  mapLocationSet: Maybe<Scalars['Boolean']['output']>;
  mapMarkerText: Maybe<Scalars['String']['output']>;
  htmlMapMarkerText: Maybe<Scalars['String']['output']>;
  nearbyEventsNotifications: Maybe<Scalars['Boolean']['output']>;
  nearbyEventsNotificationsLocation: Maybe<Scalars['JSON']['output']>;
  nearbyEventsNotificationsMongoLocation: Maybe<Scalars['JSON']['output']>;
  nearbyEventsNotificationsRadius: Maybe<Scalars['Float']['output']>;
  nearbyPeopleNotificationThreshold: Maybe<Scalars['Float']['output']>;
  hideFrontpageMap: Maybe<Scalars['Boolean']['output']>;
  hideTaggingProgressBar: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageBookAd: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageBook2019Ad: Maybe<Scalars['Boolean']['output']>;
  hideFrontpageBook2020Ad: Maybe<Scalars['Boolean']['output']>;
  sunshineNotes: Maybe<Scalars['String']['output']>;
  sunshineFlagged: Maybe<Scalars['Boolean']['output']>;
  needsReview: Maybe<Scalars['Boolean']['output']>;
  sunshineSnoozed: Maybe<Scalars['Boolean']['output']>;
  snoozedUntilContentCount: Maybe<Scalars['Float']['output']>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  reviewedByUser: Maybe<User>;
  isReviewed: Maybe<Scalars['Boolean']['output']>;
  reviewedAt: Maybe<Scalars['Date']['output']>;
  spamRiskScore: Scalars['Float']['output'];
  afKarma: Maybe<Scalars['Float']['output']>;
  voteCount: Maybe<Scalars['Float']['output']>;
  smallUpvoteCount: Maybe<Scalars['Float']['output']>;
  smallDownvoteCount: Maybe<Scalars['Float']['output']>;
  bigUpvoteCount: Maybe<Scalars['Float']['output']>;
  bigDownvoteCount: Maybe<Scalars['Float']['output']>;
  voteReceivedCount: Maybe<Scalars['Float']['output']>;
  smallUpvoteReceivedCount: Maybe<Scalars['Float']['output']>;
  smallDownvoteReceivedCount: Maybe<Scalars['Float']['output']>;
  bigUpvoteReceivedCount: Maybe<Scalars['Float']['output']>;
  bigDownvoteReceivedCount: Maybe<Scalars['Float']['output']>;
  usersContactedBeforeReview: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  fullName: Maybe<Scalars['String']['output']>;
  shortformFeedId: Maybe<Scalars['String']['output']>;
  shortformFeed: Maybe<Post>;
  viewUnreviewedComments: Maybe<Scalars['Boolean']['output']>;
  partiallyReadSequences: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  beta: Maybe<Scalars['Boolean']['output']>;
  reviewVotesQuadratic: Maybe<Scalars['Boolean']['output']>;
  reviewVotesQuadratic2019: Maybe<Scalars['Boolean']['output']>;
  reviewVoteCount: Scalars['Int']['output'];
  reviewVotesQuadratic2020: Maybe<Scalars['Boolean']['output']>;
  petrovPressedButtonDate: Maybe<Scalars['Date']['output']>;
  petrovLaunchCodeDate: Maybe<Scalars['Date']['output']>;
  defaultToCKEditor: Maybe<Scalars['Boolean']['output']>;
  signUpReCaptchaRating: Maybe<Scalars['Float']['output']>;
  noExpandUnreadCommentsReview: Maybe<Scalars['Boolean']['output']>;
  postCount: Maybe<Scalars['Float']['output']>;
  maxPostCount: Maybe<Scalars['Float']['output']>;
  posts: Maybe<Array<Maybe<Post>>>;
  commentCount: Maybe<Scalars['Float']['output']>;
  maxCommentCount: Maybe<Scalars['Float']['output']>;
  tagRevisionCount: Maybe<Scalars['Float']['output']>;
  abTestKey: Maybe<Scalars['String']['output']>;
  abTestOverrides: Maybe<Scalars['JSON']['output']>;
  reenableDraftJs: Maybe<Scalars['Boolean']['output']>;
  walledGardenInvite: Maybe<Scalars['Boolean']['output']>;
  hideWalledGardenUI: Maybe<Scalars['Boolean']['output']>;
  walledGardenPortalOnboarded: Maybe<Scalars['Boolean']['output']>;
  taggingDashboardCollapsed: Maybe<Scalars['Boolean']['output']>;
  usernameUnset: Maybe<Scalars['Boolean']['output']>;
  paymentEmail: Maybe<Scalars['String']['output']>;
  paymentInfo: Maybe<Scalars['String']['output']>;
  profileUpdatedAt: Maybe<Scalars['Date']['output']>;
  profileImageId: Maybe<Scalars['String']['output']>;
  jobTitle: Maybe<Scalars['String']['output']>;
  organization: Maybe<Scalars['String']['output']>;
  careerStage: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  website: Maybe<Scalars['String']['output']>;
  bio: Maybe<Scalars['String']['output']>;
  htmlBio: Scalars['String']['output'];
  fmCrosspostUserId: Maybe<Scalars['String']['output']>;
  linkedinProfileURL: Maybe<Scalars['String']['output']>;
  facebookProfileURL: Maybe<Scalars['String']['output']>;
  blueskyProfileURL: Maybe<Scalars['String']['output']>;
  twitterProfileURL: Maybe<Scalars['String']['output']>;
  twitterProfileURLAdmin: Maybe<Scalars['String']['output']>;
  githubProfileURL: Maybe<Scalars['String']['output']>;
  profileTagIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  profileTags: Array<Tag>;
  organizerOfGroupIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  organizerOfGroups: Array<Localgroup>;
  programParticipation: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  postingDisabled: Maybe<Scalars['Boolean']['output']>;
  allCommentingDisabled: Maybe<Scalars['Boolean']['output']>;
  commentingOnOtherUsersDisabled: Maybe<Scalars['Boolean']['output']>;
  conversationsDisabled: Maybe<Scalars['Boolean']['output']>;
  associatedClientId: Maybe<ClientId>;
  associatedClientIds: Maybe<Array<ClientId>>;
  altAccountsDetected: Maybe<Scalars['Boolean']['output']>;
  acknowledgedNewUserGuidelines: Maybe<Scalars['Boolean']['output']>;
  moderatorActions: Maybe<Array<Maybe<ModeratorAction>>>;
  subforumPreferredLayout: Maybe<Scalars['String']['output']>;
  hideJobAdUntil: Maybe<Scalars['Date']['output']>;
  criticismTipsDismissed: Maybe<Scalars['Boolean']['output']>;
  hideFromPeopleDirectory: Maybe<Scalars['Boolean']['output']>;
  allowDatadogSessionReplay: Maybe<Scalars['Boolean']['output']>;
  afPostCount: Maybe<Scalars['Float']['output']>;
  afCommentCount: Maybe<Scalars['Float']['output']>;
  afSequenceCount: Maybe<Scalars['Float']['output']>;
  afSequenceDraftCount: Maybe<Scalars['Float']['output']>;
  reviewForAlignmentForumUserId: Maybe<Scalars['String']['output']>;
  afApplicationText: Maybe<Scalars['String']['output']>;
  afSubmittedApplication: Maybe<Scalars['Boolean']['output']>;
  rateLimitNextAbleToComment: Maybe<Scalars['JSON']['output']>;
  rateLimitNextAbleToPost: Maybe<Scalars['JSON']['output']>;
  recentKarmaInfo: Maybe<Scalars['JSON']['output']>;
  hideSunshineSidebar: Maybe<Scalars['Boolean']['output']>;
  inactiveSurveyEmailSentAt: Maybe<Scalars['Date']['output']>;
  userSurveyEmailSentAt: Maybe<Scalars['Date']['output']>;
  karmaChanges: Maybe<KarmaChanges>;
  recommendationSettings: Maybe<Scalars['JSON']['output']>;
};


export type UserModerationGuidelinesArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type UserHowOthersCanHelpMeArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type UserHowICanHelpOthersArgs = {
  version: InputMaybe<Scalars['String']['input']>;
};


export type UserBiographyArgs = {
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


export type UserKarmaChangesArgs = {
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
};

export type DeleteUserInput = {
  selector: UserSelectorUniqueInput;
};

export type SingleUserInput = {
  selector: InputMaybe<UserSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiUserInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<UserSelectorInput>;
  orderBy: InputMaybe<UserOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleUserOutput = {
  __typename?: 'SingleUserOutput';
  result: Maybe<User>;
};

export type MultiUserOutput = {
  __typename?: 'MultiUserOutput';
  results: Maybe<Array<Maybe<User>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type UserOutput = {
  __typename?: 'UserOutput';
  data: Maybe<User>;
};

export type CreateUserInput = {
  data: CreateUserDataInput;
};

export type CreateUserDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  howOthersCanHelpMe: InputMaybe<Scalars['JSON']['input']>;
  howICanHelpOthers: InputMaybe<Scalars['JSON']['input']>;
  biography: InputMaybe<Scalars['JSON']['input']>;
  username: InputMaybe<Scalars['String']['input']>;
  isAdmin: InputMaybe<Scalars['Boolean']['input']>;
  displayName: InputMaybe<Scalars['String']['input']>;
  previousDisplayName: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  groups: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  theme: InputMaybe<Scalars['JSON']['input']>;
  lastUsedTimezone: InputMaybe<Scalars['String']['input']>;
  whenConfirmationEmailSent: InputMaybe<Scalars['Date']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  commentSorting: InputMaybe<Scalars['String']['input']>;
  noKibitz: InputMaybe<Scalars['Boolean']['input']>;
  showHideKarmaOption: InputMaybe<Scalars['Boolean']['input']>;
  showPostAuthorCard: InputMaybe<Scalars['Boolean']['input']>;
  hideIntercom: InputMaybe<Scalars['Boolean']['input']>;
  noSingleLineComments: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsPosts: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  hideCommunitySection: InputMaybe<Scalars['Boolean']['input']>;
  expandedFrontpageSections: InputMaybe<Scalars['JSON']['input']>;
  showCommunityInRecentDiscussion: InputMaybe<Scalars['Boolean']['input']>;
  hidePostsRecommendations: InputMaybe<Scalars['Boolean']['input']>;
  petrovOptOut: InputMaybe<Scalars['Boolean']['input']>;
  optedOutOfSurveys: InputMaybe<Scalars['Boolean']['input']>;
  postGlossariesPinned: InputMaybe<Scalars['Boolean']['input']>;
  acceptedTos: InputMaybe<Scalars['Boolean']['input']>;
  hideNavigationSidebar: InputMaybe<Scalars['Boolean']['input']>;
  currentFrontpageFilter: InputMaybe<Scalars['String']['input']>;
  frontpageSelectedTab: InputMaybe<Scalars['String']['input']>;
  frontpageFilterSettings: InputMaybe<Scalars['JSON']['input']>;
  hideFrontpageFilterSettingsDesktop: InputMaybe<Scalars['Boolean']['input']>;
  allPostsTimeframe: InputMaybe<Scalars['String']['input']>;
  allPostsFilter: InputMaybe<Scalars['String']['input']>;
  allPostsSorting: InputMaybe<Scalars['String']['input']>;
  allPostsShowLowKarma: InputMaybe<Scalars['Boolean']['input']>;
  allPostsIncludeEvents: InputMaybe<Scalars['Boolean']['input']>;
  allPostsHideCommunity: InputMaybe<Scalars['Boolean']['input']>;
  allPostsOpenSettings: InputMaybe<Scalars['Boolean']['input']>;
  draftsListSorting: InputMaybe<Scalars['String']['input']>;
  draftsListShowArchived: InputMaybe<Scalars['Boolean']['input']>;
  draftsListShowShared: InputMaybe<Scalars['Boolean']['input']>;
  lastNotificationsCheck: InputMaybe<Scalars['Date']['input']>;
  moderationStyle: InputMaybe<Scalars['String']['input']>;
  moderatorAssistance: InputMaybe<Scalars['Boolean']['input']>;
  collapseModerationGuidelines: InputMaybe<Scalars['Boolean']['input']>;
  bannedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  bannedPersonalUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  voteBanned: InputMaybe<Scalars['Boolean']['input']>;
  nullifyVotes: InputMaybe<Scalars['Boolean']['input']>;
  deleteContent: InputMaybe<Scalars['Boolean']['input']>;
  banned: InputMaybe<Scalars['Date']['input']>;
  auto_subscribe_to_my_posts: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_comments: InputMaybe<Scalars['Boolean']['input']>;
  autoSubscribeAsOrganizer: InputMaybe<Scalars['Boolean']['input']>;
  notificationCommentsOnSubscribedPost: InputMaybe<Scalars['JSON']['input']>;
  notificationShortformContent: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToMyComments: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToSubscribedComments: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserPost: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserComment: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsInGroups: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedTagPost: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedSequencePost: InputMaybe<Scalars['JSON']['input']>;
  notificationPrivateMessage: InputMaybe<Scalars['JSON']['input']>;
  notificationSharedWithMe: InputMaybe<Scalars['JSON']['input']>;
  notificationAlignmentSubmissionApproved: InputMaybe<Scalars['JSON']['input']>;
  notificationEventInRadius: InputMaybe<Scalars['JSON']['input']>;
  notificationKarmaPowersGained: InputMaybe<Scalars['JSON']['input']>;
  notificationRSVPs: InputMaybe<Scalars['JSON']['input']>;
  notificationGroupAdministration: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnDraft: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsNominatedReview: InputMaybe<Scalars['JSON']['input']>;
  notificationSubforumUnread: InputMaybe<Scalars['JSON']['input']>;
  notificationNewMention: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMessages: InputMaybe<Scalars['JSON']['input']>;
  notificationPublishedDialogueMessages: InputMaybe<Scalars['JSON']['input']>;
  notificationAddedAsCoauthor: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateCommentsOnSubscribedPost: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateReplies: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMatch: InputMaybe<Scalars['JSON']['input']>;
  notificationNewDialogueChecks: InputMaybe<Scalars['JSON']['input']>;
  notificationYourTurnMatchForm: InputMaybe<Scalars['JSON']['input']>;
  hideDialogueFacilitation: InputMaybe<Scalars['Boolean']['input']>;
  revealChecksToAdmins: InputMaybe<Scalars['Boolean']['input']>;
  optedInToDialogueFacilitation: InputMaybe<Scalars['Boolean']['input']>;
  showDialoguesList: Scalars['Boolean']['input'];
  showMyDialogues: Scalars['Boolean']['input'];
  showMatches: Scalars['Boolean']['input'];
  showRecommendedPartners: Scalars['Boolean']['input'];
  hideActiveDialogueUsers: InputMaybe<Scalars['Boolean']['input']>;
  karmaChangeNotifierSettings: InputMaybe<Scalars['JSON']['input']>;
  karmaChangeLastOpened: InputMaybe<Scalars['Date']['input']>;
  karmaChangeBatchStart: InputMaybe<Scalars['Date']['input']>;
  emailSubscribedToCurated: InputMaybe<Scalars['Boolean']['input']>;
  subscribedToDigest: InputMaybe<Scalars['Boolean']['input']>;
  unsubscribeFromAll: InputMaybe<Scalars['Boolean']['input']>;
  hideSubscribePoke: InputMaybe<Scalars['Boolean']['input']>;
  hideMeetupsPoke: InputMaybe<Scalars['Boolean']['input']>;
  hideHomeRHS: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  mapLocation: InputMaybe<Scalars['JSON']['input']>;
  mapMarkerText: InputMaybe<Scalars['String']['input']>;
  nearbyEventsNotifications: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotificationsLocation: InputMaybe<Scalars['JSON']['input']>;
  nearbyEventsNotificationsRadius: InputMaybe<Scalars['Float']['input']>;
  nearbyPeopleNotificationThreshold: InputMaybe<Scalars['Float']['input']>;
  hideFrontpageMap: InputMaybe<Scalars['Boolean']['input']>;
  hideTaggingProgressBar: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBookAd: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2019Ad: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2020Ad: InputMaybe<Scalars['Boolean']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  shortformFeedId: InputMaybe<Scalars['String']['input']>;
  viewUnreviewedComments: InputMaybe<Scalars['Boolean']['input']>;
  noExpandUnreadCommentsReview: InputMaybe<Scalars['Boolean']['input']>;
  profileUpdatedAt: Scalars['Date']['input'];
  jobTitle: InputMaybe<Scalars['String']['input']>;
  organization: InputMaybe<Scalars['String']['input']>;
  careerStage: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  website: InputMaybe<Scalars['String']['input']>;
  fmCrosspostUserId: InputMaybe<Scalars['String']['input']>;
  linkedinProfileURL: InputMaybe<Scalars['String']['input']>;
  facebookProfileURL: InputMaybe<Scalars['String']['input']>;
  blueskyProfileURL: InputMaybe<Scalars['String']['input']>;
  twitterProfileURL: InputMaybe<Scalars['String']['input']>;
  twitterProfileURLAdmin: InputMaybe<Scalars['String']['input']>;
  githubProfileURL: InputMaybe<Scalars['String']['input']>;
  profileTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  organizerOfGroupIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  programParticipation: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  postingDisabled: InputMaybe<Scalars['Boolean']['input']>;
  allCommentingDisabled: InputMaybe<Scalars['Boolean']['input']>;
  commentingOnOtherUsersDisabled: InputMaybe<Scalars['Boolean']['input']>;
  conversationsDisabled: InputMaybe<Scalars['Boolean']['input']>;
  acknowledgedNewUserGuidelines: InputMaybe<Scalars['Boolean']['input']>;
  subforumPreferredLayout: InputMaybe<Scalars['String']['input']>;
  hideJobAdUntil: InputMaybe<Scalars['Date']['input']>;
  criticismTipsDismissed: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPeopleDirectory: InputMaybe<Scalars['Boolean']['input']>;
  allowDatadogSessionReplay: InputMaybe<Scalars['Boolean']['input']>;
  reviewForAlignmentForumUserId: InputMaybe<Scalars['String']['input']>;
  afSubmittedApplication: InputMaybe<Scalars['Boolean']['input']>;
  hideSunshineSidebar: InputMaybe<Scalars['Boolean']['input']>;
  inactiveSurveyEmailSentAt: InputMaybe<Scalars['Date']['input']>;
  userSurveyEmailSentAt: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateUserInput = {
  selector: UserSelectorUniqueInput;
  data: UpdateUserDataInput;
};

export type UpsertUserInput = {
  selector: UserSelectorUniqueInput;
  data: UpdateUserDataInput;
};

export type UpdateUserDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
  moderationGuidelines: InputMaybe<Scalars['JSON']['input']>;
  howOthersCanHelpMe: InputMaybe<Scalars['JSON']['input']>;
  howICanHelpOthers: InputMaybe<Scalars['JSON']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  biography: InputMaybe<Scalars['JSON']['input']>;
  username: InputMaybe<Scalars['String']['input']>;
  isAdmin: InputMaybe<Scalars['Boolean']['input']>;
  displayName: InputMaybe<Scalars['String']['input']>;
  previousDisplayName: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  noindex: InputMaybe<Scalars['Boolean']['input']>;
  groups: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  theme: InputMaybe<Scalars['JSON']['input']>;
  lastUsedTimezone: InputMaybe<Scalars['String']['input']>;
  whenConfirmationEmailSent: InputMaybe<Scalars['Date']['input']>;
  legacy: InputMaybe<Scalars['Boolean']['input']>;
  commentSorting: InputMaybe<Scalars['String']['input']>;
  sortDraftsBy: InputMaybe<Scalars['String']['input']>;
  reactPaletteStyle: InputMaybe<Scalars['String']['input']>;
  noKibitz: InputMaybe<Scalars['Boolean']['input']>;
  showHideKarmaOption: InputMaybe<Scalars['Boolean']['input']>;
  showPostAuthorCard: InputMaybe<Scalars['Boolean']['input']>;
  hideIntercom: InputMaybe<Scalars['Boolean']['input']>;
  markDownPostEditor: InputMaybe<Scalars['Boolean']['input']>;
  hideElicitPredictions: InputMaybe<Scalars['Boolean']['input']>;
  hideAFNonMemberInitialWarning: InputMaybe<Scalars['Boolean']['input']>;
  noSingleLineComments: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsPosts: InputMaybe<Scalars['Boolean']['input']>;
  noCollapseCommentsFrontpage: InputMaybe<Scalars['Boolean']['input']>;
  hideCommunitySection: InputMaybe<Scalars['Boolean']['input']>;
  expandedFrontpageSections: InputMaybe<Scalars['JSON']['input']>;
  showCommunityInRecentDiscussion: InputMaybe<Scalars['Boolean']['input']>;
  hidePostsRecommendations: InputMaybe<Scalars['Boolean']['input']>;
  petrovOptOut: InputMaybe<Scalars['Boolean']['input']>;
  optedOutOfSurveys: InputMaybe<Scalars['Boolean']['input']>;
  postGlossariesPinned: InputMaybe<Scalars['Boolean']['input']>;
  generateJargonForDrafts: InputMaybe<Scalars['Boolean']['input']>;
  generateJargonForPublishedPosts: InputMaybe<Scalars['Boolean']['input']>;
  acceptedTos: InputMaybe<Scalars['Boolean']['input']>;
  hideNavigationSidebar: InputMaybe<Scalars['Boolean']['input']>;
  currentFrontpageFilter: InputMaybe<Scalars['String']['input']>;
  frontpageSelectedTab: InputMaybe<Scalars['String']['input']>;
  frontpageFilterSettings: InputMaybe<Scalars['JSON']['input']>;
  hideFrontpageFilterSettingsDesktop: InputMaybe<Scalars['Boolean']['input']>;
  allPostsTimeframe: InputMaybe<Scalars['String']['input']>;
  allPostsFilter: InputMaybe<Scalars['String']['input']>;
  allPostsSorting: InputMaybe<Scalars['String']['input']>;
  allPostsShowLowKarma: InputMaybe<Scalars['Boolean']['input']>;
  allPostsIncludeEvents: InputMaybe<Scalars['Boolean']['input']>;
  allPostsHideCommunity: InputMaybe<Scalars['Boolean']['input']>;
  allPostsOpenSettings: InputMaybe<Scalars['Boolean']['input']>;
  draftsListSorting: InputMaybe<Scalars['String']['input']>;
  draftsListShowArchived: InputMaybe<Scalars['Boolean']['input']>;
  draftsListShowShared: InputMaybe<Scalars['Boolean']['input']>;
  lastNotificationsCheck: InputMaybe<Scalars['Date']['input']>;
  moderationStyle: InputMaybe<Scalars['String']['input']>;
  moderatorAssistance: InputMaybe<Scalars['Boolean']['input']>;
  collapseModerationGuidelines: InputMaybe<Scalars['Boolean']['input']>;
  bannedUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  bannedPersonalUserIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  bookmarkedPostsMetadata: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  hiddenPostsMetadata: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  legacyId: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  permanentDeletionRequestedAt: InputMaybe<Scalars['Date']['input']>;
  voteBanned: InputMaybe<Scalars['Boolean']['input']>;
  nullifyVotes: InputMaybe<Scalars['Boolean']['input']>;
  deleteContent: InputMaybe<Scalars['Boolean']['input']>;
  banned: InputMaybe<Scalars['Date']['input']>;
  auto_subscribe_to_my_posts: InputMaybe<Scalars['Boolean']['input']>;
  auto_subscribe_to_my_comments: InputMaybe<Scalars['Boolean']['input']>;
  autoSubscribeAsOrganizer: InputMaybe<Scalars['Boolean']['input']>;
  notificationCommentsOnSubscribedPost: InputMaybe<Scalars['JSON']['input']>;
  notificationShortformContent: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToMyComments: InputMaybe<Scalars['JSON']['input']>;
  notificationRepliesToSubscribedComments: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserPost: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedUserComment: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsInGroups: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedTagPost: InputMaybe<Scalars['JSON']['input']>;
  notificationSubscribedSequencePost: InputMaybe<Scalars['JSON']['input']>;
  notificationPrivateMessage: InputMaybe<Scalars['JSON']['input']>;
  notificationSharedWithMe: InputMaybe<Scalars['JSON']['input']>;
  notificationAlignmentSubmissionApproved: InputMaybe<Scalars['JSON']['input']>;
  notificationEventInRadius: InputMaybe<Scalars['JSON']['input']>;
  notificationKarmaPowersGained: InputMaybe<Scalars['JSON']['input']>;
  notificationRSVPs: InputMaybe<Scalars['JSON']['input']>;
  notificationGroupAdministration: InputMaybe<Scalars['JSON']['input']>;
  notificationCommentsOnDraft: InputMaybe<Scalars['JSON']['input']>;
  notificationPostsNominatedReview: InputMaybe<Scalars['JSON']['input']>;
  notificationSubforumUnread: InputMaybe<Scalars['JSON']['input']>;
  notificationNewMention: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMessages: InputMaybe<Scalars['JSON']['input']>;
  notificationPublishedDialogueMessages: InputMaybe<Scalars['JSON']['input']>;
  notificationAddedAsCoauthor: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateCommentsOnSubscribedPost: InputMaybe<Scalars['JSON']['input']>;
  notificationDebateReplies: InputMaybe<Scalars['JSON']['input']>;
  notificationDialogueMatch: InputMaybe<Scalars['JSON']['input']>;
  notificationNewDialogueChecks: InputMaybe<Scalars['JSON']['input']>;
  notificationYourTurnMatchForm: InputMaybe<Scalars['JSON']['input']>;
  hideDialogueFacilitation: InputMaybe<Scalars['Boolean']['input']>;
  revealChecksToAdmins: InputMaybe<Scalars['Boolean']['input']>;
  optedInToDialogueFacilitation: InputMaybe<Scalars['Boolean']['input']>;
  showDialoguesList: InputMaybe<Scalars['Boolean']['input']>;
  showMyDialogues: InputMaybe<Scalars['Boolean']['input']>;
  showMatches: InputMaybe<Scalars['Boolean']['input']>;
  showRecommendedPartners: InputMaybe<Scalars['Boolean']['input']>;
  hideActiveDialogueUsers: InputMaybe<Scalars['Boolean']['input']>;
  karmaChangeNotifierSettings: InputMaybe<Scalars['JSON']['input']>;
  karmaChangeLastOpened: InputMaybe<Scalars['Date']['input']>;
  karmaChangeBatchStart: InputMaybe<Scalars['Date']['input']>;
  emailSubscribedToCurated: InputMaybe<Scalars['Boolean']['input']>;
  subscribedToDigest: InputMaybe<Scalars['Boolean']['input']>;
  unsubscribeFromAll: InputMaybe<Scalars['Boolean']['input']>;
  hideSubscribePoke: InputMaybe<Scalars['Boolean']['input']>;
  hideMeetupsPoke: InputMaybe<Scalars['Boolean']['input']>;
  hideHomeRHS: InputMaybe<Scalars['Boolean']['input']>;
  googleLocation: InputMaybe<Scalars['JSON']['input']>;
  location: InputMaybe<Scalars['String']['input']>;
  mapLocation: InputMaybe<Scalars['JSON']['input']>;
  mapMarkerText: InputMaybe<Scalars['String']['input']>;
  nearbyEventsNotifications: InputMaybe<Scalars['Boolean']['input']>;
  nearbyEventsNotificationsLocation: InputMaybe<Scalars['JSON']['input']>;
  nearbyEventsNotificationsRadius: InputMaybe<Scalars['Float']['input']>;
  nearbyPeopleNotificationThreshold: InputMaybe<Scalars['Float']['input']>;
  hideFrontpageMap: InputMaybe<Scalars['Boolean']['input']>;
  hideTaggingProgressBar: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2019Ad: InputMaybe<Scalars['Boolean']['input']>;
  hideFrontpageBook2020Ad: InputMaybe<Scalars['Boolean']['input']>;
  sunshineNotes: InputMaybe<Scalars['String']['input']>;
  sunshineFlagged: InputMaybe<Scalars['Boolean']['input']>;
  needsReview: InputMaybe<Scalars['Boolean']['input']>;
  sunshineSnoozed: InputMaybe<Scalars['Boolean']['input']>;
  snoozedUntilContentCount: InputMaybe<Scalars['Float']['input']>;
  reviewedByUserId: InputMaybe<Scalars['String']['input']>;
  reviewedAt: InputMaybe<Scalars['Date']['input']>;
  fullName: InputMaybe<Scalars['String']['input']>;
  shortformFeedId: InputMaybe<Scalars['String']['input']>;
  viewUnreviewedComments: InputMaybe<Scalars['Boolean']['input']>;
  partiallyReadSequences: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  beta: InputMaybe<Scalars['Boolean']['input']>;
  reviewVotesQuadratic: InputMaybe<Scalars['Boolean']['input']>;
  reviewVotesQuadratic2019: InputMaybe<Scalars['Boolean']['input']>;
  reviewVotesQuadratic2020: InputMaybe<Scalars['Boolean']['input']>;
  petrovPressedButtonDate: InputMaybe<Scalars['Date']['input']>;
  petrovLaunchCodeDate: InputMaybe<Scalars['Date']['input']>;
  defaultToCKEditor: InputMaybe<Scalars['Boolean']['input']>;
  signUpReCaptchaRating: InputMaybe<Scalars['Float']['input']>;
  noExpandUnreadCommentsReview: InputMaybe<Scalars['Boolean']['input']>;
  abTestKey: InputMaybe<Scalars['String']['input']>;
  abTestOverrides: InputMaybe<Scalars['JSON']['input']>;
  walledGardenInvite: InputMaybe<Scalars['Boolean']['input']>;
  walledGardenPortalOnboarded: InputMaybe<Scalars['Boolean']['input']>;
  taggingDashboardCollapsed: InputMaybe<Scalars['Boolean']['input']>;
  usernameUnset: InputMaybe<Scalars['Boolean']['input']>;
  paymentEmail: InputMaybe<Scalars['String']['input']>;
  paymentInfo: InputMaybe<Scalars['String']['input']>;
  profileUpdatedAt: InputMaybe<Scalars['Date']['input']>;
  profileImageId: InputMaybe<Scalars['String']['input']>;
  jobTitle: InputMaybe<Scalars['String']['input']>;
  organization: InputMaybe<Scalars['String']['input']>;
  careerStage: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  website: InputMaybe<Scalars['String']['input']>;
  fmCrosspostUserId: InputMaybe<Scalars['String']['input']>;
  linkedinProfileURL: InputMaybe<Scalars['String']['input']>;
  facebookProfileURL: InputMaybe<Scalars['String']['input']>;
  blueskyProfileURL: InputMaybe<Scalars['String']['input']>;
  twitterProfileURL: InputMaybe<Scalars['String']['input']>;
  twitterProfileURLAdmin: InputMaybe<Scalars['String']['input']>;
  githubProfileURL: InputMaybe<Scalars['String']['input']>;
  profileTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  organizerOfGroupIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  programParticipation: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  postingDisabled: InputMaybe<Scalars['Boolean']['input']>;
  allCommentingDisabled: InputMaybe<Scalars['Boolean']['input']>;
  commentingOnOtherUsersDisabled: InputMaybe<Scalars['Boolean']['input']>;
  conversationsDisabled: InputMaybe<Scalars['Boolean']['input']>;
  acknowledgedNewUserGuidelines: InputMaybe<Scalars['Boolean']['input']>;
  subforumPreferredLayout: InputMaybe<Scalars['String']['input']>;
  hideJobAdUntil: InputMaybe<Scalars['Date']['input']>;
  criticismTipsDismissed: InputMaybe<Scalars['Boolean']['input']>;
  hideFromPeopleDirectory: InputMaybe<Scalars['Boolean']['input']>;
  allowDatadogSessionReplay: InputMaybe<Scalars['Boolean']['input']>;
  reviewForAlignmentForumUserId: InputMaybe<Scalars['String']['input']>;
  afApplicationText: InputMaybe<Scalars['String']['input']>;
  afSubmittedApplication: InputMaybe<Scalars['Boolean']['input']>;
  hideSunshineSidebar: InputMaybe<Scalars['Boolean']['input']>;
  inactiveSurveyEmailSentAt: InputMaybe<Scalars['Date']['input']>;
  userSurveyEmailSentAt: InputMaybe<Scalars['Date']['input']>;
  recommendationSettings: InputMaybe<Scalars['JSON']['input']>;
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

export enum UserOrderByInput {
  Foobar = 'foobar'
}

export type Vote = {
  __typename?: 'Vote';
  _id: Scalars['String']['output'];
  schemaVersion: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  legacyData: Maybe<Scalars['JSON']['output']>;
  documentId: Maybe<Scalars['String']['output']>;
  collectionName: Maybe<Scalars['String']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  authorIds: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  authorId: Maybe<Scalars['String']['output']>;
  voteType: Maybe<Scalars['String']['output']>;
  extendedVoteType: Maybe<Scalars['JSON']['output']>;
  power: Maybe<Scalars['Float']['output']>;
  afPower: Maybe<Scalars['Float']['output']>;
  cancelled: Maybe<Scalars['Boolean']['output']>;
  isUnvote: Maybe<Scalars['Boolean']['output']>;
  votedAt: Maybe<Scalars['Date']['output']>;
  tagRel: Maybe<TagRel>;
  comment: Maybe<Comment>;
  post: Maybe<Post>;
  documentIsAf: Maybe<Scalars['Boolean']['output']>;
  silenceNotification: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteVoteInput = {
  selector: VoteSelectorUniqueInput;
};

export type SingleVoteInput = {
  selector: InputMaybe<VoteSelectorUniqueInput>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  allowNull: InputMaybe<Scalars['Boolean']['input']>;
};

export type MultiVoteInput = {
  terms: InputMaybe<Scalars['JSON']['input']>;
  resolverArgs: InputMaybe<Scalars['JSON']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  enableCache: InputMaybe<Scalars['Boolean']['input']>;
  enableTotal: InputMaybe<Scalars['Boolean']['input']>;
  createIfMissing: InputMaybe<Scalars['JSON']['input']>;
  where: InputMaybe<VoteSelectorInput>;
  orderBy: InputMaybe<VoteOrderByInput>;
  skip: InputMaybe<Scalars['Int']['input']>;
  after: InputMaybe<Scalars['String']['input']>;
  before: InputMaybe<Scalars['String']['input']>;
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
};

export type SingleVoteOutput = {
  __typename?: 'SingleVoteOutput';
  result: Maybe<Vote>;
};

export type MultiVoteOutput = {
  __typename?: 'MultiVoteOutput';
  results: Maybe<Array<Maybe<Vote>>>;
  totalCount: Maybe<Scalars['Int']['output']>;
};

export type VoteOutput = {
  __typename?: 'VoteOutput';
  data: Maybe<Vote>;
};

export type CreateVoteInput = {
  data: CreateVoteDataInput;
};

export type CreateVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateVoteInput = {
  selector: VoteSelectorUniqueInput;
  data: UpdateVoteDataInput;
};

export type UpsertVoteInput = {
  selector: VoteSelectorUniqueInput;
  data: UpdateVoteDataInput;
};

export type UpdateVoteDataInput = {
  legacyData: InputMaybe<Scalars['JSON']['input']>;
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

export enum VoteOrderByInput {
  Foobar = 'foobar'
}

export type Query = {
  __typename?: 'Query';
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
  commentModeratorAction: Maybe<SingleCommentModeratorActionOutput>;
  commentModeratorActions: Maybe<MultiCommentModeratorActionOutput>;
  comment: Maybe<SingleCommentOutput>;
  comments: Maybe<MultiCommentOutput>;
  conversation: Maybe<SingleConversationOutput>;
  conversations: Maybe<MultiConversationOutput>;
  curationNotice: Maybe<SingleCurationNoticeOutput>;
  curationNotices: Maybe<MultiCurationNoticeOutput>;
  dialogueCheck: Maybe<SingleDialogueCheckOutput>;
  dialogueChecks: Maybe<MultiDialogueCheckOutput>;
  dialogueMatchPreference: Maybe<SingleDialogueMatchPreferenceOutput>;
  dialogueMatchPreferences: Maybe<MultiDialogueMatchPreferenceOutput>;
  digestPost: Maybe<SingleDigestPostOutput>;
  digestPosts: Maybe<MultiDigestPostOutput>;
  digest: Maybe<SingleDigestOutput>;
  digests: Maybe<MultiDigestOutput>;
  electionCandidate: Maybe<SingleElectionCandidateOutput>;
  electionCandidates: Maybe<MultiElectionCandidateOutput>;
  electionVote: Maybe<SingleElectionVoteOutput>;
  electionVotes: Maybe<MultiElectionVoteOutput>;
  elicitQuestionPrediction: Maybe<SingleElicitQuestionPredictionOutput>;
  elicitQuestionPredictions: Maybe<MultiElicitQuestionPredictionOutput>;
  elicitQuestion: Maybe<SingleElicitQuestionOutput>;
  elicitQuestions: Maybe<MultiElicitQuestionOutput>;
  featuredResource: Maybe<SingleFeaturedResourceOutput>;
  featuredResources: Maybe<MultiFeaturedResourceOutput>;
  forumEvent: Maybe<SingleForumEventOutput>;
  forumEvents: Maybe<MultiForumEventOutput>;
  gardenCode: Maybe<SingleGardenCodeOutput>;
  gardenCodes: Maybe<MultiGardenCodeOutput>;
  googleServiceAccountSession: Maybe<SingleGoogleServiceAccountSessionOutput>;
  googleServiceAccountSessions: Maybe<MultiGoogleServiceAccountSessionOutput>;
  jargonTerm: Maybe<SingleJargonTermOutput>;
  jargonTerms: Maybe<MultiJargonTermOutput>;
  lWEvent: Maybe<SingleLwEventOutput>;
  lWEvents: Maybe<MultiLwEventOutput>;
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
  multiDocument: Maybe<SingleMultiDocumentOutput>;
  multiDocuments: Maybe<MultiMultiDocumentOutput>;
  notification: Maybe<SingleNotificationOutput>;
  notifications: Maybe<MultiNotificationOutput>;
  petrovDayAction: Maybe<SinglePetrovDayActionOutput>;
  petrovDayActions: Maybe<MultiPetrovDayActionOutput>;
  podcastEpisode: Maybe<SinglePodcastEpisodeOutput>;
  podcastEpisodes: Maybe<MultiPodcastEpisodeOutput>;
  podcast: Maybe<SinglePodcastOutput>;
  podcasts: Maybe<MultiPodcastOutput>;
  postEmbedding: Maybe<SinglePostEmbeddingOutput>;
  postEmbeddings: Maybe<MultiPostEmbeddingOutput>;
  postRelation: Maybe<SinglePostRelationOutput>;
  postRelations: Maybe<MultiPostRelationOutput>;
  postViewTime: Maybe<SinglePostViewTimeOutput>;
  postViewTimes: Maybe<MultiPostViewTimeOutput>;
  postViews: Maybe<SinglePostViewsOutput>;
  postViewses: Maybe<MultiPostViewsOutput>;
  post: Maybe<SinglePostOutput>;
  posts: Maybe<MultiPostOutput>;
  rSSFeed: Maybe<SingleRssFeedOutput>;
  rSSFeeds: Maybe<MultiRssFeedOutput>;
  report: Maybe<SingleReportOutput>;
  reports: Maybe<MultiReportOutput>;
  reviewVote: Maybe<SingleReviewVoteOutput>;
  reviewVotes: Maybe<MultiReviewVoteOutput>;
  reviewWinnerArt: Maybe<SingleReviewWinnerArtOutput>;
  reviewWinnerArts: Maybe<MultiReviewWinnerArtOutput>;
  reviewWinner: Maybe<SingleReviewWinnerOutput>;
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
  surveyQuestion: Maybe<SingleSurveyQuestionOutput>;
  surveyQuestions: Maybe<MultiSurveyQuestionOutput>;
  surveyResponse: Maybe<SingleSurveyResponseOutput>;
  surveyResponses: Maybe<MultiSurveyResponseOutput>;
  surveySchedule: Maybe<SingleSurveyScheduleOutput>;
  surveySchedules: Maybe<MultiSurveyScheduleOutput>;
  survey: Maybe<SingleSurveyOutput>;
  surveys: Maybe<MultiSurveyOutput>;
  tagFlag: Maybe<SingleTagFlagOutput>;
  tagFlags: Maybe<MultiTagFlagOutput>;
  tagRel: Maybe<SingleTagRelOutput>;
  tagRels: Maybe<MultiTagRelOutput>;
  tag: Maybe<SingleTagOutput>;
  tags: Maybe<MultiTagOutput>;
  typingIndicator: Maybe<SingleTypingIndicatorOutput>;
  typingIndicators: Maybe<MultiTypingIndicatorOutput>;
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
  user: Maybe<SingleUserOutput>;
  users: Maybe<MultiUserOutput>;
  vote: Maybe<SingleVoteOutput>;
  votes: Maybe<MultiVoteOutput>;
  EmailPreview: Maybe<Array<Maybe<EmailPreview>>>;
  ContinueReading: Maybe<Array<RecommendResumeSequence>>;
  Recommendations: Maybe<Array<Post>>;
  UserReadsPerCoreTag: Maybe<Array<Maybe<UserCoreTagReads>>>;
  GetRandomUser: Maybe<User>;
  IsDisplayNameTaken: Scalars['Boolean']['output'];
  SuggestedFeedSubscriptionUsers: Maybe<SuggestedFeedSubscriptionUsersResult>;
  CommentsWithReacts: Maybe<CommentsWithReactsResult>;
  PopularComments: Maybe<PopularCommentsResult>;
  PostAnalytics: PostAnalyticsResult;
  MultiPostAnalytics: MultiPostAnalyticsResult;
  AnalyticsSeries: Maybe<Array<Maybe<AnalyticsSeriesValue>>>;
  ArbitalPageData: Maybe<ArbitalPageData>;
  CoronaVirusData: Maybe<CoronaVirusDataSchema>;
  ElicitBlockData: Maybe<ElicitBlockData>;
  unreadNotificationCounts: NotificationCounts;
  NotificationDisplays: Maybe<NotificationDisplaysResult>;
  Lightcone2024FundraiserStripeAmounts: Maybe<Array<Scalars['Int']['output']>>;
  PetrovDay2024CheckNumberOfIncoming: Maybe<PetrovDay2024CheckNumberOfIncomingData>;
  petrov2024checkIfNuked: Maybe<Scalars['Boolean']['output']>;
  PetrovDayCheckIfIncoming: Maybe<PetrovDayCheckIfIncomingData>;
  GivingSeasonHearts: Array<GivingSeasonHeart>;
  UsersReadPostsOfTargetUser: Maybe<Array<Post>>;
  UserReadHistory: Maybe<UserReadHistoryResult>;
  PostsUserCommentedOn: Maybe<UserReadHistoryResult>;
  PostIsCriticism: Maybe<Scalars['Boolean']['output']>;
  DigestPlannerData: Maybe<Array<Maybe<DigestPlannerPost>>>;
  DigestPosts: Maybe<Array<Maybe<Post>>>;
  CanAccessGoogleDoc: Maybe<Scalars['Boolean']['output']>;
  DigestHighlights: Maybe<DigestHighlightsResult>;
  DigestPostsThisWeek: Maybe<DigestPostsThisWeekResult>;
  CuratedAndPopularThisWeek: Maybe<CuratedAndPopularThisWeekResult>;
  RecentlyActiveDialogues: Maybe<RecentlyActiveDialoguesResult>;
  MyDialogues: Maybe<MyDialoguesResult>;
  GoogleVertexPosts: Maybe<GoogleVertexPostsResult>;
  CrossedKarmaThreshold: Maybe<CrossedKarmaThresholdResult>;
  RecombeeLatestPosts: Maybe<RecombeeLatestPostsResult>;
  RecombeeHybridPosts: Maybe<RecombeeHybridPostsResult>;
  PostsWithActiveDiscussion: Maybe<PostsWithActiveDiscussionResult>;
  PostsBySubscribedAuthors: Maybe<PostsBySubscribedAuthorsResult>;
  PostsWithApprovedJargon: Maybe<PostsWithApprovedJargonResult>;
  AllTagsActivityFeed: AllTagsActivityFeedQueryResults;
  RecentDiscussionFeed: RecentDiscussionFeedQueryResults;
  SubscribedFeed: SubscribedFeedQueryResults;
  TagHistoryFeed: TagHistoryFeedQueryResults;
  SubforumMagicFeed: SubforumMagicFeedQueryResults;
  SubforumTopFeed: SubforumTopFeedQueryResults;
  SubforumRecentCommentsFeed: SubforumRecentCommentsFeedQueryResults;
  SubforumNewFeed: SubforumNewFeedQueryResults;
  SubforumOldFeed: SubforumOldFeedQueryResults;
  CurrentFrontpageSurvey: Maybe<SurveySchedule>;
  TagUpdatesInTimeBlock: Maybe<Array<TagUpdates>>;
  TagUpdatesByUser: Maybe<Array<TagUpdates>>;
  RandomTag: Tag;
  ActiveTagCount: Scalars['Int']['output'];
  TagPreview: Maybe<TagPreviewWithSummaries>;
  TagsByCoreTagId: TagWithTotalCount;
  UserWrappedDataByYear: Maybe<WrappedDataByYear>;
  SiteData: Maybe<Site>;
  latestDialogueMessages: Maybe<Array<Scalars['String']['output']>>;
  getLinkSharedPost: Maybe<Post>;
  MigrationsDashboard: Maybe<MigrationsDashboardData>;
  GetAllReviewWinners: Array<Post>;
  convertDocument: Maybe<Scalars['JSON']['output']>;
  latestGoogleDocMetadata: Maybe<Scalars['JSON']['output']>;
  moderatorViewIPAddress: Maybe<ModeratorIpAddressInfo>;
  RssPostChanges: RssPostChangeInfo;
  AdminMetadata: Maybe<Scalars['String']['output']>;
  currentUser: Maybe<User>;
  SearchSynonyms: Array<Scalars['String']['output']>;
  getCrosspost: Maybe<Scalars['JSON']['output']>;
  RevisionsDiff: Maybe<Scalars['String']['output']>;
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


export type QueryCommentModeratorActionArgs = {
  input: InputMaybe<SingleCommentModeratorActionInput>;
};


export type QueryCommentModeratorActionsArgs = {
  input: InputMaybe<MultiCommentModeratorActionInput>;
};


export type QueryCommentArgs = {
  input: InputMaybe<SingleCommentInput>;
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


export type QueryDigestPostArgs = {
  input: InputMaybe<SingleDigestPostInput>;
};


export type QueryDigestPostsArgs = {
  input: InputMaybe<MultiDigestPostInput>;
};


export type QueryDigestArgs = {
  input: InputMaybe<SingleDigestInput>;
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


export type QueryElicitQuestionPredictionArgs = {
  input: InputMaybe<SingleElicitQuestionPredictionInput>;
};


export type QueryElicitQuestionPredictionsArgs = {
  input: InputMaybe<MultiElicitQuestionPredictionInput>;
};


export type QueryElicitQuestionArgs = {
  input: InputMaybe<SingleElicitQuestionInput>;
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


export type QueryPodcastEpisodeArgs = {
  input: InputMaybe<SinglePodcastEpisodeInput>;
};


export type QueryPodcastEpisodesArgs = {
  input: InputMaybe<MultiPodcastEpisodeInput>;
};


export type QueryPodcastArgs = {
  input: InputMaybe<SinglePodcastInput>;
};


export type QueryPodcastsArgs = {
  input: InputMaybe<MultiPodcastInput>;
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


export type QueryPostArgs = {
  input: InputMaybe<SinglePostInput>;
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


export type QueryReviewWinnerArtArgs = {
  input: InputMaybe<SingleReviewWinnerArtInput>;
};


export type QueryReviewWinnerArtsArgs = {
  input: InputMaybe<MultiReviewWinnerArtInput>;
};


export type QueryReviewWinnerArgs = {
  input: InputMaybe<SingleReviewWinnerInput>;
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


export type QuerySurveyArgs = {
  input: InputMaybe<SingleSurveyInput>;
};


export type QuerySurveysArgs = {
  input: InputMaybe<MultiSurveyInput>;
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


export type QueryTagArgs = {
  input: InputMaybe<SingleTagInput>;
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


export type QueryUserArgs = {
  input: InputMaybe<SingleUserInput>;
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


export type QueryEmailPreviewArgs = {
  notificationIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  postId: InputMaybe<Scalars['String']['input']>;
};


export type QueryRecommendationsArgs = {
  count: InputMaybe<Scalars['Int']['input']>;
  algorithm: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryUserReadsPerCoreTagArgs = {
  userId: Scalars['String']['input'];
};


export type QueryGetRandomUserArgs = {
  userIsAuthor: Scalars['String']['input'];
};


export type QueryIsDisplayNameTakenArgs = {
  displayName: Scalars['String']['input'];
};


export type QuerySuggestedFeedSubscriptionUsersArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCommentsWithReactsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPopularCommentsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostAnalyticsArgs = {
  postId: Scalars['String']['input'];
};


export type QueryMultiPostAnalyticsArgs = {
  userId: InputMaybe<Scalars['String']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sortBy: InputMaybe<Scalars['String']['input']>;
  desc: InputMaybe<Scalars['Boolean']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAnalyticsSeriesArgs = {
  userId: InputMaybe<Scalars['String']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
};


export type QueryArbitalPageDataArgs = {
  pageAlias: InputMaybe<Scalars['String']['input']>;
};


export type QueryElicitBlockDataArgs = {
  questionId: InputMaybe<Scalars['String']['input']>;
};


export type QueryNotificationDisplaysArgs = {
  type: InputMaybe<Scalars['String']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGivingSeasonHeartsArgs = {
  electionName: Scalars['String']['input'];
};


export type QueryUsersReadPostsOfTargetUserArgs = {
  userId: Scalars['String']['input'];
  targetUserId: Scalars['String']['input'];
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUserReadHistoryArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  filter: InputMaybe<PostReviewFilter>;
  sort: InputMaybe<PostReviewSort>;
};


export type QueryPostsUserCommentedOnArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  filter: InputMaybe<PostReviewFilter>;
  sort: InputMaybe<PostReviewSort>;
};


export type QueryPostIsCriticismArgs = {
  args: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryDigestPlannerDataArgs = {
  digestId: InputMaybe<Scalars['String']['input']>;
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
};


export type QueryDigestPostsArgs = {
  num: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCanAccessGoogleDocArgs = {
  fileUrl: Scalars['String']['input'];
};


export type QueryDigestHighlightsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDigestPostsThisWeekArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCuratedAndPopularThisWeekArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentlyActiveDialoguesArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMyDialoguesArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGoogleVertexPostsArgs = {
  settings: InputMaybe<Scalars['JSON']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCrossedKarmaThresholdArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecombeeLatestPostsArgs = {
  settings: InputMaybe<Scalars['JSON']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecombeeHybridPostsArgs = {
  settings: InputMaybe<Scalars['JSON']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostsWithActiveDiscussionArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostsBySubscribedAuthorsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostsWithApprovedJargonArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAllTagsActivityFeedArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentDiscussionFeedArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySubscribedFeedArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryTagHistoryFeedArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
  options: InputMaybe<Scalars['JSON']['input']>;
};


export type QuerySubforumMagicFeedArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  cutoff: InputMaybe<Scalars['Float']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySubforumTopFeedArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  cutoff: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySubforumRecentCommentsFeedArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySubforumNewFeedArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySubforumOldFeedArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  cutoff: InputMaybe<Scalars['Date']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  tagId: Scalars['String']['input'];
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryTagUpdatesInTimeBlockArgs = {
  before: Scalars['Date']['input'];
  after: Scalars['Date']['input'];
};


export type QueryTagUpdatesByUserArgs = {
  userId: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
};


export type QueryTagPreviewArgs = {
  slug: Scalars['String']['input'];
  hash: InputMaybe<Scalars['String']['input']>;
};


export type QueryTagsByCoreTagIdArgs = {
  coreTagId: InputMaybe<Scalars['String']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  searchTagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryUserWrappedDataByYearArgs = {
  userId: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};


export type QueryLatestDialogueMessagesArgs = {
  dialogueId: Scalars['String']['input'];
  numMessages: Scalars['Int']['input'];
};


export type QueryGetLinkSharedPostArgs = {
  postId: Scalars['String']['input'];
  linkSharingKey: Scalars['String']['input'];
};


export type QueryConvertDocumentArgs = {
  document: InputMaybe<Scalars['JSON']['input']>;
  targetFormat: InputMaybe<Scalars['String']['input']>;
};


export type QueryLatestGoogleDocMetadataArgs = {
  postId: Scalars['String']['input'];
  version: InputMaybe<Scalars['String']['input']>;
};


export type QueryModeratorViewIpAddressArgs = {
  ipAddress: Scalars['String']['input'];
};


export type QueryRssPostChangesArgs = {
  postId: Scalars['String']['input'];
};


export type QueryGetCrosspostArgs = {
  args: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryRevisionsDiffArgs = {
  collectionName: Scalars['String']['input'];
  fieldName: Scalars['String']['input'];
  id: InputMaybe<Scalars['String']['input']>;
  beforeRev: InputMaybe<Scalars['String']['input']>;
  afterRev: Scalars['String']['input'];
  trim: InputMaybe<Scalars['Boolean']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createAdvisorRequest: Maybe<AdvisorRequestOutput>;
  updateAdvisorRequest: Maybe<AdvisorRequestOutput>;
  createArbitalTagContentRel: Maybe<ArbitalTagContentRelOutput>;
  updateArbitalTagContentRel: Maybe<ArbitalTagContentRelOutput>;
  createBan: Maybe<BanOutput>;
  updateBan: Maybe<BanOutput>;
  createBook: Maybe<BookOutput>;
  updateBook: Maybe<BookOutput>;
  createChapter: Maybe<ChapterOutput>;
  updateChapter: Maybe<ChapterOutput>;
  createCollection: Maybe<CollectionOutput>;
  updateCollection: Maybe<CollectionOutput>;
  createCommentModeratorAction: Maybe<CommentModeratorActionOutput>;
  updateCommentModeratorAction: Maybe<CommentModeratorActionOutput>;
  createComment: Maybe<CommentOutput>;
  updateComment: Maybe<CommentOutput>;
  createConversation: Maybe<ConversationOutput>;
  updateConversation: Maybe<ConversationOutput>;
  createCurationNotice: Maybe<CurationNoticeOutput>;
  updateCurationNotice: Maybe<CurationNoticeOutput>;
  createDialogueMatchPreference: Maybe<DialogueMatchPreferenceOutput>;
  updateDialogueMatchPreference: Maybe<DialogueMatchPreferenceOutput>;
  createDigestPost: Maybe<DigestPostOutput>;
  updateDigestPost: Maybe<DigestPostOutput>;
  createDigest: Maybe<DigestOutput>;
  updateDigest: Maybe<DigestOutput>;
  createElectionCandidate: Maybe<ElectionCandidateOutput>;
  updateElectionCandidate: Maybe<ElectionCandidateOutput>;
  createElectionVote: Maybe<ElectionVoteOutput>;
  updateElectionVote: Maybe<ElectionVoteOutput>;
  createElicitQuestion: Maybe<ElicitQuestionOutput>;
  updateElicitQuestion: Maybe<ElicitQuestionOutput>;
  createForumEvent: Maybe<ForumEventOutput>;
  updateForumEvent: Maybe<ForumEventOutput>;
  createGardenCode: Maybe<GardenCodeOutput>;
  updateGardenCode: Maybe<GardenCodeOutput>;
  createGoogleServiceAccountSession: Maybe<GoogleServiceAccountSessionOutput>;
  updateGoogleServiceAccountSession: Maybe<GoogleServiceAccountSessionOutput>;
  createJargonTerm: Maybe<JargonTermOutput>;
  updateJargonTerm: Maybe<JargonTermOutput>;
  createLWEvent: Maybe<LwEventOutput>;
  updateLWEvent: Maybe<LwEventOutput>;
  createLlmConversation: Maybe<LlmConversationOutput>;
  updateLlmConversation: Maybe<LlmConversationOutput>;
  createLocalgroup: Maybe<LocalgroupOutput>;
  updateLocalgroup: Maybe<LocalgroupOutput>;
  createMessage: Maybe<MessageOutput>;
  updateMessage: Maybe<MessageOutput>;
  createModerationTemplate: Maybe<ModerationTemplateOutput>;
  updateModerationTemplate: Maybe<ModerationTemplateOutput>;
  createModeratorAction: Maybe<ModeratorActionOutput>;
  updateModeratorAction: Maybe<ModeratorActionOutput>;
  createMultiDocument: Maybe<MultiDocumentOutput>;
  updateMultiDocument: Maybe<MultiDocumentOutput>;
  createNotification: Maybe<NotificationOutput>;
  updateNotification: Maybe<NotificationOutput>;
  createPetrovDayAction: Maybe<PetrovDayActionOutput>;
  updatePetrovDayAction: Maybe<PetrovDayActionOutput>;
  createPodcastEpisode: Maybe<PodcastEpisodeOutput>;
  updatePodcastEpisode: Maybe<PodcastEpisodeOutput>;
  createPostEmbedding: Maybe<PostEmbeddingOutput>;
  updatePostEmbedding: Maybe<PostEmbeddingOutput>;
  createPostViewTime: Maybe<PostViewTimeOutput>;
  updatePostViewTime: Maybe<PostViewTimeOutput>;
  createPostViews: Maybe<PostViewsOutput>;
  updatePostViews: Maybe<PostViewsOutput>;
  createPost: Maybe<PostOutput>;
  updatePost: Maybe<PostOutput>;
  createRSSFeed: Maybe<RssFeedOutput>;
  updateRSSFeed: Maybe<RssFeedOutput>;
  createReport: Maybe<ReportOutput>;
  updateReport: Maybe<ReportOutput>;
  createReviewWinnerArt: Maybe<ReviewWinnerArtOutput>;
  updateReviewWinnerArt: Maybe<ReviewWinnerArtOutput>;
  createReviewWinner: Maybe<ReviewWinnerOutput>;
  updateReviewWinner: Maybe<ReviewWinnerOutput>;
  updateRevision: Maybe<RevisionOutput>;
  createSequence: Maybe<SequenceOutput>;
  updateSequence: Maybe<SequenceOutput>;
  createSplashArtCoordinate: Maybe<SplashArtCoordinateOutput>;
  updateSplashArtCoordinate: Maybe<SplashArtCoordinateOutput>;
  createSpotlight: Maybe<SpotlightOutput>;
  updateSpotlight: Maybe<SpotlightOutput>;
  createSubscription: Maybe<SubscriptionOutput>;
  createSurveyQuestion: Maybe<SurveyQuestionOutput>;
  updateSurveyQuestion: Maybe<SurveyQuestionOutput>;
  createSurveyResponse: Maybe<SurveyResponseOutput>;
  updateSurveyResponse: Maybe<SurveyResponseOutput>;
  createSurveySchedule: Maybe<SurveyScheduleOutput>;
  updateSurveySchedule: Maybe<SurveyScheduleOutput>;
  createSurvey: Maybe<SurveyOutput>;
  updateSurvey: Maybe<SurveyOutput>;
  createTagFlag: Maybe<TagFlagOutput>;
  updateTagFlag: Maybe<TagFlagOutput>;
  createTagRel: Maybe<TagRelOutput>;
  updateTagRel: Maybe<TagRelOutput>;
  createTag: Maybe<TagOutput>;
  updateTag: Maybe<TagOutput>;
  createUserEAGDetail: Maybe<UserEagDetailOutput>;
  updateUserEAGDetail: Maybe<UserEagDetailOutput>;
  createUserJobAd: Maybe<UserJobAdOutput>;
  updateUserJobAd: Maybe<UserJobAdOutput>;
  createUserMostValuablePost: Maybe<UserMostValuablePostOutput>;
  updateUserMostValuablePost: Maybe<UserMostValuablePostOutput>;
  createUserRateLimit: Maybe<UserRateLimitOutput>;
  updateUserRateLimit: Maybe<UserRateLimitOutput>;
  createUserTagRel: Maybe<UserTagRelOutput>;
  updateUserTagRel: Maybe<UserTagRelOutput>;
  createUser: Maybe<UserOutput>;
  updateUser: Maybe<UserOutput>;
  dismissRecommendation: Maybe<Scalars['Boolean']['output']>;
  NewUserCompleteProfile: Maybe<NewUserCompletedProfile>;
  UserExpandFrontpageSection: Maybe<Scalars['Boolean']['output']>;
  UserUpdateSubforumMembership: Maybe<User>;
  setVotePost: Maybe<Post>;
  performVotePost: Maybe<VoteResultPost>;
  setVoteComment: Maybe<Comment>;
  performVoteComment: Maybe<VoteResultComment>;
  setVoteTagRel: Maybe<TagRel>;
  performVoteTagRel: Maybe<VoteResultTagRel>;
  setVoteRevision: Maybe<Revision>;
  performVoteRevision: Maybe<VoteResultRevision>;
  setVoteElectionCandidate: Maybe<ElectionCandidate>;
  performVoteElectionCandidate: Maybe<VoteResultElectionCandidate>;
  setVoteTag: Maybe<Tag>;
  performVoteTag: Maybe<VoteResultTag>;
  setVoteMultiDocument: Maybe<MultiDocument>;
  performVoteMultiDocument: Maybe<VoteResultMultiDocument>;
  moderateComment: Maybe<Comment>;
  MakeElicitPrediction: Maybe<ElicitBlockData>;
  MarkAllNotificationsAsRead: Maybe<Scalars['Boolean']['output']>;
  sendNewDialogueMessageNotification: Scalars['Boolean']['output'];
  PetrovDayLaunchMissile: Maybe<PetrovDayLaunchMissileData>;
  submitReviewVote: Maybe<Post>;
  AddGivingSeasonHeart: Array<GivingSeasonHeart>;
  RemoveGivingSeasonHeart: Array<GivingSeasonHeart>;
  ImportGoogleDoc: Maybe<Post>;
  revokeGoogleServiceAccountTokens: Scalars['Boolean']['output'];
  alignmentComment: Maybe<Comment>;
  alignmentPost: Maybe<Post>;
  markConversationRead: Scalars['Boolean']['output'];
  sendEventTriggeredDM: Scalars['Boolean']['output'];
  editSurvey: Maybe<Survey>;
  mergeTags: Maybe<Scalars['Boolean']['output']>;
  promoteLensToMain: Maybe<Scalars['Boolean']['output']>;
  RefreshDbSettings: Maybe<Scalars['Boolean']['output']>;
  login: Maybe<LoginReturnData>;
  signup: Maybe<LoginReturnData>;
  logout: Maybe<LoginReturnData>;
  resetPassword: Maybe<Scalars['String']['output']>;
  AddForumEventVote: Maybe<Scalars['Boolean']['output']>;
  RemoveForumEventVote: Maybe<Scalars['Boolean']['output']>;
  RemoveForumEventSticker: Maybe<Scalars['Boolean']['output']>;
  unlockPost: Maybe<Post>;
  revertPostToRevision: Maybe<Post>;
  sendVertexViewItemEvent: Scalars['Boolean']['output'];
  sendVertexMediaCompleteEvent: Scalars['Boolean']['output'];
  sendVertexViewHomePageEvent: Scalars['Boolean']['output'];
  importUrlAsDraftPost: ExternalPostImportData;
  revertTagToRevision: Maybe<Tag>;
  autosaveRevision: Maybe<Revision>;
  lockThread: Scalars['Boolean']['output'];
  unlockThread: Scalars['Boolean']['output'];
  reorderSummaries: Maybe<Scalars['Boolean']['output']>;
  publishAndDeDuplicateSpotlight: Maybe<Spotlight>;
  upsertUserTypingIndicator: Maybe<TypingIndicator>;
  acceptCoauthorRequest: Maybe<Post>;
  setIsBookmarked: User;
  setIsHidden: User;
  markAsReadOrUnread: Maybe<Scalars['Boolean']['output']>;
  markPostCommentsRead: Maybe<Scalars['Boolean']['output']>;
  resyncRssFeed: Scalars['Boolean']['output'];
  updateContinueReading: Maybe<Scalars['Boolean']['output']>;
  getNewJargonTerms: Maybe<Array<Maybe<JargonTerm>>>;
  RSVPToEvent: Maybe<Post>;
  CancelRSVPToEvent: Maybe<Post>;
  addOrUpvoteTag: Maybe<TagRel>;
  addTags: Maybe<Scalars['Boolean']['output']>;
  analyticsEvent: Maybe<Scalars['Boolean']['output']>;
  UpdateSearchSynonyms: Array<Scalars['String']['output']>;
  useEmailToken: Maybe<Scalars['JSON']['output']>;
  connectCrossposter: Maybe<Scalars['String']['output']>;
  unlinkCrossposter: Maybe<Scalars['String']['output']>;
  observeRecommendation: Maybe<Scalars['Boolean']['output']>;
  clickRecommendation: Maybe<Scalars['Boolean']['output']>;
  increasePostViewCount: Maybe<Scalars['Float']['output']>;
  generateCoverImagesForPost: Maybe<Array<Maybe<ReviewWinnerArt>>>;
  flipSplashArtImage: Maybe<Scalars['Boolean']['output']>;
};


export type MutationCreateAdvisorRequestArgs = {
  data: CreateAdvisorRequestDataInput;
};


export type MutationUpdateAdvisorRequestArgs = {
  selector: AdvisorRequestSelectorUniqueInput;
  data: UpdateAdvisorRequestDataInput;
};


export type MutationCreateArbitalTagContentRelArgs = {
  data: CreateArbitalTagContentRelDataInput;
};


export type MutationUpdateArbitalTagContentRelArgs = {
  selector: ArbitalTagContentRelSelectorUniqueInput;
  data: UpdateArbitalTagContentRelDataInput;
};


export type MutationCreateBanArgs = {
  data: CreateBanDataInput;
};


export type MutationUpdateBanArgs = {
  selector: BanSelectorUniqueInput;
  data: UpdateBanDataInput;
};


export type MutationCreateBookArgs = {
  data: CreateBookDataInput;
};


export type MutationUpdateBookArgs = {
  selector: BookSelectorUniqueInput;
  data: UpdateBookDataInput;
};


export type MutationCreateChapterArgs = {
  data: CreateChapterDataInput;
};


export type MutationUpdateChapterArgs = {
  selector: ChapterSelectorUniqueInput;
  data: UpdateChapterDataInput;
};


export type MutationCreateCollectionArgs = {
  data: CreateCollectionDataInput;
};


export type MutationUpdateCollectionArgs = {
  selector: CollectionSelectorUniqueInput;
  data: UpdateCollectionDataInput;
};


export type MutationCreateCommentModeratorActionArgs = {
  data: CreateCommentModeratorActionDataInput;
};


export type MutationUpdateCommentModeratorActionArgs = {
  selector: CommentModeratorActionSelectorUniqueInput;
  data: UpdateCommentModeratorActionDataInput;
};


export type MutationCreateCommentArgs = {
  data: CreateCommentDataInput;
};


export type MutationUpdateCommentArgs = {
  selector: CommentSelectorUniqueInput;
  data: UpdateCommentDataInput;
};


export type MutationCreateConversationArgs = {
  data: CreateConversationDataInput;
};


export type MutationUpdateConversationArgs = {
  selector: ConversationSelectorUniqueInput;
  data: UpdateConversationDataInput;
};


export type MutationCreateCurationNoticeArgs = {
  data: CreateCurationNoticeDataInput;
};


export type MutationUpdateCurationNoticeArgs = {
  selector: CurationNoticeSelectorUniqueInput;
  data: UpdateCurationNoticeDataInput;
};


export type MutationCreateDialogueMatchPreferenceArgs = {
  data: CreateDialogueMatchPreferenceDataInput;
};


export type MutationUpdateDialogueMatchPreferenceArgs = {
  selector: DialogueMatchPreferenceSelectorUniqueInput;
  data: UpdateDialogueMatchPreferenceDataInput;
};


export type MutationCreateDigestPostArgs = {
  data: CreateDigestPostDataInput;
};


export type MutationUpdateDigestPostArgs = {
  selector: DigestPostSelectorUniqueInput;
  data: UpdateDigestPostDataInput;
};


export type MutationCreateDigestArgs = {
  data: CreateDigestDataInput;
};


export type MutationUpdateDigestArgs = {
  selector: DigestSelectorUniqueInput;
  data: UpdateDigestDataInput;
};


export type MutationCreateElectionCandidateArgs = {
  data: CreateElectionCandidateDataInput;
};


export type MutationUpdateElectionCandidateArgs = {
  selector: ElectionCandidateSelectorUniqueInput;
  data: UpdateElectionCandidateDataInput;
};


export type MutationCreateElectionVoteArgs = {
  data: CreateElectionVoteDataInput;
};


export type MutationUpdateElectionVoteArgs = {
  selector: ElectionVoteSelectorUniqueInput;
  data: UpdateElectionVoteDataInput;
};


export type MutationCreateElicitQuestionArgs = {
  data: CreateElicitQuestionDataInput;
};


export type MutationUpdateElicitQuestionArgs = {
  selector: ElicitQuestionSelectorUniqueInput;
  data: UpdateElicitQuestionDataInput;
};


export type MutationCreateForumEventArgs = {
  data: CreateForumEventDataInput;
};


export type MutationUpdateForumEventArgs = {
  selector: ForumEventSelectorUniqueInput;
  data: UpdateForumEventDataInput;
};


export type MutationCreateGardenCodeArgs = {
  data: CreateGardenCodeDataInput;
};


export type MutationUpdateGardenCodeArgs = {
  selector: GardenCodeSelectorUniqueInput;
  data: UpdateGardenCodeDataInput;
};


export type MutationCreateGoogleServiceAccountSessionArgs = {
  data: CreateGoogleServiceAccountSessionDataInput;
};


export type MutationUpdateGoogleServiceAccountSessionArgs = {
  selector: GoogleServiceAccountSessionSelectorUniqueInput;
  data: UpdateGoogleServiceAccountSessionDataInput;
};


export type MutationCreateJargonTermArgs = {
  data: CreateJargonTermDataInput;
};


export type MutationUpdateJargonTermArgs = {
  selector: JargonTermSelectorUniqueInput;
  data: UpdateJargonTermDataInput;
};


export type MutationCreateLwEventArgs = {
  data: CreateLwEventDataInput;
};


export type MutationUpdateLwEventArgs = {
  selector: LwEventSelectorUniqueInput;
  data: UpdateLwEventDataInput;
};


export type MutationCreateLlmConversationArgs = {
  data: CreateLlmConversationDataInput;
};


export type MutationUpdateLlmConversationArgs = {
  selector: LlmConversationSelectorUniqueInput;
  data: UpdateLlmConversationDataInput;
};


export type MutationCreateLocalgroupArgs = {
  data: CreateLocalgroupDataInput;
};


export type MutationUpdateLocalgroupArgs = {
  selector: LocalgroupSelectorUniqueInput;
  data: UpdateLocalgroupDataInput;
};


export type MutationCreateMessageArgs = {
  data: CreateMessageDataInput;
};


export type MutationUpdateMessageArgs = {
  selector: MessageSelectorUniqueInput;
  data: UpdateMessageDataInput;
};


export type MutationCreateModerationTemplateArgs = {
  data: CreateModerationTemplateDataInput;
};


export type MutationUpdateModerationTemplateArgs = {
  selector: ModerationTemplateSelectorUniqueInput;
  data: UpdateModerationTemplateDataInput;
};


export type MutationCreateModeratorActionArgs = {
  data: CreateModeratorActionDataInput;
};


export type MutationUpdateModeratorActionArgs = {
  selector: ModeratorActionSelectorUniqueInput;
  data: UpdateModeratorActionDataInput;
};


export type MutationCreateMultiDocumentArgs = {
  data: CreateMultiDocumentDataInput;
};


export type MutationUpdateMultiDocumentArgs = {
  selector: MultiDocumentSelectorUniqueInput;
  data: UpdateMultiDocumentDataInput;
};


export type MutationCreateNotificationArgs = {
  data: CreateNotificationDataInput;
};


export type MutationUpdateNotificationArgs = {
  selector: NotificationSelectorUniqueInput;
  data: UpdateNotificationDataInput;
};


export type MutationCreatePetrovDayActionArgs = {
  data: CreatePetrovDayActionDataInput;
};


export type MutationUpdatePetrovDayActionArgs = {
  selector: PetrovDayActionSelectorUniqueInput;
  data: UpdatePetrovDayActionDataInput;
};


export type MutationCreatePodcastEpisodeArgs = {
  data: CreatePodcastEpisodeDataInput;
};


export type MutationUpdatePodcastEpisodeArgs = {
  selector: PodcastEpisodeSelectorUniqueInput;
  data: UpdatePodcastEpisodeDataInput;
};


export type MutationCreatePostEmbeddingArgs = {
  data: CreatePostEmbeddingDataInput;
};


export type MutationUpdatePostEmbeddingArgs = {
  selector: PostEmbeddingSelectorUniqueInput;
  data: UpdatePostEmbeddingDataInput;
};


export type MutationCreatePostViewTimeArgs = {
  data: CreatePostViewTimeDataInput;
};


export type MutationUpdatePostViewTimeArgs = {
  selector: PostViewTimeSelectorUniqueInput;
  data: UpdatePostViewTimeDataInput;
};


export type MutationCreatePostViewsArgs = {
  data: CreatePostViewsDataInput;
};


export type MutationUpdatePostViewsArgs = {
  selector: PostViewsSelectorUniqueInput;
  data: UpdatePostViewsDataInput;
};


export type MutationCreatePostArgs = {
  data: CreatePostDataInput;
};


export type MutationUpdatePostArgs = {
  selector: PostSelectorUniqueInput;
  data: UpdatePostDataInput;
};


export type MutationCreateRssFeedArgs = {
  data: CreateRssFeedDataInput;
};


export type MutationUpdateRssFeedArgs = {
  selector: RssFeedSelectorUniqueInput;
  data: UpdateRssFeedDataInput;
};


export type MutationCreateReportArgs = {
  data: CreateReportDataInput;
};


export type MutationUpdateReportArgs = {
  selector: ReportSelectorUniqueInput;
  data: UpdateReportDataInput;
};


export type MutationCreateReviewWinnerArtArgs = {
  data: CreateReviewWinnerArtDataInput;
};


export type MutationUpdateReviewWinnerArtArgs = {
  selector: ReviewWinnerArtSelectorUniqueInput;
  data: UpdateReviewWinnerArtDataInput;
};


export type MutationCreateReviewWinnerArgs = {
  data: CreateReviewWinnerDataInput;
};


export type MutationUpdateReviewWinnerArgs = {
  selector: ReviewWinnerSelectorUniqueInput;
  data: UpdateReviewWinnerDataInput;
};


export type MutationUpdateRevisionArgs = {
  selector: RevisionSelectorUniqueInput;
  data: UpdateRevisionDataInput;
};


export type MutationCreateSequenceArgs = {
  data: CreateSequenceDataInput;
};


export type MutationUpdateSequenceArgs = {
  selector: SequenceSelectorUniqueInput;
  data: UpdateSequenceDataInput;
};


export type MutationCreateSplashArtCoordinateArgs = {
  data: CreateSplashArtCoordinateDataInput;
};


export type MutationUpdateSplashArtCoordinateArgs = {
  selector: SplashArtCoordinateSelectorUniqueInput;
  data: UpdateSplashArtCoordinateDataInput;
};


export type MutationCreateSpotlightArgs = {
  data: CreateSpotlightDataInput;
};


export type MutationUpdateSpotlightArgs = {
  selector: SpotlightSelectorUniqueInput;
  data: UpdateSpotlightDataInput;
};


export type MutationCreateSubscriptionArgs = {
  data: CreateSubscriptionDataInput;
};


export type MutationCreateSurveyQuestionArgs = {
  data: CreateSurveyQuestionDataInput;
};


export type MutationUpdateSurveyQuestionArgs = {
  selector: SurveyQuestionSelectorUniqueInput;
  data: UpdateSurveyQuestionDataInput;
};


export type MutationCreateSurveyResponseArgs = {
  data: CreateSurveyResponseDataInput;
};


export type MutationUpdateSurveyResponseArgs = {
  selector: SurveyResponseSelectorUniqueInput;
  data: UpdateSurveyResponseDataInput;
};


export type MutationCreateSurveyScheduleArgs = {
  data: CreateSurveyScheduleDataInput;
};


export type MutationUpdateSurveyScheduleArgs = {
  selector: SurveyScheduleSelectorUniqueInput;
  data: UpdateSurveyScheduleDataInput;
};


export type MutationCreateSurveyArgs = {
  data: CreateSurveyDataInput;
};


export type MutationUpdateSurveyArgs = {
  selector: SurveySelectorUniqueInput;
  data: UpdateSurveyDataInput;
};


export type MutationCreateTagFlagArgs = {
  data: CreateTagFlagDataInput;
};


export type MutationUpdateTagFlagArgs = {
  selector: TagFlagSelectorUniqueInput;
  data: UpdateTagFlagDataInput;
};


export type MutationCreateTagRelArgs = {
  data: CreateTagRelDataInput;
};


export type MutationUpdateTagRelArgs = {
  selector: TagRelSelectorUniqueInput;
  data: UpdateTagRelDataInput;
};


export type MutationCreateTagArgs = {
  data: CreateTagDataInput;
};


export type MutationUpdateTagArgs = {
  selector: TagSelectorUniqueInput;
  data: UpdateTagDataInput;
};


export type MutationCreateUserEagDetailArgs = {
  data: CreateUserEagDetailDataInput;
};


export type MutationUpdateUserEagDetailArgs = {
  selector: UserEagDetailSelectorUniqueInput;
  data: UpdateUserEagDetailDataInput;
};


export type MutationCreateUserJobAdArgs = {
  data: CreateUserJobAdDataInput;
};


export type MutationUpdateUserJobAdArgs = {
  selector: UserJobAdSelectorUniqueInput;
  data: UpdateUserJobAdDataInput;
};


export type MutationCreateUserMostValuablePostArgs = {
  data: CreateUserMostValuablePostDataInput;
};


export type MutationUpdateUserMostValuablePostArgs = {
  selector: UserMostValuablePostSelectorUniqueInput;
  data: UpdateUserMostValuablePostDataInput;
};


export type MutationCreateUserRateLimitArgs = {
  data: CreateUserRateLimitDataInput;
};


export type MutationUpdateUserRateLimitArgs = {
  selector: UserRateLimitSelectorUniqueInput;
  data: UpdateUserRateLimitDataInput;
};


export type MutationCreateUserTagRelArgs = {
  data: CreateUserTagRelDataInput;
};


export type MutationUpdateUserTagRelArgs = {
  selector: UserTagRelSelectorUniqueInput;
  data: UpdateUserTagRelDataInput;
};


export type MutationCreateUserArgs = {
  data: CreateUserDataInput;
};


export type MutationUpdateUserArgs = {
  selector: UserSelectorUniqueInput;
  data: UpdateUserDataInput;
};


export type MutationDismissRecommendationArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
};


export type MutationNewUserCompleteProfileArgs = {
  username: Scalars['String']['input'];
  subscribeToDigest: Scalars['Boolean']['input'];
  email: InputMaybe<Scalars['String']['input']>;
  acceptedTos: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUserExpandFrontpageSectionArgs = {
  section: Scalars['String']['input'];
  expanded: Scalars['Boolean']['input'];
};


export type MutationUserUpdateSubforumMembershipArgs = {
  tagId: Scalars['String']['input'];
  member: Scalars['Boolean']['input'];
};


export type MutationSetVotePostArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationPerformVotePostArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationSetVoteCommentArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationPerformVoteCommentArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationSetVoteTagRelArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationPerformVoteTagRelArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationSetVoteRevisionArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationPerformVoteRevisionArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationSetVoteElectionCandidateArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationPerformVoteElectionCandidateArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationSetVoteTagArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationPerformVoteTagArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationSetVoteMultiDocumentArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationPerformVoteMultiDocumentArgs = {
  documentId: InputMaybe<Scalars['String']['input']>;
  voteType: InputMaybe<Scalars['String']['input']>;
  extendedVote: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationModerateCommentArgs = {
  commentId: InputMaybe<Scalars['String']['input']>;
  deleted: InputMaybe<Scalars['Boolean']['input']>;
  deletedPublic: InputMaybe<Scalars['Boolean']['input']>;
  deletedReason: InputMaybe<Scalars['String']['input']>;
};


export type MutationMakeElicitPredictionArgs = {
  questionId: InputMaybe<Scalars['String']['input']>;
  prediction: InputMaybe<Scalars['Int']['input']>;
};


export type MutationSendNewDialogueMessageNotificationArgs = {
  postId: Scalars['String']['input'];
  dialogueHtml: Scalars['String']['input'];
};


export type MutationPetrovDayLaunchMissileArgs = {
  launchCode: InputMaybe<Scalars['String']['input']>;
};


export type MutationSubmitReviewVoteArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
  qualitativeScore: InputMaybe<Scalars['Int']['input']>;
  quadraticChange: InputMaybe<Scalars['Int']['input']>;
  newQuadraticScore: InputMaybe<Scalars['Int']['input']>;
  comment: InputMaybe<Scalars['String']['input']>;
  year: InputMaybe<Scalars['String']['input']>;
  dummy: InputMaybe<Scalars['Boolean']['input']>;
  reactions: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationAddGivingSeasonHeartArgs = {
  electionName: Scalars['String']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
  theta: Scalars['Float']['input'];
};


export type MutationRemoveGivingSeasonHeartArgs = {
  electionName: Scalars['String']['input'];
};


export type MutationImportGoogleDocArgs = {
  fileUrl: Scalars['String']['input'];
  postId: InputMaybe<Scalars['String']['input']>;
};


export type MutationAlignmentCommentArgs = {
  commentId: InputMaybe<Scalars['String']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationAlignmentPostArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
  af: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationMarkConversationReadArgs = {
  conversationId: Scalars['String']['input'];
};


export type MutationSendEventTriggeredDmArgs = {
  eventType: Scalars['String']['input'];
};


export type MutationEditSurveyArgs = {
  surveyId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  questions: Array<SurveyQuestionInfo>;
};


export type MutationMergeTagsArgs = {
  sourceTagId: Scalars['String']['input'];
  targetTagId: Scalars['String']['input'];
  transferSubtags: Scalars['Boolean']['input'];
  redirectSource: Scalars['Boolean']['input'];
};


export type MutationPromoteLensToMainArgs = {
  lensId: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  username: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
};


export type MutationSignupArgs = {
  username: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  subscribeToCurated: InputMaybe<Scalars['Boolean']['input']>;
  reCaptchaToken: InputMaybe<Scalars['String']['input']>;
  abTestKey: InputMaybe<Scalars['String']['input']>;
};


export type MutationResetPasswordArgs = {
  email: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddForumEventVoteArgs = {
  forumEventId: Scalars['String']['input'];
  x: Scalars['Float']['input'];
  delta: InputMaybe<Scalars['Float']['input']>;
  postIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationRemoveForumEventVoteArgs = {
  forumEventId: Scalars['String']['input'];
};


export type MutationRemoveForumEventStickerArgs = {
  forumEventId: Scalars['String']['input'];
  stickerId: Scalars['String']['input'];
};


export type MutationUnlockPostArgs = {
  postId: Scalars['String']['input'];
  linkSharingKey: Scalars['String']['input'];
};


export type MutationRevertPostToRevisionArgs = {
  postId: Scalars['String']['input'];
  revisionId: Scalars['String']['input'];
};


export type MutationSendVertexViewItemEventArgs = {
  postId: Scalars['String']['input'];
  attributionId: InputMaybe<Scalars['String']['input']>;
};


export type MutationSendVertexMediaCompleteEventArgs = {
  postId: Scalars['String']['input'];
  attributionId: InputMaybe<Scalars['String']['input']>;
};


export type MutationImportUrlAsDraftPostArgs = {
  url: Scalars['String']['input'];
};


export type MutationRevertTagToRevisionArgs = {
  tagId: Scalars['String']['input'];
  revertToRevisionId: Scalars['String']['input'];
};


export type MutationAutosaveRevisionArgs = {
  postId: Scalars['String']['input'];
  contents: AutosaveContentType;
};


export type MutationLockThreadArgs = {
  commentId: Scalars['String']['input'];
  until: InputMaybe<Scalars['String']['input']>;
};


export type MutationUnlockThreadArgs = {
  commentId: Scalars['String']['input'];
};


export type MutationReorderSummariesArgs = {
  parentDocumentId: Scalars['String']['input'];
  parentDocumentCollectionName: Scalars['String']['input'];
  summaryIds: Array<Scalars['String']['input']>;
};


export type MutationPublishAndDeDuplicateSpotlightArgs = {
  spotlightId: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpsertUserTypingIndicatorArgs = {
  documentId: Scalars['String']['input'];
};


export type MutationAcceptCoauthorRequestArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
  accept: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationSetIsBookmarkedArgs = {
  postId: Scalars['String']['input'];
  isBookmarked: Scalars['Boolean']['input'];
};


export type MutationSetIsHiddenArgs = {
  postId: Scalars['String']['input'];
  isHidden: Scalars['Boolean']['input'];
};


export type MutationMarkAsReadOrUnreadArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
  isRead: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationMarkPostCommentsReadArgs = {
  postId: Scalars['String']['input'];
};


export type MutationResyncRssFeedArgs = {
  feedId: Scalars['String']['input'];
};


export type MutationUpdateContinueReadingArgs = {
  sequenceId: Scalars['String']['input'];
  postId: Scalars['String']['input'];
};


export type MutationGetNewJargonTermsArgs = {
  postId: Scalars['String']['input'];
  glossaryPrompt: InputMaybe<Scalars['String']['input']>;
  examplePost: InputMaybe<Scalars['String']['input']>;
  exampleTerm: InputMaybe<Scalars['String']['input']>;
  exampleAltTerm: InputMaybe<Scalars['String']['input']>;
  exampleDefinition: InputMaybe<Scalars['String']['input']>;
};


export type MutationRsvpToEventArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  private: InputMaybe<Scalars['Boolean']['input']>;
  response: InputMaybe<Scalars['String']['input']>;
};


export type MutationCancelRsvpToEventArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddOrUpvoteTagArgs = {
  tagId: InputMaybe<Scalars['String']['input']>;
  postId: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddTagsArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
  tagIds: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationAnalyticsEventArgs = {
  events: InputMaybe<Array<Scalars['JSON']['input']>>;
  now: InputMaybe<Scalars['Date']['input']>;
};


export type MutationUpdateSearchSynonymsArgs = {
  synonyms: Array<Scalars['String']['input']>;
};


export type MutationUseEmailTokenArgs = {
  token: InputMaybe<Scalars['String']['input']>;
  args: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationConnectCrossposterArgs = {
  token: InputMaybe<Scalars['String']['input']>;
};


export type MutationObserveRecommendationArgs = {
  postId: Scalars['String']['input'];
};


export type MutationClickRecommendationArgs = {
  postId: Scalars['String']['input'];
};


export type MutationIncreasePostViewCountArgs = {
  postId: InputMaybe<Scalars['String']['input']>;
};


export type MutationGenerateCoverImagesForPostArgs = {
  postId: Scalars['String']['input'];
  prompt: InputMaybe<Scalars['String']['input']>;
};


export type MutationFlipSplashArtImageArgs = {
  reviewWinnerArtId: Scalars['String']['input'];
};

export type EmailPreview = {
  __typename?: 'EmailPreview';
  to: Maybe<Scalars['String']['output']>;
  subject: Maybe<Scalars['String']['output']>;
  html: Maybe<Scalars['String']['output']>;
  text: Maybe<Scalars['String']['output']>;
};

export type ArbitalLinkedPage = {
  __typename?: 'ArbitalLinkedPage';
  _id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type ArbitalLinkedPages = {
  __typename?: 'ArbitalLinkedPages';
  faster: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  slower: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  moreTechnical: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  lessTechnical: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  requirements: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  teaches: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  parents: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
  children: Maybe<Array<Maybe<ArbitalLinkedPage>>>;
};

export type SocialPreviewType = {
  __typename?: 'SocialPreviewType';
  _id: Maybe<Scalars['String']['output']>;
  imageId: Maybe<Scalars['String']['output']>;
  imageUrl: Maybe<Scalars['String']['output']>;
  text: Maybe<Scalars['String']['output']>;
};

export type ContentType = {
  __typename?: 'ContentType';
  type: Maybe<Scalars['String']['output']>;
  data: Maybe<Scalars['ContentTypeData']['output']>;
};

export type TagContributor = {
  __typename?: 'TagContributor';
  user: Maybe<User>;
  contributionScore: Scalars['Int']['output'];
  currentAttributionCharCount: Maybe<Scalars['Int']['output']>;
  numCommits: Scalars['Int']['output'];
  voteCount: Scalars['Int']['output'];
};

export type TagContributorsList = {
  __typename?: 'TagContributorsList';
  contributors: Maybe<Array<TagContributor>>;
  totalCount: Scalars['Int']['output'];
};

export type UserLikingTag = {
  __typename?: 'UserLikingTag';
  _id: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
};

export type LatLng = {
  __typename?: 'LatLng';
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
};

export type RecommendResumeSequence = {
  __typename?: 'RecommendResumeSequence';
  sequence: Maybe<Sequence>;
  collection: Maybe<Collection>;
  nextPost: Post;
  numRead: Maybe<Scalars['Int']['output']>;
  numTotal: Maybe<Scalars['Int']['output']>;
  lastReadTime: Maybe<Scalars['Date']['output']>;
};

export type CommentCountTag = {
  __typename?: 'CommentCountTag';
  name: Scalars['String']['output'];
  comment_count: Scalars['Int']['output'];
};

export type TopCommentedTagUser = {
  __typename?: 'TopCommentedTagUser';
  _id: Scalars['ID']['output'];
  username: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  total_power: Scalars['Float']['output'];
  tag_comment_counts: Array<CommentCountTag>;
};

export type UpvotedUser = {
  __typename?: 'UpvotedUser';
  _id: Scalars['ID']['output'];
  username: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  total_power: Scalars['Float']['output'];
  power_values: Scalars['String']['output'];
  vote_counts: Scalars['Int']['output'];
  total_agreement: Scalars['Float']['output'];
  agreement_values: Scalars['String']['output'];
  recently_active_matchmaking: Scalars['Boolean']['output'];
};

export type UserDialogueUsefulData = {
  __typename?: 'UserDialogueUsefulData';
  dialogueUsers: Maybe<Array<Maybe<User>>>;
  topUsers: Maybe<Array<Maybe<UpvotedUser>>>;
  activeDialogueMatchSeekers: Maybe<Array<Maybe<User>>>;
};

export type NewUserCompletedProfile = {
  __typename?: 'NewUserCompletedProfile';
  username: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  displayName: Maybe<Scalars['String']['output']>;
  subscribedToDigest: Maybe<Scalars['Boolean']['output']>;
  usernameUnset: Maybe<Scalars['Boolean']['output']>;
};

export type UserCoreTagReads = {
  __typename?: 'UserCoreTagReads';
  tagId: Maybe<Scalars['String']['output']>;
  userReadCount: Maybe<Scalars['Int']['output']>;
};

export type SuggestedFeedSubscriptionUsersResult = {
  __typename?: 'SuggestedFeedSubscriptionUsersResult';
  results: Array<User>;
};

export type VoteResultPost = {
  __typename?: 'VoteResultPost';
  document: Post;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultComment = {
  __typename?: 'VoteResultComment';
  document: Comment;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultTagRel = {
  __typename?: 'VoteResultTagRel';
  document: TagRel;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultRevision = {
  __typename?: 'VoteResultRevision';
  document: Revision;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultElectionCandidate = {
  __typename?: 'VoteResultElectionCandidate';
  document: ElectionCandidate;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultTag = {
  __typename?: 'VoteResultTag';
  document: Tag;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type VoteResultMultiDocument = {
  __typename?: 'VoteResultMultiDocument';
  document: MultiDocument;
  showVotingPatternWarning: Scalars['Boolean']['output'];
};

export type CommentsWithReactsResult = {
  __typename?: 'CommentsWithReactsResult';
  results: Array<Comment>;
};

export type PopularCommentsResult = {
  __typename?: 'PopularCommentsResult';
  results: Array<Comment>;
};

export type PostKarmaChange = {
  __typename?: 'PostKarmaChange';
  _id: Maybe<Scalars['String']['output']>;
  scoreChange: Maybe<Scalars['Int']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  addedReacts: Maybe<Array<ReactionChange>>;
  eaAddedReacts: Maybe<Scalars['JSON']['output']>;
};

export type CommentKarmaChange = {
  __typename?: 'CommentKarmaChange';
  _id: Maybe<Scalars['String']['output']>;
  scoreChange: Maybe<Scalars['Int']['output']>;
  commentId: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  postTitle: Maybe<Scalars['String']['output']>;
  postSlug: Maybe<Scalars['String']['output']>;
  tagSlug: Maybe<Scalars['String']['output']>;
  tagName: Maybe<Scalars['String']['output']>;
  tagCommentType: Maybe<Scalars['String']['output']>;
  addedReacts: Maybe<Array<ReactionChange>>;
  eaAddedReacts: Maybe<Scalars['JSON']['output']>;
};

export type RevisionsKarmaChange = {
  __typename?: 'RevisionsKarmaChange';
  _id: Maybe<Scalars['String']['output']>;
  scoreChange: Maybe<Scalars['Int']['output']>;
  tagId: Maybe<Scalars['String']['output']>;
  tagSlug: Maybe<Scalars['String']['output']>;
  tagName: Maybe<Scalars['String']['output']>;
  addedReacts: Maybe<Array<ReactionChange>>;
  eaAddedReacts: Maybe<Scalars['JSON']['output']>;
};

export type ReactionChange = {
  __typename?: 'ReactionChange';
  reactionType: Scalars['String']['output'];
  userId: Maybe<Scalars['String']['output']>;
};

export type KarmaChangesSimple = {
  __typename?: 'KarmaChangesSimple';
  posts: Maybe<Array<Maybe<PostKarmaChange>>>;
  comments: Maybe<Array<Maybe<CommentKarmaChange>>>;
  tagRevisions: Maybe<Array<Maybe<RevisionsKarmaChange>>>;
};

export type KarmaChanges = {
  __typename?: 'KarmaChanges';
  totalChange: Maybe<Scalars['Int']['output']>;
  startDate: Maybe<Scalars['Date']['output']>;
  endDate: Maybe<Scalars['Date']['output']>;
  nextBatchDate: Maybe<Scalars['Date']['output']>;
  updateFrequency: Maybe<Scalars['String']['output']>;
  posts: Maybe<Array<Maybe<PostKarmaChange>>>;
  comments: Maybe<Array<Maybe<CommentKarmaChange>>>;
  tagRevisions: Maybe<Array<Maybe<RevisionsKarmaChange>>>;
  todaysKarmaChanges: Maybe<KarmaChangesSimple>;
  thisWeeksKarmaChanges: Maybe<KarmaChangesSimple>;
};

export type UniqueClientViewsSeries = {
  __typename?: 'UniqueClientViewsSeries';
  uniqueClientViews: Maybe<Scalars['Int']['output']>;
  date: Maybe<Scalars['Date']['output']>;
};

export type PostAnalyticsResult = {
  __typename?: 'PostAnalyticsResult';
  allViews: Maybe<Scalars['Int']['output']>;
  uniqueClientViews: Maybe<Scalars['Int']['output']>;
  uniqueClientViews10Sec: Maybe<Scalars['Int']['output']>;
  medianReadingTime: Maybe<Scalars['Int']['output']>;
  uniqueClientViews5Min: Maybe<Scalars['Int']['output']>;
  uniqueClientViewsSeries: Maybe<Array<Maybe<UniqueClientViewsSeries>>>;
};

export type PostAnalytics2Result = {
  __typename?: 'PostAnalytics2Result';
  _id: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
  views: Maybe<Scalars['Int']['output']>;
  uniqueViews: Maybe<Scalars['Int']['output']>;
  reads: Maybe<Scalars['Int']['output']>;
  meanReadingTime: Maybe<Scalars['Float']['output']>;
  karma: Maybe<Scalars['Int']['output']>;
  comments: Maybe<Scalars['Int']['output']>;
};

export type MultiPostAnalyticsResult = {
  __typename?: 'MultiPostAnalyticsResult';
  posts: Maybe<Array<Maybe<PostAnalytics2Result>>>;
  totalCount: Scalars['Int']['output'];
};

export type AnalyticsSeriesValue = {
  __typename?: 'AnalyticsSeriesValue';
  date: Maybe<Scalars['Date']['output']>;
  views: Maybe<Scalars['Int']['output']>;
  reads: Maybe<Scalars['Int']['output']>;
  karma: Maybe<Scalars['Int']['output']>;
  comments: Maybe<Scalars['Int']['output']>;
};

export type ArbitalPageData = {
  __typename?: 'ArbitalPageData';
  html: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

export type CoronaVirusDataRow = {
  __typename?: 'CoronaVirusDataRow';
  accepted: Maybe<Scalars['String']['output']>;
  imp: Maybe<Scalars['String']['output']>;
  link: Maybe<Scalars['String']['output']>;
  shortDescription: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  domain: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
  reviewerThoughts: Maybe<Scalars['String']['output']>;
  foundVia: Maybe<Scalars['String']['output']>;
  sourceLink: Maybe<Scalars['String']['output']>;
  sourceLinkDomain: Maybe<Scalars['String']['output']>;
  lastUpdated: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  dateAdded: Maybe<Scalars['String']['output']>;
  category: Maybe<Scalars['String']['output']>;
};

export type CoronaVirusDataSchema = {
  __typename?: 'CoronaVirusDataSchema';
  range: Maybe<Scalars['String']['output']>;
  majorDimension: Maybe<Scalars['String']['output']>;
  values: Maybe<Array<CoronaVirusDataRow>>;
};

export type ElicitUser = {
  __typename?: 'ElicitUser';
  isQuestionCreator: Maybe<Scalars['Boolean']['output']>;
  displayName: Maybe<Scalars['String']['output']>;
  _id: Maybe<Scalars['String']['output']>;
  sourceUserId: Maybe<Scalars['String']['output']>;
  lwUser: Maybe<User>;
};

export type ElicitPrediction = {
  __typename?: 'ElicitPrediction';
  _id: Maybe<Scalars['String']['output']>;
  predictionId: Maybe<Scalars['String']['output']>;
  prediction: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  creator: Maybe<ElicitUser>;
  sourceUrl: Maybe<Scalars['String']['output']>;
  sourceId: Maybe<Scalars['String']['output']>;
  binaryQuestionId: Maybe<Scalars['String']['output']>;
};

export type ElicitBlockData = {
  __typename?: 'ElicitBlockData';
  _id: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  resolvesBy: Maybe<Scalars['Date']['output']>;
  resolution: Maybe<Scalars['Boolean']['output']>;
  predictions: Maybe<Array<Maybe<ElicitPrediction>>>;
};

export type NotificationCounts = {
  __typename?: 'NotificationCounts';
  checkedAt: Scalars['Date']['output'];
  unreadNotifications: Scalars['Int']['output'];
  unreadPrivateMessages: Scalars['Int']['output'];
  faviconBadgeNumber: Scalars['Int']['output'];
};

export type NotificationDisplaysResult = {
  __typename?: 'NotificationDisplaysResult';
  results: Array<Scalars['JSON']['output']>;
};

export type PetrovDay2024CheckNumberOfIncomingData = {
  __typename?: 'PetrovDay2024CheckNumberOfIncomingData';
  count: Maybe<Scalars['Int']['output']>;
};

export type PetrovDayCheckIfIncomingData = {
  __typename?: 'PetrovDayCheckIfIncomingData';
  launched: Maybe<Scalars['Boolean']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
};

export type PetrovDayLaunchMissileData = {
  __typename?: 'PetrovDayLaunchMissileData';
  launchCode: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
};

export type GivingSeasonHeart = {
  __typename?: 'GivingSeasonHeart';
  userId: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
  theta: Scalars['Float']['output'];
};

export type UserReadHistoryResult = {
  __typename?: 'UserReadHistoryResult';
  posts: Maybe<Array<Post>>;
};

export type PostsUserCommentedOnResult = {
  __typename?: 'PostsUserCommentedOnResult';
  posts: Maybe<Array<Post>>;
};

export type PostReviewFilter = {
  startDate: InputMaybe<Scalars['Date']['input']>;
  endDate: InputMaybe<Scalars['Date']['input']>;
  minKarma: InputMaybe<Scalars['Int']['input']>;
  showEvents: InputMaybe<Scalars['Boolean']['input']>;
};

export type PostReviewSort = {
  karma: InputMaybe<Scalars['Boolean']['input']>;
};

export type DigestPlannerPost = {
  __typename?: 'DigestPlannerPost';
  post: Maybe<Post>;
  digestPost: Maybe<DigestPost>;
  rating: Maybe<Scalars['Int']['output']>;
};

export type RecombeeRecommendedPost = {
  __typename?: 'RecombeeRecommendedPost';
  post: Post;
  scenario: Maybe<Scalars['String']['output']>;
  recommId: Maybe<Scalars['String']['output']>;
  generatedAt: Maybe<Scalars['Date']['output']>;
  curated: Maybe<Scalars['Boolean']['output']>;
  stickied: Maybe<Scalars['Boolean']['output']>;
};

export type VertexRecommendedPost = {
  __typename?: 'VertexRecommendedPost';
  post: Post;
  attributionId: Maybe<Scalars['String']['output']>;
};

export type PostWithApprovedJargon = {
  __typename?: 'PostWithApprovedJargon';
  post: Post;
  jargonTerms: Maybe<Array<JargonTerm>>;
};

export type DigestHighlightsResult = {
  __typename?: 'DigestHighlightsResult';
  results: Array<Post>;
};

export type DigestPostsThisWeekResult = {
  __typename?: 'DigestPostsThisWeekResult';
  results: Array<Post>;
};

export type CuratedAndPopularThisWeekResult = {
  __typename?: 'CuratedAndPopularThisWeekResult';
  results: Array<Post>;
};

export type RecentlyActiveDialoguesResult = {
  __typename?: 'RecentlyActiveDialoguesResult';
  results: Array<Post>;
};

export type MyDialoguesResult = {
  __typename?: 'MyDialoguesResult';
  results: Array<Post>;
};

export type GoogleVertexPostsResult = {
  __typename?: 'GoogleVertexPostsResult';
  results: Array<VertexRecommendedPost>;
};

export type CrossedKarmaThresholdResult = {
  __typename?: 'CrossedKarmaThresholdResult';
  results: Array<Post>;
};

export type RecombeeLatestPostsResult = {
  __typename?: 'RecombeeLatestPostsResult';
  results: Array<RecombeeRecommendedPost>;
};

export type RecombeeHybridPostsResult = {
  __typename?: 'RecombeeHybridPostsResult';
  results: Array<RecombeeRecommendedPost>;
};

export type PostsWithActiveDiscussionResult = {
  __typename?: 'PostsWithActiveDiscussionResult';
  results: Array<Post>;
};

export type PostsBySubscribedAuthorsResult = {
  __typename?: 'PostsBySubscribedAuthorsResult';
  results: Array<Post>;
};

export type PostsWithApprovedJargonResult = {
  __typename?: 'PostsWithApprovedJargonResult';
  results: Array<PostWithApprovedJargon>;
};

export type AllTagsActivityFeedQueryResults = {
  __typename?: 'AllTagsActivityFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<AllTagsActivityFeedEntryType>>;
};

export type AllTagsActivityFeedEntryType = {
  __typename?: 'AllTagsActivityFeedEntryType';
  type: Scalars['String']['output'];
  tagCreated: Maybe<Tag>;
  tagRevision: Maybe<Revision>;
  tagDiscussionComment: Maybe<Comment>;
};

export type RecentDiscussionFeedQueryResults = {
  __typename?: 'RecentDiscussionFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<RecentDiscussionFeedEntryType>>;
};

export type RecentDiscussionFeedEntryType = {
  __typename?: 'RecentDiscussionFeedEntryType';
  type: Scalars['String']['output'];
  postCommented: Maybe<Post>;
  shortformCommented: Maybe<Post>;
  tagDiscussed: Maybe<Tag>;
  tagRevised: Maybe<Revision>;
};

export type SubscribedPostAndComments = {
  __typename?: 'SubscribedPostAndComments';
  _id: Scalars['String']['output'];
  post: Post;
  comments: Maybe<Array<Comment>>;
  expandCommentIds: Maybe<Array<Scalars['String']['output']>>;
  postIsFromSubscribedUser: Scalars['Boolean']['output'];
};

export type SubscribedFeedQueryResults = {
  __typename?: 'SubscribedFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubscribedFeedEntryType>>;
};

export type SubscribedFeedEntryType = {
  __typename?: 'SubscribedFeedEntryType';
  type: Scalars['String']['output'];
  postCommented: Maybe<SubscribedPostAndComments>;
};

export type TagHistoryFeedQueryResults = {
  __typename?: 'TagHistoryFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<TagHistoryFeedEntryType>>;
};

export type TagHistoryFeedEntryType = {
  __typename?: 'TagHistoryFeedEntryType';
  type: Scalars['String']['output'];
  tagCreated: Maybe<Tag>;
  tagApplied: Maybe<TagRel>;
  tagRevision: Maybe<Revision>;
  tagDiscussionComment: Maybe<Comment>;
  lensRevision: Maybe<Revision>;
  summaryRevision: Maybe<Revision>;
  wikiMetadataChanged: Maybe<FieldChange>;
  lensOrSummaryMetadataChanged: Maybe<FieldChange>;
};

export type SubforumMagicFeedQueryResults = {
  __typename?: 'SubforumMagicFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumMagicFeedEntryType>>;
};

export type SubforumMagicFeedEntryType = {
  __typename?: 'SubforumMagicFeedEntryType';
  type: Scalars['String']['output'];
  tagSubforumPosts: Maybe<Post>;
  tagSubforumComments: Maybe<Comment>;
  tagSubforumStickyComments: Maybe<Comment>;
};

export type SubforumTopFeedQueryResults = {
  __typename?: 'SubforumTopFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumTopFeedEntryType>>;
};

export type SubforumTopFeedEntryType = {
  __typename?: 'SubforumTopFeedEntryType';
  type: Scalars['String']['output'];
  tagSubforumPosts: Maybe<Post>;
  tagSubforumComments: Maybe<Comment>;
  tagSubforumStickyComments: Maybe<Comment>;
};

export type SubforumRecentCommentsFeedQueryResults = {
  __typename?: 'SubforumRecentCommentsFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumRecentCommentsFeedEntryType>>;
};

export type SubforumRecentCommentsFeedEntryType = {
  __typename?: 'SubforumRecentCommentsFeedEntryType';
  type: Scalars['String']['output'];
  tagSubforumPosts: Maybe<Post>;
  tagSubforumComments: Maybe<Comment>;
  tagSubforumStickyComments: Maybe<Comment>;
};

export type SubforumNewFeedQueryResults = {
  __typename?: 'SubforumNewFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumNewFeedEntryType>>;
};

export type SubforumNewFeedEntryType = {
  __typename?: 'SubforumNewFeedEntryType';
  type: Scalars['String']['output'];
  tagSubforumPosts: Maybe<Post>;
  tagSubforumComments: Maybe<Comment>;
  tagSubforumStickyComments: Maybe<Comment>;
};

export type SubforumOldFeedQueryResults = {
  __typename?: 'SubforumOldFeedQueryResults';
  cutoff: Maybe<Scalars['Date']['output']>;
  endOffset: Scalars['Int']['output'];
  results: Maybe<Array<SubforumOldFeedEntryType>>;
};

export type SubforumOldFeedEntryType = {
  __typename?: 'SubforumOldFeedEntryType';
  type: Scalars['String']['output'];
  tagSubforumPosts: Maybe<Post>;
  tagSubforumComments: Maybe<Comment>;
  tagSubforumStickyComments: Maybe<Comment>;
};

export type SurveyQuestionInfo = {
  _id: InputMaybe<Scalars['String']['input']>;
  question: Scalars['String']['input'];
  format: Scalars['String']['input'];
};

export type DocumentDeletion = {
  __typename?: 'DocumentDeletion';
  userId: Maybe<Scalars['String']['output']>;
  documentId: Scalars['String']['output'];
  netChange: Scalars['String']['output'];
  type: Maybe<Scalars['String']['output']>;
  docFields: Maybe<MultiDocument>;
  createdAt: Scalars['Date']['output'];
};

export type TagUpdates = {
  __typename?: 'TagUpdates';
  tag: Tag;
  revisionIds: Maybe<Array<Scalars['String']['output']>>;
  commentCount: Maybe<Scalars['Int']['output']>;
  commentIds: Maybe<Array<Scalars['String']['output']>>;
  lastRevisedAt: Maybe<Scalars['Date']['output']>;
  lastCommentedAt: Maybe<Scalars['Date']['output']>;
  added: Maybe<Scalars['Int']['output']>;
  removed: Maybe<Scalars['Int']['output']>;
  users: Maybe<Array<User>>;
  documentDeletions: Maybe<Array<DocumentDeletion>>;
};

export type TagPreviewWithSummaries = {
  __typename?: 'TagPreviewWithSummaries';
  tag: Tag;
  lens: Maybe<MultiDocument>;
  summaries: Array<MultiDocument>;
};

export type TagWithTotalCount = {
  __typename?: 'TagWithTotalCount';
  tags: Array<Tag>;
  totalCount: Scalars['Int']['output'];
};

export type MostReadTopic = {
  __typename?: 'MostReadTopic';
  slug: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  shortName: Maybe<Scalars['String']['output']>;
  count: Maybe<Scalars['Int']['output']>;
};

export type TagReadLikelihoodRatio = {
  __typename?: 'TagReadLikelihoodRatio';
  tagId: Maybe<Scalars['String']['output']>;
  tagName: Maybe<Scalars['String']['output']>;
  tagShortName: Maybe<Scalars['String']['output']>;
  userReadCount: Maybe<Scalars['Int']['output']>;
  readLikelihoodRatio: Maybe<Scalars['Float']['output']>;
};

export type MostReadAuthor = {
  __typename?: 'MostReadAuthor';
  _id: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  displayName: Maybe<Scalars['String']['output']>;
  profileImageId: Maybe<Scalars['String']['output']>;
  count: Maybe<Scalars['Int']['output']>;
  engagementPercentile: Maybe<Scalars['Float']['output']>;
};

export type TopCommentContents = {
  __typename?: 'TopCommentContents';
  html: Maybe<Scalars['String']['output']>;
};

export type TopComment = {
  __typename?: 'TopComment';
  _id: Maybe<Scalars['String']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
  postId: Maybe<Scalars['String']['output']>;
  postTitle: Maybe<Scalars['String']['output']>;
  postSlug: Maybe<Scalars['String']['output']>;
  baseScore: Maybe<Scalars['Int']['output']>;
  extendedScore: Maybe<Scalars['JSON']['output']>;
  contents: Maybe<TopCommentContents>;
};

export type MostReceivedReact = {
  __typename?: 'MostReceivedReact';
  name: Maybe<Scalars['String']['output']>;
  count: Maybe<Scalars['Int']['output']>;
};

export type CombinedKarmaVals = {
  __typename?: 'CombinedKarmaVals';
  date: Scalars['Date']['output'];
  postKarma: Scalars['Int']['output'];
  commentKarma: Scalars['Int']['output'];
};

export type WrappedDataByYear = {
  __typename?: 'WrappedDataByYear';
  engagementPercentile: Maybe<Scalars['Float']['output']>;
  postsReadCount: Maybe<Scalars['Int']['output']>;
  totalSeconds: Maybe<Scalars['Int']['output']>;
  daysVisited: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  mostReadTopics: Maybe<Array<Maybe<MostReadTopic>>>;
  relativeMostReadCoreTopics: Maybe<Array<Maybe<TagReadLikelihoodRatio>>>;
  mostReadAuthors: Maybe<Array<Maybe<MostReadAuthor>>>;
  topPosts: Maybe<Array<Maybe<Post>>>;
  postCount: Maybe<Scalars['Int']['output']>;
  authorPercentile: Maybe<Scalars['Float']['output']>;
  topComment: Maybe<TopComment>;
  commentCount: Maybe<Scalars['Int']['output']>;
  commenterPercentile: Maybe<Scalars['Float']['output']>;
  topShortform: Maybe<Comment>;
  shortformCount: Maybe<Scalars['Int']['output']>;
  shortformPercentile: Maybe<Scalars['Float']['output']>;
  karmaChange: Maybe<Scalars['Int']['output']>;
  combinedKarmaVals: Maybe<Array<Maybe<CombinedKarmaVals>>>;
  mostReceivedReacts: Maybe<Array<Maybe<MostReceivedReact>>>;
  personality: Scalars['String']['output'];
};

export type Site = {
  __typename?: 'Site';
  title: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
  logoUrl: Maybe<Scalars['String']['output']>;
};

export type LoginReturnData = {
  __typename?: 'LoginReturnData';
  token: Maybe<Scalars['String']['output']>;
};

export type MigrationsDashboardData = {
  __typename?: 'MigrationsDashboardData';
  migrations: Maybe<Array<MigrationStatus>>;
};

export type MigrationStatus = {
  __typename?: 'MigrationStatus';
  name: Scalars['String']['output'];
  dateWritten: Maybe<Scalars['String']['output']>;
  runs: Maybe<Array<MigrationRun>>;
  lastRun: Maybe<Scalars['String']['output']>;
};

export type MigrationRun = {
  __typename?: 'MigrationRun';
  name: Scalars['String']['output'];
  started: Scalars['Date']['output'];
  finished: Maybe<Scalars['Date']['output']>;
  succeeded: Maybe<Scalars['Boolean']['output']>;
};

export type CoauthorStatus = {
  __typename?: 'CoauthorStatus';
  userId: Maybe<Scalars['String']['output']>;
  confirmed: Maybe<Scalars['Boolean']['output']>;
  requested: Maybe<Scalars['Boolean']['output']>;
};

export type ExternalPost = {
  __typename?: 'ExternalPost';
  _id: Scalars['String']['output'];
  slug: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
  postedAt: Maybe<Scalars['Date']['output']>;
  createdAt: Maybe<Scalars['Date']['output']>;
  userId: Maybe<Scalars['String']['output']>;
  modifiedAt: Maybe<Scalars['Date']['output']>;
  draft: Maybe<Scalars['Boolean']['output']>;
  content: Maybe<Scalars['String']['output']>;
  coauthorStatuses: Maybe<Array<Maybe<CoauthorStatus>>>;
};

export type ExternalPostImportData = {
  __typename?: 'ExternalPostImportData';
  alreadyExists: Maybe<Scalars['Boolean']['output']>;
  post: Maybe<ExternalPost>;
};

export type AutosaveContentType = {
  type: InputMaybe<Scalars['String']['input']>;
  value: InputMaybe<Scalars['ContentTypeData']['input']>;
};

export type ModeratorIpAddressInfo = {
  __typename?: 'ModeratorIPAddressInfo';
  ip: Scalars['String']['output'];
  userIds: Array<Scalars['String']['output']>;
};

export type RssPostChangeInfo = {
  __typename?: 'RssPostChangeInfo';
  isChanged: Scalars['Boolean']['output'];
  newHtml: Scalars['String']['output'];
  htmlDiff: Scalars['String']['output'];
};
