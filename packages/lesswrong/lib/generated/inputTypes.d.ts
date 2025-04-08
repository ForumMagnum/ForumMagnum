interface SingleAdvisorRequestInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiAdvisorRequestInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleAdvisorRequestOutput {
  result?: UpdateAdvisorRequestDataInput | null;
}

interface MultiAdvisorRequestOutput {
  results?: Array<UpdateAdvisorRequestDataInput | null> | null;
  totalCount?: number | null;
}

interface ArbitalCaches {
  _id?: string | null;
  schemaVersion?: number | null;
  createdAt?: Date | null;
  legacyData?: any;
}

interface SingleArbitalCachesInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiArbitalCachesInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleArbitalCachesOutput {
  result?: ArbitalCaches | null;
}

interface MultiArbitalCachesOutput {
  results?: Array<ArbitalCaches | null> | null;
  totalCount?: number | null;
}

interface SingleArbitalTagContentRelInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiArbitalTagContentRelInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleArbitalTagContentRelOutput {
  result?: UpdateArbitalTagContentRelDataInput | null;
}

interface MultiArbitalTagContentRelOutput {
  results?: Array<UpdateArbitalTagContentRelDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleBanInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiBanInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleBanOutput {
  result?: UpdateBanDataInput | null;
}

interface MultiBanOutput {
  results?: Array<UpdateBanDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleBookInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiBookInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleBookOutput {
  result?: UpdateBookDataInput | null;
}

interface MultiBookOutput {
  results?: Array<UpdateBookDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleChapterInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiChapterInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleChapterOutput {
  result?: UpdateChapterDataInput | null;
}

interface MultiChapterOutput {
  results?: Array<UpdateChapterDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleCkEditorUserSessionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiCkEditorUserSessionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleCkEditorUserSessionOutput {
  result?: UpdateCkEditorUserSessionDataInput | null;
}

interface MultiCkEditorUserSessionOutput {
  results?: Array<UpdateCkEditorUserSessionDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleClientIdInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiClientIdInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleClientIdOutput {
  result?: UpdateClientIdDataInput | null;
}

interface MultiClientIdOutput {
  results?: Array<UpdateClientIdDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleCollectionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiCollectionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleCollectionOutput {
  result?: UpdateCollectionDataInput | null;
}

interface MultiCollectionOutput {
  results?: Array<UpdateCollectionDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleCommentModeratorActionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiCommentModeratorActionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleCommentModeratorActionOutput {
  result?: UpdateCommentModeratorActionDataInput | null;
}

interface MultiCommentModeratorActionOutput {
  results?: Array<UpdateCommentModeratorActionDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleCommentInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiCommentInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleCommentOutput {
  result?: UpdateCommentDataInput | null;
}

interface MultiCommentOutput {
  results?: Array<UpdateCommentDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleConversationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiConversationInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleConversationOutput {
  result?: UpdateConversationDataInput | null;
}

interface MultiConversationOutput {
  results?: Array<UpdateConversationDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleCronHistoryInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiCronHistoryInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleCronHistoryOutput {
  result?: UpdateCronHistoryDataInput | null;
}

interface MultiCronHistoryOutput {
  results?: Array<UpdateCronHistoryDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleCurationEmailInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiCurationEmailInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleCurationEmailOutput {
  result?: UpdateCurationEmailDataInput | null;
}

interface MultiCurationEmailOutput {
  results?: Array<UpdateCurationEmailDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleCurationNoticeInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiCurationNoticeInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleCurationNoticeOutput {
  result?: UpdateCurationNoticeDataInput | null;
}

interface MultiCurationNoticeOutput {
  results?: Array<UpdateCurationNoticeDataInput | null> | null;
  totalCount?: number | null;
}

interface DatabaseMetadata {
  _id?: string | null;
  schemaVersion?: number | null;
  createdAt?: Date | null;
  legacyData?: any;
}

interface SingleDatabaseMetadataInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiDatabaseMetadataInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleDatabaseMetadataOutput {
  result?: DatabaseMetadata | null;
}

interface MultiDatabaseMetadataOutput {
  results?: Array<DatabaseMetadata | null> | null;
  totalCount?: number | null;
}

interface DebouncerEvents {
  _id?: string | null;
  schemaVersion?: number | null;
  createdAt?: Date | null;
  legacyData?: any;
}

interface SingleDebouncerEventsInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiDebouncerEventsInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleDebouncerEventsOutput {
  result?: DebouncerEvents | null;
}

interface MultiDebouncerEventsOutput {
  results?: Array<DebouncerEvents | null> | null;
  totalCount?: number | null;
}

interface SingleDialogueCheckInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiDialogueCheckInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleDialogueCheckOutput {
  result?: UpdateDialogueCheckDataInput | null;
}

interface MultiDialogueCheckOutput {
  results?: Array<UpdateDialogueCheckDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleDialogueMatchPreferenceInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiDialogueMatchPreferenceInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleDialogueMatchPreferenceOutput {
  result?: UpdateDialogueMatchPreferenceDataInput | null;
}

interface MultiDialogueMatchPreferenceOutput {
  results?: Array<UpdateDialogueMatchPreferenceDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleDigestPostInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiDigestPostInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleDigestPostOutput {
  result?: UpdateDigestPostDataInput | null;
}

interface MultiDigestPostOutput {
  results?: Array<UpdateDigestPostDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleDigestInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiDigestInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleDigestOutput {
  result?: UpdateDigestDataInput | null;
}

interface MultiDigestOutput {
  results?: Array<UpdateDigestDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleElectionCandidateInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiElectionCandidateInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleElectionCandidateOutput {
  result?: UpdateElectionCandidateDataInput | null;
}

interface MultiElectionCandidateOutput {
  results?: Array<UpdateElectionCandidateDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleElectionVoteInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiElectionVoteInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleElectionVoteOutput {
  result?: UpdateElectionVoteDataInput | null;
}

interface MultiElectionVoteOutput {
  results?: Array<UpdateElectionVoteDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleElicitQuestionPredictionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiElicitQuestionPredictionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleElicitQuestionPredictionOutput {
  result?: UpdateElicitQuestionPredictionDataInput | null;
}

interface MultiElicitQuestionPredictionOutput {
  results?: Array<UpdateElicitQuestionPredictionDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleElicitQuestionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiElicitQuestionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleElicitQuestionOutput {
  result?: UpdateElicitQuestionDataInput | null;
}

interface MultiElicitQuestionOutput {
  results?: Array<UpdateElicitQuestionDataInput | null> | null;
  totalCount?: number | null;
}

interface EmailTokens {
  _id?: string | null;
  schemaVersion?: number | null;
  createdAt?: Date | null;
  legacyData?: any;
}

interface SingleEmailTokensInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiEmailTokensInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleEmailTokensOutput {
  result?: EmailTokens | null;
}

interface MultiEmailTokensOutput {
  results?: Array<EmailTokens | null> | null;
  totalCount?: number | null;
}

interface SingleFeaturedResourceInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiFeaturedResourceInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleFeaturedResourceOutput {
  result?: UpdateFeaturedResourceDataInput | null;
}

interface MultiFeaturedResourceOutput {
  results?: Array<UpdateFeaturedResourceDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleFieldChangeInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiFieldChangeInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleFieldChangeOutput {
  result?: UpdateFieldChangeDataInput | null;
}

interface MultiFieldChangeOutput {
  results?: Array<UpdateFieldChangeDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleForumEventInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiForumEventInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleForumEventOutput {
  result?: UpdateForumEventDataInput | null;
}

interface MultiForumEventOutput {
  results?: Array<UpdateForumEventDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleGardenCodeInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiGardenCodeInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleGardenCodeOutput {
  result?: UpdateGardenCodeDataInput | null;
}

interface MultiGardenCodeOutput {
  results?: Array<UpdateGardenCodeDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleGoogleServiceAccountSessionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiGoogleServiceAccountSessionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleGoogleServiceAccountSessionOutput {
  result?: UpdateGoogleServiceAccountSessionDataInput | null;
}

interface MultiGoogleServiceAccountSessionOutput {
  results?: Array<UpdateGoogleServiceAccountSessionDataInput | null> | null;
  totalCount?: number | null;
}

interface Images {
  _id?: string | null;
  schemaVersion?: number | null;
  createdAt?: Date | null;
  legacyData?: any;
}

interface SingleImagesInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiImagesInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleImagesOutput {
  result?: Images | null;
}

interface MultiImagesOutput {
  results?: Array<Images | null> | null;
  totalCount?: number | null;
}

interface SingleJargonTermInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiJargonTermInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleJargonTermOutput {
  result?: UpdateJargonTermDataInput | null;
}

interface MultiJargonTermOutput {
  results?: Array<UpdateJargonTermDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleLWEventInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiLWEventInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleLWEventOutput {
  result?: UpdateLWEventDataInput | null;
}

interface MultiLWEventOutput {
  results?: Array<UpdateLWEventDataInput | null> | null;
  totalCount?: number | null;
}

interface LegacyData {
  _id?: string | null;
  schemaVersion?: number | null;
  createdAt?: Date | null;
  legacyData?: any;
}

interface SingleLegacyDataInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiLegacyDataInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleLegacyDataOutput {
  result?: LegacyData | null;
}

interface MultiLegacyDataOutput {
  results?: Array<LegacyData | null> | null;
  totalCount?: number | null;
}

interface SingleLlmConversationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiLlmConversationInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleLlmConversationOutput {
  result?: UpdateLlmConversationDataInput | null;
}

interface MultiLlmConversationOutput {
  results?: Array<UpdateLlmConversationDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleLlmMessageInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiLlmMessageInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleLlmMessageOutput {
  result?: UpdateLlmMessageDataInput | null;
}

interface MultiLlmMessageOutput {
  results?: Array<UpdateLlmMessageDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleLocalgroupInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiLocalgroupInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleLocalgroupOutput {
  result?: UpdateLocalgroupDataInput | null;
}

interface MultiLocalgroupOutput {
  results?: Array<UpdateLocalgroupDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleManifoldProbabilitiesCacheInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiManifoldProbabilitiesCacheInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleManifoldProbabilitiesCacheOutput {
  result?: UpdateManifoldProbabilitiesCacheDataInput | null;
}

interface MultiManifoldProbabilitiesCacheOutput {
  results?: Array<UpdateManifoldProbabilitiesCacheDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleMessageInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiMessageInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleMessageOutput {
  result?: UpdateMessageDataInput | null;
}

interface MultiMessageOutput {
  results?: Array<UpdateMessageDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleMigrationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiMigrationInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleMigrationOutput {
  result?: UpdateMigrationDataInput | null;
}

interface MultiMigrationOutput {
  results?: Array<UpdateMigrationDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleModerationTemplateInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiModerationTemplateInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleModerationTemplateOutput {
  result?: UpdateModerationTemplateDataInput | null;
}

interface MultiModerationTemplateOutput {
  results?: Array<UpdateModerationTemplateDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleModeratorActionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiModeratorActionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleModeratorActionOutput {
  result?: UpdateModeratorActionDataInput | null;
}

interface MultiModeratorActionOutput {
  results?: Array<UpdateModeratorActionDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleMultiDocumentInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiMultiDocumentInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleMultiDocumentOutput {
  result?: UpdateMultiDocumentDataInput | null;
}

interface MultiMultiDocumentOutput {
  results?: Array<UpdateMultiDocumentDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleNotificationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiNotificationInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleNotificationOutput {
  result?: UpdateNotificationDataInput | null;
}

interface MultiNotificationOutput {
  results?: Array<UpdateNotificationDataInput | null> | null;
  totalCount?: number | null;
}

interface PageCacheEntry {
  _id?: string | null;
  schemaVersion?: number | null;
  createdAt?: Date | null;
  legacyData?: any;
}

interface SinglePageCacheEntryInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPageCacheEntryInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePageCacheEntryOutput {
  result?: PageCacheEntry | null;
}

interface MultiPageCacheEntryOutput {
  results?: Array<PageCacheEntry | null> | null;
  totalCount?: number | null;
}

interface SinglePetrovDayActionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPetrovDayActionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePetrovDayActionOutput {
  result?: UpdatePetrovDayActionDataInput | null;
}

interface MultiPetrovDayActionOutput {
  results?: Array<UpdatePetrovDayActionDataInput | null> | null;
  totalCount?: number | null;
}

interface SinglePetrovDayLaunchInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPetrovDayLaunchInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePetrovDayLaunchOutput {
  result?: UpdatePetrovDayLaunchDataInput | null;
}

interface MultiPetrovDayLaunchOutput {
  results?: Array<UpdatePetrovDayLaunchDataInput | null> | null;
  totalCount?: number | null;
}

interface SinglePodcastEpisodeInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPodcastEpisodeInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePodcastEpisodeOutput {
  result?: UpdatePodcastEpisodeDataInput | null;
}

interface MultiPodcastEpisodeOutput {
  results?: Array<UpdatePodcastEpisodeDataInput | null> | null;
  totalCount?: number | null;
}

interface SinglePodcastInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPodcastInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePodcastOutput {
  result?: UpdatePodcastDataInput | null;
}

interface MultiPodcastOutput {
  results?: Array<UpdatePodcastDataInput | null> | null;
  totalCount?: number | null;
}

interface SinglePostEmbeddingInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPostEmbeddingInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePostEmbeddingOutput {
  result?: UpdatePostEmbeddingDataInput | null;
}

interface MultiPostEmbeddingOutput {
  results?: Array<UpdatePostEmbeddingDataInput | null> | null;
  totalCount?: number | null;
}

interface SinglePostRecommendationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPostRecommendationInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePostRecommendationOutput {
  result?: UpdatePostRecommendationDataInput | null;
}

interface MultiPostRecommendationOutput {
  results?: Array<UpdatePostRecommendationDataInput | null> | null;
  totalCount?: number | null;
}

interface SinglePostRelationInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPostRelationInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePostRelationOutput {
  result?: UpdatePostRelationDataInput | null;
}

interface MultiPostRelationOutput {
  results?: Array<UpdatePostRelationDataInput | null> | null;
  totalCount?: number | null;
}

interface SinglePostViewTimeInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPostViewTimeInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePostViewTimeOutput {
  result?: UpdatePostViewTimeDataInput | null;
}

interface MultiPostViewTimeOutput {
  results?: Array<UpdatePostViewTimeDataInput | null> | null;
  totalCount?: number | null;
}

interface PostViews {
  _id?: string | null;
  schemaVersion?: number | null;
  createdAt?: Date | null;
  legacyData?: any;
}

interface SinglePostViewsInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPostViewsInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePostViewsOutput {
  result?: PostViews | null;
}

interface MultiPostViewsOutput {
  results?: Array<PostViews | null> | null;
  totalCount?: number | null;
}

interface SinglePostInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiPostInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SinglePostOutput {
  result?: UpdatePostDataInput | null;
}

interface MultiPostOutput {
  results?: Array<UpdatePostDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleRSSFeedInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiRSSFeedInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleRSSFeedOutput {
  result?: UpdateRSSFeedDataInput | null;
}

interface MultiRSSFeedOutput {
  results?: Array<UpdateRSSFeedDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleReadStatusInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiReadStatusInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleReadStatusOutput {
  result?: UpdateReadStatusDataInput | null;
}

interface MultiReadStatusOutput {
  results?: Array<UpdateReadStatusDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleRecommendationsCacheInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiRecommendationsCacheInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleRecommendationsCacheOutput {
  result?: UpdateRecommendationsCacheDataInput | null;
}

interface MultiRecommendationsCacheOutput {
  results?: Array<UpdateRecommendationsCacheDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleReportInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiReportInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleReportOutput {
  result?: UpdateReportDataInput | null;
}

interface MultiReportOutput {
  results?: Array<UpdateReportDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleReviewVoteInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiReviewVoteInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleReviewVoteOutput {
  result?: UpdateReviewVoteDataInput | null;
}

interface MultiReviewVoteOutput {
  results?: Array<UpdateReviewVoteDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleReviewWinnerArtInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiReviewWinnerArtInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleReviewWinnerArtOutput {
  result?: UpdateReviewWinnerArtDataInput | null;
}

interface MultiReviewWinnerArtOutput {
  results?: Array<UpdateReviewWinnerArtDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleReviewWinnerInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiReviewWinnerInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleReviewWinnerOutput {
  result?: UpdateReviewWinnerDataInput | null;
}

interface MultiReviewWinnerOutput {
  results?: Array<UpdateReviewWinnerDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleRevisionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiRevisionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleRevisionOutput {
  result?: UpdateRevisionDataInput | null;
}

interface MultiRevisionOutput {
  results?: Array<UpdateRevisionDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSequenceInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSequenceInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSequenceOutput {
  result?: UpdateSequenceDataInput | null;
}

interface MultiSequenceOutput {
  results?: Array<UpdateSequenceDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSessionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSessionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSessionOutput {
  result?: UpdateSessionDataInput | null;
}

interface MultiSessionOutput {
  results?: Array<UpdateSessionDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSideCommentCacheInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSideCommentCacheInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSideCommentCacheOutput {
  result?: UpdateSideCommentCacheDataInput | null;
}

interface MultiSideCommentCacheOutput {
  results?: Array<UpdateSideCommentCacheDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSplashArtCoordinateInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSplashArtCoordinateInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSplashArtCoordinateOutput {
  result?: UpdateSplashArtCoordinateDataInput | null;
}

interface MultiSplashArtCoordinateOutput {
  results?: Array<UpdateSplashArtCoordinateDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSpotlightInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSpotlightInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSpotlightOutput {
  result?: UpdateSpotlightDataInput | null;
}

interface MultiSpotlightOutput {
  results?: Array<UpdateSpotlightDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSubscriptionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSubscriptionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSubscriptionOutput {
  result?: UpdateSubscriptionDataInput | null;
}

interface MultiSubscriptionOutput {
  results?: Array<UpdateSubscriptionDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSurveyQuestionInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSurveyQuestionInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSurveyQuestionOutput {
  result?: UpdateSurveyQuestionDataInput | null;
}

interface MultiSurveyQuestionOutput {
  results?: Array<UpdateSurveyQuestionDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSurveyResponseInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSurveyResponseInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSurveyResponseOutput {
  result?: UpdateSurveyResponseDataInput | null;
}

interface MultiSurveyResponseOutput {
  results?: Array<UpdateSurveyResponseDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSurveyScheduleInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSurveyScheduleInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSurveyScheduleOutput {
  result?: UpdateSurveyScheduleDataInput | null;
}

interface MultiSurveyScheduleOutput {
  results?: Array<UpdateSurveyScheduleDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleSurveyInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiSurveyInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleSurveyOutput {
  result?: UpdateSurveyDataInput | null;
}

interface MultiSurveyOutput {
  results?: Array<UpdateSurveyDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleTagFlagInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiTagFlagInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleTagFlagOutput {
  result?: UpdateTagFlagDataInput | null;
}

interface MultiTagFlagOutput {
  results?: Array<UpdateTagFlagDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleTagRelInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiTagRelInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleTagRelOutput {
  result?: UpdateTagRelDataInput | null;
}

interface MultiTagRelOutput {
  results?: Array<UpdateTagRelDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleTagInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiTagInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleTagOutput {
  result?: UpdateTagDataInput | null;
}

interface MultiTagOutput {
  results?: Array<UpdateTagDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleTweetInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiTweetInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleTweetOutput {
  result?: UpdateTweetDataInput | null;
}

interface MultiTweetOutput {
  results?: Array<UpdateTweetDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleTypingIndicatorInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiTypingIndicatorInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleTypingIndicatorOutput {
  result?: UpdateTypingIndicatorDataInput | null;
}

interface MultiTypingIndicatorOutput {
  results?: Array<UpdateTypingIndicatorDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleUserActivityInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiUserActivityInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleUserActivityOutput {
  result?: UpdateUserActivityDataInput | null;
}

interface MultiUserActivityOutput {
  results?: Array<UpdateUserActivityDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleUserEAGDetailInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiUserEAGDetailInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleUserEAGDetailOutput {
  result?: UpdateUserEAGDetailDataInput | null;
}

interface MultiUserEAGDetailOutput {
  results?: Array<UpdateUserEAGDetailDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleUserJobAdInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiUserJobAdInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleUserJobAdOutput {
  result?: UpdateUserJobAdDataInput | null;
}

interface MultiUserJobAdOutput {
  results?: Array<UpdateUserJobAdDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleUserMostValuablePostInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiUserMostValuablePostInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleUserMostValuablePostOutput {
  result?: UpdateUserMostValuablePostDataInput | null;
}

interface MultiUserMostValuablePostOutput {
  results?: Array<UpdateUserMostValuablePostDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleUserRateLimitInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiUserRateLimitInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleUserRateLimitOutput {
  result?: UpdateUserRateLimitDataInput | null;
}

interface MultiUserRateLimitOutput {
  results?: Array<UpdateUserRateLimitDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleUserTagRelInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiUserTagRelInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleUserTagRelOutput {
  result?: UpdateUserTagRelDataInput | null;
}

interface MultiUserTagRelOutput {
  results?: Array<UpdateUserTagRelDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleUserInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiUserInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleUserOutput {
  result?: UpdateUserDataInput | null;
}

interface MultiUserOutput {
  results?: Array<UpdateUserDataInput | null> | null;
  totalCount?: number | null;
}

interface SingleVoteInput {
  selector?: SelectorInput | null;
  resolverArgs?: any;
  enableCache?: boolean | null;
  allowNull?: boolean | null;
}

interface MultiVoteInput {
  terms?: any;
  resolverArgs?: any;
  offset?: number | null;
  limit?: number | null;
  enableCache?: boolean | null;
  enableTotal?: boolean | null;
  where?: SelectorInput | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
}

interface SingleVoteOutput {
  result?: UpdateVoteDataInput | null;
}

interface MultiVoteOutput {
  results?: Array<UpdateVoteDataInput | null> | null;
  totalCount?: number | null;
}

interface Query {
  advisorRequest?: SingleAdvisorRequestOutput | null;
  advisorRequests?: MultiAdvisorRequestOutput | null;
  arbitalTagContentRel?: SingleArbitalTagContentRelOutput | null;
  arbitalTagContentRels?: MultiArbitalTagContentRelOutput | null;
  ban?: SingleBanOutput | null;
  bans?: MultiBanOutput | null;
  book?: SingleBookOutput | null;
  books?: MultiBookOutput | null;
  chapter?: SingleChapterOutput | null;
  chapters?: MultiChapterOutput | null;
  ckEditorUserSession?: SingleCkEditorUserSessionOutput | null;
  ckEditorUserSessions?: MultiCkEditorUserSessionOutput | null;
  clientId?: SingleClientIdOutput | null;
  clientIds?: MultiClientIdOutput | null;
  collection?: SingleCollectionOutput | null;
  collections?: MultiCollectionOutput | null;
  commentModeratorAction?: SingleCommentModeratorActionOutput | null;
  commentModeratorActions?: MultiCommentModeratorActionOutput | null;
  comment?: SingleCommentOutput | null;
  comments?: MultiCommentOutput | null;
  conversation?: SingleConversationOutput | null;
  conversations?: MultiConversationOutput | null;
  curationNotice?: SingleCurationNoticeOutput | null;
  curationNotices?: MultiCurationNoticeOutput | null;
  dialogueCheck?: SingleDialogueCheckOutput | null;
  dialogueChecks?: MultiDialogueCheckOutput | null;
  dialogueMatchPreference?: SingleDialogueMatchPreferenceOutput | null;
  dialogueMatchPreferences?: MultiDialogueMatchPreferenceOutput | null;
  digestPost?: SingleDigestPostOutput | null;
  digestPosts?: MultiDigestPostOutput | null;
  digest?: SingleDigestOutput | null;
  digests?: MultiDigestOutput | null;
  electionCandidate?: SingleElectionCandidateOutput | null;
  electionCandidates?: MultiElectionCandidateOutput | null;
  electionVote?: SingleElectionVoteOutput | null;
  electionVotes?: MultiElectionVoteOutput | null;
  elicitQuestionPrediction?: SingleElicitQuestionPredictionOutput | null;
  elicitQuestionPredictions?: MultiElicitQuestionPredictionOutput | null;
  elicitQuestion?: SingleElicitQuestionOutput | null;
  elicitQuestions?: MultiElicitQuestionOutput | null;
  featuredResource?: SingleFeaturedResourceOutput | null;
  featuredResources?: MultiFeaturedResourceOutput | null;
  forumEvent?: SingleForumEventOutput | null;
  forumEvents?: MultiForumEventOutput | null;
  gardenCode?: SingleGardenCodeOutput | null;
  gardenCodes?: MultiGardenCodeOutput | null;
  googleServiceAccountSession?: SingleGoogleServiceAccountSessionOutput | null;
  googleServiceAccountSessions?: MultiGoogleServiceAccountSessionOutput | null;
  jargonTerm?: SingleJargonTermOutput | null;
  jargonTerms?: MultiJargonTermOutput | null;
  lWEvent?: SingleLWEventOutput | null;
  lWEvents?: MultiLWEventOutput | null;
  llmConversation?: SingleLlmConversationOutput | null;
  llmConversations?: MultiLlmConversationOutput | null;
  localgroup?: SingleLocalgroupOutput | null;
  localgroups?: MultiLocalgroupOutput | null;
  message?: SingleMessageOutput | null;
  messages?: MultiMessageOutput | null;
  moderationTemplate?: SingleModerationTemplateOutput | null;
  moderationTemplates?: MultiModerationTemplateOutput | null;
  moderatorAction?: SingleModeratorActionOutput | null;
  moderatorActions?: MultiModeratorActionOutput | null;
  multiDocument?: SingleMultiDocumentOutput | null;
  multiDocuments?: MultiMultiDocumentOutput | null;
  notification?: SingleNotificationOutput | null;
  notifications?: MultiNotificationOutput | null;
  petrovDayAction?: SinglePetrovDayActionOutput | null;
  petrovDayActions?: MultiPetrovDayActionOutput | null;
  podcastEpisode?: SinglePodcastEpisodeOutput | null;
  podcastEpisodes?: MultiPodcastEpisodeOutput | null;
  podcast?: SinglePodcastOutput | null;
  podcasts?: MultiPodcastOutput | null;
  postEmbedding?: SinglePostEmbeddingOutput | null;
  postEmbeddings?: MultiPostEmbeddingOutput | null;
  postRelation?: SinglePostRelationOutput | null;
  postRelations?: MultiPostRelationOutput | null;
  postViewTime?: SinglePostViewTimeOutput | null;
  postViewTimes?: MultiPostViewTimeOutput | null;
  postViews?: SinglePostViewsOutput | null;
  postViewses?: MultiPostViewsOutput | null;
  post?: SinglePostOutput | null;
  posts?: MultiPostOutput | null;
  rSSFeed?: SingleRSSFeedOutput | null;
  rSSFeeds?: MultiRSSFeedOutput | null;
  report?: SingleReportOutput | null;
  reports?: MultiReportOutput | null;
  reviewVote?: SingleReviewVoteOutput | null;
  reviewVotes?: MultiReviewVoteOutput | null;
  reviewWinnerArt?: SingleReviewWinnerArtOutput | null;
  reviewWinnerArts?: MultiReviewWinnerArtOutput | null;
  reviewWinner?: SingleReviewWinnerOutput | null;
  reviewWinners?: MultiReviewWinnerOutput | null;
  revision?: SingleRevisionOutput | null;
  revisions?: MultiRevisionOutput | null;
  sequence?: SingleSequenceOutput | null;
  sequences?: MultiSequenceOutput | null;
  splashArtCoordinate?: SingleSplashArtCoordinateOutput | null;
  splashArtCoordinates?: MultiSplashArtCoordinateOutput | null;
  spotlight?: SingleSpotlightOutput | null;
  spotlights?: MultiSpotlightOutput | null;
  subscription?: SingleSubscriptionOutput | null;
  subscriptions?: MultiSubscriptionOutput | null;
  surveyQuestion?: SingleSurveyQuestionOutput | null;
  surveyQuestions?: MultiSurveyQuestionOutput | null;
  surveyResponse?: SingleSurveyResponseOutput | null;
  surveyResponses?: MultiSurveyResponseOutput | null;
  surveySchedule?: SingleSurveyScheduleOutput | null;
  surveySchedules?: MultiSurveyScheduleOutput | null;
  survey?: SingleSurveyOutput | null;
  surveys?: MultiSurveyOutput | null;
  tagFlag?: SingleTagFlagOutput | null;
  tagFlags?: MultiTagFlagOutput | null;
  tagRel?: SingleTagRelOutput | null;
  tagRels?: MultiTagRelOutput | null;
  tag?: SingleTagOutput | null;
  tags?: MultiTagOutput | null;
  typingIndicator?: SingleTypingIndicatorOutput | null;
  typingIndicators?: MultiTypingIndicatorOutput | null;
  userEAGDetail?: SingleUserEAGDetailOutput | null;
  userEAGDetails?: MultiUserEAGDetailOutput | null;
  userJobAd?: SingleUserJobAdOutput | null;
  userJobAds?: MultiUserJobAdOutput | null;
  userMostValuablePost?: SingleUserMostValuablePostOutput | null;
  userMostValuablePosts?: MultiUserMostValuablePostOutput | null;
  userRateLimit?: SingleUserRateLimitOutput | null;
  userRateLimits?: MultiUserRateLimitOutput | null;
  userTagRel?: SingleUserTagRelOutput | null;
  userTagRels?: MultiUserTagRelOutput | null;
  user?: SingleUserOutput | null;
  users?: MultiUserOutput | null;
  vote?: SingleVoteOutput | null;
  votes?: MultiVoteOutput | null;
}

never

interface SelectorInput {
  _id?: string | null;
  documentId?: string | null;
}

interface EmailPreview {
  to?: string | null;
  subject?: string | null;
  html?: string | null;
  text?: string | null;
}

interface ArbitalLinkedPage {
  _id: string;
  name: string;
  slug: string;
}

interface ArbitalLinkedPages {
  faster?: Array<ArbitalLinkedPage | null> | null;
  slower?: Array<ArbitalLinkedPage | null> | null;
  moreTechnical?: Array<ArbitalLinkedPage | null> | null;
  lessTechnical?: Array<ArbitalLinkedPage | null> | null;
  requirements?: Array<ArbitalLinkedPage | null> | null;
  teaches?: Array<ArbitalLinkedPage | null> | null;
  parents?: Array<ArbitalLinkedPage | null> | null;
  children?: Array<ArbitalLinkedPage | null> | null;
}

interface SocialPreviewType {
  _id?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  text?: string | null;
}

interface ContentType {
  type?: string | null;
  data?: ContentTypeData | null;
}

interface TagContributor {
  user?: UpdateUserDataInput | null;
  contributionScore: number;
  currentAttributionCharCount?: number | null;
  numCommits: number;
  voteCount: number;
}

interface TagContributorsList {
  contributors?: Array<TagContributor> | null;
  totalCount: number;
}

interface UserLikingTag {
  _id: string;
  displayName: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface RecommendResumeSequence {
  sequence?: UpdateSequenceDataInput | null;
  collection?: UpdateCollectionDataInput | null;
  nextPost: UpdatePostDataInput;
  numRead?: number | null;
  numTotal?: number | null;
  lastReadTime?: Date | null;
}

interface CommentCountTag {
  name: string;
  comment_count: number;
}

interface TopCommentedTagUser {
  _id: ID;
  username: string;
  displayName: string;
  total_power: number;
  tag_comment_counts: Array<CommentCountTag>;
}

interface UpvotedUser {
  _id: ID;
  username: string;
  displayName: string;
  total_power: number;
  power_values: string;
  vote_counts: number;
  total_agreement: number;
  agreement_values: string;
  recently_active_matchmaking: boolean;
}

interface UserDialogueUsefulData {
  dialogueUsers?: Array<UpdateUserDataInput | null> | null;
  topUsers?: Array<UpvotedUser | null> | null;
  activeDialogueMatchSeekers?: Array<UpdateUserDataInput | null> | null;
}

interface NewUserCompletedProfile {
  username?: string | null;
  slug?: string | null;
  displayName?: string | null;
  subscribedToDigest?: boolean | null;
  usernameUnset?: boolean | null;
}

interface UserCoreTagReads {
  tagId?: string | null;
  userReadCount?: number | null;
}

interface SuggestedFeedSubscriptionUsersResult {
  results: Array<UpdateUserDataInput>;
}

interface VoteResultPost {
  document: UpdatePostDataInput;
  showVotingPatternWarning: boolean;
}

interface VoteResultComment {
  document: UpdateCommentDataInput;
  showVotingPatternWarning: boolean;
}

interface VoteResultTagRel {
  document: UpdateTagRelDataInput;
  showVotingPatternWarning: boolean;
}

interface VoteResultRevision {
  document: UpdateRevisionDataInput;
  showVotingPatternWarning: boolean;
}

interface VoteResultElectionCandidate {
  document: UpdateElectionCandidateDataInput;
  showVotingPatternWarning: boolean;
}

interface VoteResultTag {
  document: UpdateTagDataInput;
  showVotingPatternWarning: boolean;
}

interface VoteResultMultiDocument {
  document: UpdateMultiDocumentDataInput;
  showVotingPatternWarning: boolean;
}

interface CommentsWithReactsResult {
  results: Array<UpdateCommentDataInput>;
}

interface PopularCommentsResult {
  results: Array<UpdateCommentDataInput>;
}

interface PostKarmaChange {
  _id?: string | null;
  scoreChange?: number | null;
  postId?: string | null;
  title?: string | null;
  slug?: string | null;
  addedReacts?: Array<ReactionChange> | null;
  eaAddedReacts?: any;
}

interface CommentKarmaChange {
  _id?: string | null;
  scoreChange?: number | null;
  commentId?: string | null;
  description?: string | null;
  postId?: string | null;
  postTitle?: string | null;
  postSlug?: string | null;
  tagSlug?: string | null;
  tagName?: string | null;
  tagCommentType?: string | null;
  addedReacts?: Array<ReactionChange> | null;
  eaAddedReacts?: any;
}

interface RevisionsKarmaChange {
  _id?: string | null;
  scoreChange?: number | null;
  tagId?: string | null;
  tagSlug?: string | null;
  tagName?: string | null;
  addedReacts?: Array<ReactionChange> | null;
  eaAddedReacts?: any;
}

interface ReactionChange {
  reactionType: string;
  userId?: string | null;
}

interface KarmaChangesSimple {
  posts?: Array<PostKarmaChange | null> | null;
  comments?: Array<CommentKarmaChange | null> | null;
  tagRevisions?: Array<RevisionsKarmaChange | null> | null;
}

interface KarmaChanges {
  totalChange?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  nextBatchDate?: Date | null;
  updateFrequency?: string | null;
  posts?: Array<PostKarmaChange | null> | null;
  comments?: Array<CommentKarmaChange | null> | null;
  tagRevisions?: Array<RevisionsKarmaChange | null> | null;
  todaysKarmaChanges?: KarmaChangesSimple | null;
  thisWeeksKarmaChanges?: KarmaChangesSimple | null;
}

interface UniqueClientViewsSeries {
  uniqueClientViews?: number | null;
  date?: Date | null;
}

interface PostAnalyticsResult {
  allViews?: number | null;
  uniqueClientViews?: number | null;
  uniqueClientViews10Sec?: number | null;
  medianReadingTime?: number | null;
  uniqueClientViews5Min?: number | null;
  uniqueClientViewsSeries?: Array<UniqueClientViewsSeries | null> | null;
}

interface PostAnalytics2Result {
  _id?: string | null;
  title?: string | null;
  slug?: string | null;
  postedAt?: Date | null;
  views?: number | null;
  uniqueViews?: number | null;
  reads?: number | null;
  meanReadingTime?: number | null;
  karma?: number | null;
  comments?: number | null;
}

interface MultiPostAnalyticsResult {
  posts?: Array<PostAnalytics2Result | null> | null;
  totalCount: number;
}

interface AnalyticsSeriesValue {
  date?: Date | null;
  views?: number | null;
  reads?: number | null;
  karma?: number | null;
  comments?: number | null;
}

interface ArbitalPageData {
  html?: string | null;
  title?: string | null;
}

interface ElicitUser {
  isQuestionCreator?: boolean | null;
  displayName?: string | null;
  _id?: string | null;
  sourceUserId?: string | null;
  lwUser?: UpdateUserDataInput | null;
}

interface ElicitPrediction {
  _id?: string | null;
  predictionId?: string | null;
  prediction?: number | null;
  createdAt?: Date | null;
  notes?: string | null;
  creator?: ElicitUser | null;
  sourceUrl?: string | null;
  sourceId?: string | null;
  binaryQuestionId?: string | null;
}

interface ElicitBlockData {
  _id?: string | null;
  title?: string | null;
  notes?: string | null;
  resolvesBy?: Date | null;
  resolution?: boolean | null;
  predictions?: Array<ElicitPrediction | null> | null;
}

interface NotificationCounts {
  checkedAt: Date;
  unreadNotifications: number;
  unreadPrivateMessages: number;
  faviconBadgeNumber: number;
}

interface NotificationDisplaysResult {
  results: Array<any>;
}

interface PetrovDay2024CheckNumberOfIncomingData {
  count?: number | null;
}

interface PetrovDayCheckIfIncomingData {
  launched?: boolean | null;
  createdAt?: Date | null;
}

interface PetrovDayLaunchMissileData {
  launchCode?: string | null;
  createdAt?: Date | null;
}

interface GivingSeasonHeart {
  userId: string;
  displayName: string;
  x: number;
  y: number;
  theta: number;
}

interface UserReadHistoryResult {
  posts?: Array<UpdatePostDataInput> | null;
}

interface PostsUserCommentedOnResult {
  posts?: Array<UpdatePostDataInput> | null;
}

interface PostReviewFilter {
  startDate?: Date | null;
  endDate?: Date | null;
  minKarma?: number | null;
  showEvents?: boolean | null;
}

interface PostReviewSort {
  karma?: boolean | null;
}

interface DigestPlannerPost {
  post?: UpdatePostDataInput | null;
  digestPost?: UpdateDigestPostDataInput | null;
  rating?: number | null;
}

interface RecombeeRecommendedPost {
  post: UpdatePostDataInput;
  scenario?: string | null;
  recommId?: string | null;
  generatedAt?: Date | null;
  curated?: boolean | null;
  stickied?: boolean | null;
}

interface VertexRecommendedPost {
  post: UpdatePostDataInput;
  attributionId?: string | null;
}

interface PostWithApprovedJargon {
  post: UpdatePostDataInput;
  jargonTerms?: Array<UpdateJargonTermDataInput> | null;
}

interface DigestHighlightsResult {
  results: Array<UpdatePostDataInput>;
}

interface DigestPostsThisWeekResult {
  results: Array<UpdatePostDataInput>;
}

interface CuratedAndPopularThisWeekResult {
  results: Array<UpdatePostDataInput>;
}

interface RecentlyActiveDialoguesResult {
  results: Array<UpdatePostDataInput>;
}

interface MyDialoguesResult {
  results: Array<UpdatePostDataInput>;
}

interface GoogleVertexPostsResult {
  results: Array<VertexRecommendedPost>;
}

interface CrossedKarmaThresholdResult {
  results: Array<UpdatePostDataInput>;
}

interface RecombeeLatestPostsResult {
  results: Array<RecombeeRecommendedPost>;
}

interface RecombeeHybridPostsResult {
  results: Array<RecombeeRecommendedPost>;
}

interface PostsWithActiveDiscussionResult {
  results: Array<UpdatePostDataInput>;
}

interface PostsBySubscribedAuthorsResult {
  results: Array<UpdatePostDataInput>;
}

interface PostsWithApprovedJargonResult {
  results: Array<PostWithApprovedJargon>;
}

interface AllTagsActivityFeedQueryResults {
  cutoff?: Date | null;
  endOffset: number;
  results?: Array<AllTagsActivityFeedEntryType> | null;
}

interface AllTagsActivityFeedEntryType {
  type: string;
  tagCreated?: UpdateTagDataInput | null;
  tagRevision?: UpdateRevisionDataInput | null;
  tagDiscussionComment?: UpdateCommentDataInput | null;
}

interface RecentDiscussionFeedQueryResults {
  cutoff?: Date | null;
  endOffset: number;
  results?: Array<RecentDiscussionFeedEntryType> | null;
}

interface RecentDiscussionFeedEntryType {
  type: string;
  postCommented?: UpdatePostDataInput | null;
  shortformCommented?: UpdatePostDataInput | null;
  tagDiscussed?: UpdateTagDataInput | null;
  tagRevised?: UpdateRevisionDataInput | null;
}

interface SubscribedPostAndComments {
  _id: string;
  post: UpdatePostDataInput;
  comments?: Array<UpdateCommentDataInput> | null;
  expandCommentIds?: Array<string> | null;
  postIsFromSubscribedUser: boolean;
}

interface SubscribedFeedQueryResults {
  cutoff?: Date | null;
  endOffset: number;
  results?: Array<SubscribedFeedEntryType> | null;
}

interface SubscribedFeedEntryType {
  type: string;
  postCommented?: SubscribedPostAndComments | null;
}

interface TagHistoryFeedQueryResults {
  cutoff?: Date | null;
  endOffset: number;
  results?: Array<TagHistoryFeedEntryType> | null;
}

interface TagHistoryFeedEntryType {
  type: string;
  tagCreated?: UpdateTagDataInput | null;
  tagApplied?: UpdateTagRelDataInput | null;
  tagRevision?: UpdateRevisionDataInput | null;
  tagDiscussionComment?: UpdateCommentDataInput | null;
  lensRevision?: UpdateRevisionDataInput | null;
  summaryRevision?: UpdateRevisionDataInput | null;
  wikiMetadataChanged?: UpdateFieldChangeDataInput | null;
  lensOrSummaryMetadataChanged?: UpdateFieldChangeDataInput | null;
}

interface SubforumMagicFeedQueryResults {
  cutoff?: Date | null;
  endOffset: number;
  results?: Array<SubforumMagicFeedEntryType> | null;
}

interface SubforumMagicFeedEntryType {
  type: string;
  tagSubforumPosts?: UpdatePostDataInput | null;
  tagSubforumComments?: UpdateCommentDataInput | null;
  tagSubforumStickyComments?: UpdateCommentDataInput | null;
}

interface SubforumTopFeedQueryResults {
  cutoff?: Date | null;
  endOffset: number;
  results?: Array<SubforumTopFeedEntryType> | null;
}

interface SubforumTopFeedEntryType {
  type: string;
  tagSubforumPosts?: UpdatePostDataInput | null;
  tagSubforumComments?: UpdateCommentDataInput | null;
  tagSubforumStickyComments?: UpdateCommentDataInput | null;
}

interface SubforumRecentCommentsFeedQueryResults {
  cutoff?: Date | null;
  endOffset: number;
  results?: Array<SubforumRecentCommentsFeedEntryType> | null;
}

interface SubforumRecentCommentsFeedEntryType {
  type: string;
  tagSubforumPosts?: UpdatePostDataInput | null;
  tagSubforumComments?: UpdateCommentDataInput | null;
  tagSubforumStickyComments?: UpdateCommentDataInput | null;
}

interface SubforumNewFeedQueryResults {
  cutoff?: Date | null;
  endOffset: number;
  results?: Array<SubforumNewFeedEntryType> | null;
}

interface SubforumNewFeedEntryType {
  type: string;
  tagSubforumPosts?: UpdatePostDataInput | null;
  tagSubforumComments?: UpdateCommentDataInput | null;
  tagSubforumStickyComments?: UpdateCommentDataInput | null;
}

interface SubforumOldFeedQueryResults {
  cutoff?: Date | null;
  endOffset: number;
  results?: Array<SubforumOldFeedEntryType> | null;
}

interface SubforumOldFeedEntryType {
  type: string;
  tagSubforumPosts?: UpdatePostDataInput | null;
  tagSubforumComments?: UpdateCommentDataInput | null;
  tagSubforumStickyComments?: UpdateCommentDataInput | null;
}

interface SurveyQuestionInfo {
  _id?: string | null;
  question: string;
  format: string;
}

interface DocumentDeletion {
  userId?: string | null;
  documentId: string;
  netChange: string;
  type?: string | null;
  docFields?: UpdateMultiDocumentDataInput | null;
  createdAt: Date;
}

interface TagUpdates {
  tag: UpdateTagDataInput;
  revisionIds?: Array<string> | null;
  commentCount?: number | null;
  commentIds?: Array<string> | null;
  lastRevisedAt?: Date | null;
  lastCommentedAt?: Date | null;
  added?: number | null;
  removed?: number | null;
  users?: Array<UpdateUserDataInput> | null;
  documentDeletions?: Array<DocumentDeletion> | null;
}

interface TagPreviewWithSummaries {
  tag: UpdateTagDataInput;
  lens?: UpdateMultiDocumentDataInput | null;
  summaries: Array<UpdateMultiDocumentDataInput>;
}

interface TagWithTotalCount {
  tags: Array<UpdateTagDataInput>;
  totalCount: number;
}

interface MostReadTopic {
  slug?: string | null;
  name?: string | null;
  shortName?: string | null;
  count?: number | null;
}

interface TagReadLikelihoodRatio {
  tagId?: string | null;
  tagName?: string | null;
  tagShortName?: string | null;
  userReadCount?: number | null;
  readLikelihoodRatio?: number | null;
}

interface MostReadAuthor {
  _id?: string | null;
  slug?: string | null;
  displayName?: string | null;
  profileImageId?: string | null;
  count?: number | null;
  engagementPercentile?: number | null;
}

interface TopCommentContents {
  html?: string | null;
}

interface TopComment {
  _id?: string | null;
  postedAt?: Date | null;
  postId?: string | null;
  postTitle?: string | null;
  postSlug?: string | null;
  baseScore?: number | null;
  extendedScore?: any;
  contents?: TopCommentContents | null;
}

interface MostReceivedReact {
  name?: string | null;
  count?: number | null;
}

interface CombinedKarmaVals {
  date: Date;
  postKarma: number;
  commentKarma: number;
}

interface WrappedDataByYear {
  engagementPercentile?: number | null;
  postsReadCount?: number | null;
  totalSeconds?: number | null;
  daysVisited?: Array<string | null> | null;
  mostReadTopics?: Array<MostReadTopic | null> | null;
  relativeMostReadCoreTopics?: Array<TagReadLikelihoodRatio | null> | null;
  mostReadAuthors?: Array<MostReadAuthor | null> | null;
  topPosts?: Array<UpdatePostDataInput | null> | null;
  postCount?: number | null;
  authorPercentile?: number | null;
  topComment?: TopComment | null;
  commentCount?: number | null;
  commenterPercentile?: number | null;
  topShortform?: UpdateCommentDataInput | null;
  shortformCount?: number | null;
  shortformPercentile?: number | null;
  karmaChange?: number | null;
  combinedKarmaVals?: Array<CombinedKarmaVals | null> | null;
  mostReceivedReacts?: Array<MostReceivedReact | null> | null;
  personality: string;
}

interface Site {
  title?: string | null;
  url?: string | null;
  logoUrl?: string | null;
}

interface LoginReturnData {
  token?: string | null;
}

interface MigrationsDashboardData {
  migrations?: Array<MigrationStatus> | null;
}

interface MigrationStatus {
  name: string;
  dateWritten?: string | null;
  runs?: Array<MigrationRun> | null;
  lastRun?: string | null;
}

interface MigrationRun {
  name: string;
  started: Date;
  finished?: Date | null;
  succeeded?: boolean | null;
}

interface CoauthorStatus {
  userId?: string | null;
  confirmed?: boolean | null;
  requested?: boolean | null;
}

interface ExternalPost {
  _id: string;
  slug?: string | null;
  title?: string | null;
  url?: string | null;
  postedAt?: Date | null;
  createdAt?: Date | null;
  userId?: string | null;
  modifiedAt?: Date | null;
  draft?: boolean | null;
  content?: string | null;
  coauthorStatuses?: Array<CoauthorStatus | null> | null;
}

interface ExternalPostImportData {
  alreadyExists?: boolean | null;
  post?: ExternalPost | null;
}

interface AutosaveContentType {
  type?: string | null;
  value?: ContentTypeData | null;
}

interface ModeratorIPAddressInfo {
  ip: string;
  userIds: Array<string>;
}

interface RssPostChangeInfo {
  isChanged: boolean;
  newHtml: string;
  htmlDiff: string;
}

interface CreateAdvisorRequestDataInput {
  legacyData?: any;
  userId: string;
  interestedInMetaculus?: boolean | null;
  jobAds?: any;
}

interface CreateAdvisorRequestInput {
  data: CreateAdvisorRequestDataInput;
}

interface UpdateAdvisorRequestDataInput {
  legacyData?: any;
  userId?: string | null;
  interestedInMetaculus?: boolean | null;
  jobAds?: any;
}

interface UpdateAdvisorRequestInput {
  selector: SelectorInput;
  data: UpdateAdvisorRequestDataInput;
}

interface AdvisorRequestOutput {
  data?: UpdateAdvisorRequestDataInput | null;
}

interface CreateArbitalTagContentRelDataInput {
  legacyData?: any;
  parentDocumentId: string;
  childDocumentId: string;
  parentCollectionName: string;
  childCollectionName: string;
  type: string;
  level: number;
  isStrong: boolean;
}

interface CreateArbitalTagContentRelInput {
  data: CreateArbitalTagContentRelDataInput;
}

interface UpdateArbitalTagContentRelDataInput {
  legacyData?: any;
}

interface UpdateArbitalTagContentRelInput {
  selector: SelectorInput;
  data: UpdateArbitalTagContentRelDataInput;
}

interface ArbitalTagContentRelOutput {
  data?: UpdateArbitalTagContentRelDataInput | null;
}

interface CreateBanDataInput {
  legacyData?: any;
  expirationDate: Date;
  userId?: string | null;
  ip?: string | null;
  reason?: string | null;
  comment?: string | null;
  properties?: any;
}

interface CreateBanInput {
  data: CreateBanDataInput;
}

interface UpdateBanDataInput {
  legacyData?: any;
  expirationDate?: Date | null;
  userId?: string | null;
  ip?: string | null;
  reason?: string | null;
  comment?: string | null;
  properties?: any;
}

interface UpdateBanInput {
  selector: SelectorInput;
  data: UpdateBanDataInput;
}

interface BanOutput {
  data?: UpdateBanDataInput | null;
}

interface CreateBookDataInput {
  legacyData?: any;
  contents?: any;
  title?: string | null;
  subtitle?: string | null;
  tocTitle?: string | null;
  collectionId: string;
  number?: number | null;
  postIds?: Array<string | null> | null;
  sequenceIds?: Array<string | null> | null;
  displaySequencesAsGrid?: boolean | null;
  hideProgressBar?: boolean | null;
  showChapters?: boolean | null;
}

interface CreateBookInput {
  data: CreateBookDataInput;
}

interface UpdateBookDataInput {
  legacyData?: any;
  contents?: any;
  title?: string | null;
  subtitle?: string | null;
  tocTitle?: string | null;
  collectionId?: string | null;
  number?: number | null;
  postIds?: Array<string | null> | null;
  sequenceIds?: Array<string | null> | null;
  displaySequencesAsGrid?: boolean | null;
  hideProgressBar?: boolean | null;
  showChapters?: boolean | null;
}

interface UpdateBookInput {
  selector: SelectorInput;
  data: UpdateBookDataInput;
}

interface BookOutput {
  data?: UpdateBookDataInput | null;
}

interface CreateChapterDataInput {
  legacyData?: any;
  contents?: any;
  title?: string | null;
  subtitle?: string | null;
  number?: number | null;
  sequenceId?: string | null;
  postIds: Array<string | null>;
}

interface CreateChapterInput {
  data: CreateChapterDataInput;
}

interface UpdateChapterDataInput {
  legacyData?: any;
  contents?: any;
  title?: string | null;
  subtitle?: string | null;
  number?: number | null;
  sequenceId?: string | null;
  postIds?: Array<string | null> | null;
}

interface UpdateChapterInput {
  selector: SelectorInput;
  data: UpdateChapterDataInput;
}

interface ChapterOutput {
  data?: UpdateChapterDataInput | null;
}

interface CreateCollectionDataInput {
  createdAt?: Date | null;
  legacyData?: any;
  contents?: any;
  title: string;
  slug: string;
  gridImageId?: string | null;
  firstPageLink?: string | null;
  hideStartReadingButton?: boolean | null;
  noindex?: boolean | null;
}

interface CreateCollectionInput {
  data: CreateCollectionDataInput;
}

interface UpdateCollectionDataInput {
  createdAt?: Date | null;
  legacyData?: any;
  contents?: any;
  title?: string | null;
  slug?: string | null;
  gridImageId?: string | null;
  firstPageLink?: string | null;
  hideStartReadingButton?: boolean | null;
  noindex?: boolean | null;
}

interface UpdateCollectionInput {
  selector: SelectorInput;
  data: UpdateCollectionDataInput;
}

interface CollectionOutput {
  data?: UpdateCollectionDataInput | null;
}

interface CreateCommentModeratorActionDataInput {
  legacyData?: any;
  commentId?: string | null;
  type: string;
  endedAt?: Date | null;
}

interface CreateCommentModeratorActionInput {
  data: CreateCommentModeratorActionDataInput;
}

interface UpdateCommentModeratorActionDataInput {
  legacyData?: any;
  commentId?: string | null;
  type?: string | null;
  endedAt?: Date | null;
}

interface UpdateCommentModeratorActionInput {
  selector: SelectorInput;
  data: UpdateCommentModeratorActionDataInput;
}

interface CommentModeratorActionOutput {
  data?: UpdateCommentModeratorActionDataInput | null;
}

interface CreateCommentDataInput {
  legacyData?: any;
  contents?: any;
  parentCommentId?: string | null;
  topLevelCommentId?: string | null;
  postId?: string | null;
  tagId?: string | null;
  forumEventId?: string | null;
  forumEventMetadata?: any;
  tagCommentType?: string | null;
  subforumStickyPriority?: number | null;
  userId?: string | null;
  authorIsUnreviewed?: boolean | null;
  answer?: boolean | null;
  parentAnswerId?: string | null;
  shortform?: boolean | null;
  shortformFrontpage?: boolean | null;
  nominatedForReview?: string | null;
  reviewingForReview?: string | null;
  promotedByUserId?: string | null;
  hideKarma?: boolean | null;
  legacy?: boolean | null;
  legacyId?: string | null;
  legacyPoll?: boolean | null;
  legacyParentId?: string | null;
  retracted?: boolean | null;
  deleted?: boolean | null;
  deletedPublic?: boolean | null;
  deletedReason?: string | null;
  deletedDate?: Date | null;
  deletedByUserId?: string | null;
  spam?: boolean | null;
  needsReview?: boolean | null;
  reviewedByUserId?: string | null;
  moderatorHat?: boolean | null;
  hideModeratorHat?: boolean | null;
  isPinnedOnProfile?: boolean | null;
  title?: string | null;
  relevantTagIds?: Array<string | null> | null;
  debateResponse?: boolean | null;
  rejected?: boolean | null;
  modGPTAnalysis?: string | null;
  modGPTRecommendation?: string | null;
  rejectedReason?: string | null;
  rejectedByUserId?: string | null;
  af?: boolean | null;
  afDate?: Date | null;
  agentFoundationsId?: string | null;
  originalDialogueId?: string | null;
}

interface CreateCommentInput {
  data: CreateCommentDataInput;
}

interface UpdateCommentDataInput {
  legacyData?: any;
  contents?: any;
  subforumStickyPriority?: number | null;
  authorIsUnreviewed?: boolean | null;
  answer?: boolean | null;
  shortform?: boolean | null;
  shortformFrontpage?: boolean | null;
  nominatedForReview?: string | null;
  reviewingForReview?: string | null;
  promoted?: boolean | null;
  promotedByUserId?: string | null;
  hideKarma?: boolean | null;
  legacy?: boolean | null;
  legacyId?: string | null;
  legacyPoll?: boolean | null;
  legacyParentId?: string | null;
  retracted?: boolean | null;
  deleted?: boolean | null;
  deletedPublic?: boolean | null;
  deletedReason?: string | null;
  deletedDate?: Date | null;
  deletedByUserId?: string | null;
  spam?: boolean | null;
  repliesBlockedUntil?: Date | null;
  needsReview?: boolean | null;
  reviewedByUserId?: string | null;
  hideAuthor?: boolean | null;
  moderatorHat?: boolean | null;
  hideModeratorHat?: boolean | null;
  isPinnedOnProfile?: boolean | null;
  title?: string | null;
  relevantTagIds?: Array<string | null> | null;
  debateResponse?: boolean | null;
  rejected?: boolean | null;
  modGPTAnalysis?: string | null;
  modGPTRecommendation?: string | null;
  rejectedReason?: string | null;
  rejectedByUserId?: string | null;
  af?: boolean | null;
  suggestForAlignmentUserIds?: Array<string | null> | null;
  reviewForAlignmentUserId?: string | null;
  afDate?: Date | null;
  moveToAlignmentUserId?: string | null;
  agentFoundationsId?: string | null;
  originalDialogueId?: string | null;
}

interface UpdateCommentInput {
  selector: SelectorInput;
  data: UpdateCommentDataInput;
}

interface CommentOutput {
  data?: UpdateCommentDataInput | null;
}

interface CreateConversationDataInput {
  legacyData?: any;
  title?: string | null;
  participantIds?: Array<string | null> | null;
  af?: boolean | null;
  moderator?: boolean | null;
  archivedByIds?: Array<string | null> | null;
}

interface CreateConversationInput {
  data: CreateConversationDataInput;
}

interface UpdateConversationDataInput {
  legacyData?: any;
  title?: string | null;
  participantIds?: Array<string | null> | null;
  af?: boolean | null;
  moderator?: boolean | null;
  archivedByIds?: Array<string | null> | null;
}

interface UpdateConversationInput {
  selector: SelectorInput;
  data: UpdateConversationDataInput;
}

interface ConversationOutput {
  data?: UpdateConversationDataInput | null;
}

interface CreateCurationNoticeDataInput {
  legacyData?: any;
  contents?: any;
  userId: string;
  commentId?: string | null;
  postId: string;
}

interface CreateCurationNoticeInput {
  data: CreateCurationNoticeDataInput;
}

interface UpdateCurationNoticeDataInput {
  legacyData?: any;
  contents?: any;
  commentId?: string | null;
  deleted?: boolean | null;
}

interface UpdateCurationNoticeInput {
  selector: SelectorInput;
  data: UpdateCurationNoticeDataInput;
}

interface CurationNoticeOutput {
  data?: UpdateCurationNoticeDataInput | null;
}

interface CreateDialogueMatchPreferenceDataInput {
  legacyData?: any;
  dialogueCheckId: string;
  topicPreferences: Array<any>;
  topicNotes: string;
  syncPreference: string;
  asyncPreference: string;
  formatNotes: string;
  calendlyLink?: string | null;
  generatedDialogueId?: string | null;
  deleted?: boolean | null;
}

interface CreateDialogueMatchPreferenceInput {
  data: CreateDialogueMatchPreferenceDataInput;
}

interface UpdateDialogueMatchPreferenceDataInput {
  legacyData?: any;
  dialogueCheckId?: string | null;
  topicPreferences?: Array<any> | null;
  topicNotes?: string | null;
  syncPreference?: string | null;
  asyncPreference?: string | null;
  formatNotes?: string | null;
  calendlyLink?: string | null;
  generatedDialogueId?: string | null;
  deleted?: boolean | null;
}

interface UpdateDialogueMatchPreferenceInput {
  selector: SelectorInput;
  data: UpdateDialogueMatchPreferenceDataInput;
}

interface DialogueMatchPreferenceOutput {
  data?: UpdateDialogueMatchPreferenceDataInput | null;
}

interface CreateDigestPostDataInput {
  legacyData?: any;
  digestId: string;
  postId: string;
  emailDigestStatus?: string | null;
  onsiteDigestStatus?: string | null;
}

interface CreateDigestPostInput {
  data: CreateDigestPostDataInput;
}

interface UpdateDigestPostDataInput {
  legacyData?: any;
  digestId?: string | null;
  postId?: string | null;
  emailDigestStatus?: string | null;
  onsiteDigestStatus?: string | null;
}

interface UpdateDigestPostInput {
  selector: SelectorInput;
  data: UpdateDigestPostDataInput;
}

interface DigestPostOutput {
  data?: UpdateDigestPostDataInput | null;
}

interface CreateDigestDataInput {
  legacyData?: any;
  num: number;
  startDate: Date;
  endDate?: Date | null;
  publishedDate?: Date | null;
  onsiteImageId?: string | null;
  onsitePrimaryColor?: string | null;
}

interface CreateDigestInput {
  data: CreateDigestDataInput;
}

interface UpdateDigestDataInput {
  legacyData?: any;
  num?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  publishedDate?: Date | null;
  onsiteImageId?: string | null;
  onsitePrimaryColor?: string | null;
}

interface UpdateDigestInput {
  selector: SelectorInput;
  data: UpdateDigestDataInput;
}

interface DigestOutput {
  data?: UpdateDigestDataInput | null;
}

interface CreateElectionCandidateDataInput {
  legacyData?: any;
  electionName: string;
  name: string;
  logoSrc: string;
  href: string;
  fundraiserLink?: string | null;
  gwwcLink?: string | null;
  gwwcId?: string | null;
  description: string;
  userId?: string | null;
  tagId: string;
  isElectionFundraiser?: boolean | null;
  amountRaised?: number | null;
  targetAmount?: number | null;
}

interface CreateElectionCandidateInput {
  data: CreateElectionCandidateDataInput;
}

interface UpdateElectionCandidateDataInput {
  legacyData?: any;
  electionName?: string | null;
  name?: string | null;
  logoSrc?: string | null;
  href?: string | null;
  fundraiserLink?: string | null;
  gwwcLink?: string | null;
  gwwcId?: string | null;
  description?: string | null;
  userId?: string | null;
  tagId?: string | null;
  isElectionFundraiser?: boolean | null;
  amountRaised?: number | null;
  targetAmount?: number | null;
}

interface UpdateElectionCandidateInput {
  selector: SelectorInput;
  data: UpdateElectionCandidateDataInput;
}

interface ElectionCandidateOutput {
  data?: UpdateElectionCandidateDataInput | null;
}

interface CreateElectionVoteDataInput {
  legacyData?: any;
  electionName: string;
  userId: string;
  compareState?: any;
  vote?: any;
  submittedAt?: Date | null;
  submissionComments?: any;
  userExplanation?: string | null;
  userOtherComments?: string | null;
}

interface CreateElectionVoteInput {
  data: CreateElectionVoteDataInput;
}

interface UpdateElectionVoteDataInput {
  legacyData?: any;
  electionName?: string | null;
  userId?: string | null;
  compareState?: any;
  vote?: any;
  submittedAt?: Date | null;
  submissionComments?: any;
  userExplanation?: string | null;
  userOtherComments?: string | null;
}

interface UpdateElectionVoteInput {
  selector: SelectorInput;
  data: UpdateElectionVoteDataInput;
}

interface ElectionVoteOutput {
  data?: UpdateElectionVoteDataInput | null;
}

interface CreateElicitQuestionDataInput {
  legacyData?: any;
  title: string;
  notes?: string | null;
  resolution?: string | null;
  resolvesBy?: Date | null;
}

interface CreateElicitQuestionInput {
  data: CreateElicitQuestionDataInput;
}

interface UpdateElicitQuestionDataInput {
  legacyData?: any;
  title?: string | null;
  notes?: string | null;
  resolution?: string | null;
  resolvesBy?: Date | null;
}

interface UpdateElicitQuestionInput {
  selector: SelectorInput;
  data: UpdateElicitQuestionDataInput;
}

interface ElicitQuestionOutput {
  data?: UpdateElicitQuestionDataInput | null;
}

interface CreateForumEventDataInput {
  legacyData?: any;
  frontpageDescription?: any;
  frontpageDescriptionMobile?: any;
  postPageDescription?: any;
  title: string;
  startDate: Date;
  endDate: Date;
  darkColor: string;
  lightColor: string;
  bannerTextColor: string;
  contrastColor?: string | null;
  tagId?: string | null;
  postId?: string | null;
  bannerImageId?: string | null;
  includesPoll?: boolean | null;
  eventFormat?: string | null;
  pollQuestion?: any;
  pollAgreeWording?: string | null;
  pollDisagreeWording?: string | null;
  maxStickersPerUser?: number | null;
  customComponent?: string | null;
  commentPrompt?: string | null;
  publicData?: any;
}

interface CreateForumEventInput {
  data: CreateForumEventDataInput;
}

interface UpdateForumEventDataInput {
  legacyData?: any;
  frontpageDescription?: any;
  frontpageDescriptionMobile?: any;
  postPageDescription?: any;
  title?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  darkColor?: string | null;
  lightColor?: string | null;
  bannerTextColor?: string | null;
  contrastColor?: string | null;
  tagId?: string | null;
  postId?: string | null;
  bannerImageId?: string | null;
  includesPoll?: boolean | null;
  eventFormat?: string | null;
  pollQuestion?: any;
  pollAgreeWording?: string | null;
  pollDisagreeWording?: string | null;
  maxStickersPerUser?: number | null;
  customComponent?: string | null;
  commentPrompt?: string | null;
}

interface UpdateForumEventInput {
  selector: SelectorInput;
  data: UpdateForumEventDataInput;
}

interface ForumEventOutput {
  data?: UpdateForumEventDataInput | null;
}

interface CreateGardenCodeDataInput {
  legacyData?: any;
  contents?: any;
  slug?: string | null;
  title: string;
  startTime?: Date | null;
  fbLink?: string | null;
  type?: string | null;
  afOnly?: boolean | null;
}

interface CreateGardenCodeInput {
  data: CreateGardenCodeDataInput;
}

interface UpdateGardenCodeDataInput {
  legacyData?: any;
  contents?: any;
  slug?: string | null;
  title?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  fbLink?: string | null;
  type?: string | null;
  hidden?: boolean | null;
  deleted?: boolean | null;
  afOnly?: boolean | null;
}

interface UpdateGardenCodeInput {
  selector: SelectorInput;
  data: UpdateGardenCodeDataInput;
}

interface GardenCodeOutput {
  data?: UpdateGardenCodeDataInput | null;
}

interface CreateGoogleServiceAccountSessionDataInput {
  legacyData?: any;
  email: string;
  refreshToken: string;
  estimatedExpiry: Date;
  active: boolean;
  revoked: boolean;
}

interface CreateGoogleServiceAccountSessionInput {
  data: CreateGoogleServiceAccountSessionDataInput;
}

interface UpdateGoogleServiceAccountSessionDataInput {
  legacyData?: any;
  email?: string | null;
  refreshToken?: string | null;
  estimatedExpiry?: Date | null;
  active?: boolean | null;
  revoked?: boolean | null;
}

interface UpdateGoogleServiceAccountSessionInput {
  selector: SelectorInput;
  data: UpdateGoogleServiceAccountSessionDataInput;
}

interface GoogleServiceAccountSessionOutput {
  data?: UpdateGoogleServiceAccountSessionDataInput | null;
}

interface CreateJargonTermDataInput {
  legacyData?: any;
  contents?: any;
  postId: string;
  term: string;
  approved?: boolean | null;
  deleted?: boolean | null;
  altTerms: Array<string | null>;
}

interface CreateJargonTermInput {
  data: CreateJargonTermDataInput;
}

interface UpdateJargonTermDataInput {
  legacyData?: any;
  contents?: any;
  term?: string | null;
  approved?: boolean | null;
  deleted?: boolean | null;
  altTerms?: Array<string | null> | null;
}

interface UpdateJargonTermInput {
  selector: SelectorInput;
  data: UpdateJargonTermDataInput;
}

interface JargonTermOutput {
  data?: UpdateJargonTermDataInput | null;
}

interface CreateLWEventDataInput {
  legacyData?: any;
  userId?: string | null;
  name: string;
  documentId?: string | null;
  important?: boolean | null;
  properties?: any;
  intercom?: boolean | null;
}

interface CreateLWEventInput {
  data: CreateLWEventDataInput;
}

interface UpdateLWEventDataInput {
  legacyData?: any;
  important?: boolean | null;
}

interface UpdateLWEventInput {
  selector: SelectorInput;
  data: UpdateLWEventDataInput;
}

interface LWEventOutput {
  data?: UpdateLWEventDataInput | null;
}

interface UpdateLlmConversationDataInput {
  legacyData?: any;
  userId?: string | null;
  title?: string | null;
  model?: string | null;
  systemPrompt?: string | null;
  deleted?: boolean | null;
}

interface UpdateLlmConversationInput {
  selector: SelectorInput;
  data: UpdateLlmConversationDataInput;
}

interface LlmConversationOutput {
  data?: UpdateLlmConversationDataInput | null;
}

interface CreateLocalgroupDataInput {
  legacyData?: any;
  contents?: any;
  name: string;
  nameInAnotherLanguage?: string | null;
  organizerIds: Array<string | null>;
  lastActivity?: Date | null;
  types: Array<string | null>;
  categories?: Array<string | null> | null;
  isOnline?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  contactInfo?: string | null;
  facebookLink?: string | null;
  facebookPageLink?: string | null;
  meetupLink?: string | null;
  slackLink?: string | null;
  website?: string | null;
  bannerImageId?: string | null;
  inactive?: boolean | null;
  deleted?: boolean | null;
}

interface CreateLocalgroupInput {
  data: CreateLocalgroupDataInput;
}

interface UpdateLocalgroupDataInput {
  legacyData?: any;
  contents?: any;
  name?: string | null;
  nameInAnotherLanguage?: string | null;
  organizerIds?: Array<string | null> | null;
  lastActivity?: Date | null;
  types?: Array<string | null> | null;
  categories?: Array<string | null> | null;
  isOnline?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  contactInfo?: string | null;
  facebookLink?: string | null;
  facebookPageLink?: string | null;
  meetupLink?: string | null;
  slackLink?: string | null;
  website?: string | null;
  bannerImageId?: string | null;
  inactive?: boolean | null;
  deleted?: boolean | null;
}

interface UpdateLocalgroupInput {
  selector: SelectorInput;
  data: UpdateLocalgroupDataInput;
}

interface LocalgroupOutput {
  data?: UpdateLocalgroupDataInput | null;
}

interface CreateMessageDataInput {
  legacyData?: any;
  contents?: any;
  userId?: string | null;
  conversationId: string;
  noEmail?: boolean | null;
}

interface CreateMessageInput {
  data: CreateMessageDataInput;
}

interface UpdateMessageDataInput {
  legacyData?: any;
  contents?: any;
}

interface UpdateMessageInput {
  selector: SelectorInput;
  data: UpdateMessageDataInput;
}

interface MessageOutput {
  data?: UpdateMessageDataInput | null;
}

interface CreateModerationTemplateDataInput {
  legacyData?: any;
  contents?: any;
  name: string;
  collectionName: string;
  order?: number | null;
}

interface CreateModerationTemplateInput {
  data: CreateModerationTemplateDataInput;
}

interface UpdateModerationTemplateDataInput {
  legacyData?: any;
  contents?: any;
  name?: string | null;
  collectionName?: string | null;
  order?: number | null;
  deleted?: boolean | null;
}

interface UpdateModerationTemplateInput {
  selector: SelectorInput;
  data: UpdateModerationTemplateDataInput;
}

interface ModerationTemplateOutput {
  data?: UpdateModerationTemplateDataInput | null;
}

interface CreateModeratorActionDataInput {
  legacyData?: any;
  userId?: string | null;
  type: string;
  endedAt?: Date | null;
}

interface CreateModeratorActionInput {
  data: CreateModeratorActionDataInput;
}

interface UpdateModeratorActionDataInput {
  legacyData?: any;
  userId?: string | null;
  type?: string | null;
  endedAt?: Date | null;
}

interface UpdateModeratorActionInput {
  selector: SelectorInput;
  data: UpdateModeratorActionDataInput;
}

interface ModeratorActionOutput {
  data?: UpdateModeratorActionDataInput | null;
}

interface CreateMultiDocumentDataInput {
  legacyData?: any;
  contents?: any;
  slug?: string | null;
  title?: string | null;
  tabTitle: string;
  tabSubtitle?: string | null;
  userId?: string | null;
  parentDocumentId: string;
  collectionName: string;
  fieldName: string;
}

interface CreateMultiDocumentInput {
  data: CreateMultiDocumentDataInput;
}

interface UpdateMultiDocumentDataInput {
  legacyData?: any;
  contents?: any;
  slug?: string | null;
  title?: string | null;
  tabTitle?: string | null;
  tabSubtitle?: string | null;
  index?: number | null;
  deleted?: boolean | null;
}

interface UpdateMultiDocumentInput {
  selector: SelectorInput;
  data: UpdateMultiDocumentDataInput;
}

interface MultiDocumentOutput {
  data?: UpdateMultiDocumentDataInput | null;
}

interface CreateNotificationDataInput {
  legacyData?: any;
  viewed?: boolean | null;
}

interface CreateNotificationInput {
  data: CreateNotificationDataInput;
}

interface UpdateNotificationDataInput {
  legacyData?: any;
  viewed?: boolean | null;
}

interface UpdateNotificationInput {
  selector: SelectorInput;
  data: UpdateNotificationDataInput;
}

interface NotificationOutput {
  data?: UpdateNotificationDataInput | null;
}

interface CreatePetrovDayActionDataInput {
  legacyData?: any;
  actionType: string;
  data?: any;
  userId: string;
}

interface CreatePetrovDayActionInput {
  data: CreatePetrovDayActionDataInput;
}

interface PetrovDayActionOutput {
  data?: UpdatePetrovDayActionDataInput | null;
}

interface CreatePodcastEpisodeDataInput {
  legacyData?: any;
  podcastId?: string | null;
  title: string;
  episodeLink: string;
  externalEpisodeId: string;
}

interface CreatePodcastEpisodeInput {
  data: CreatePodcastEpisodeDataInput;
}

interface UpdatePodcastEpisodeDataInput {
  legacyData?: any;
}

interface UpdatePodcastEpisodeInput {
  selector: SelectorInput;
  data: UpdatePodcastEpisodeDataInput;
}

interface PodcastEpisodeOutput {
  data?: UpdatePodcastEpisodeDataInput | null;
}

interface CreatePostEmbeddingDataInput {
  legacyData?: any;
  postId: string;
  postHash: string;
  lastGeneratedAt: Date;
  model: string;
  embeddings: Array<number | null>;
}

interface CreatePostEmbeddingInput {
  data: CreatePostEmbeddingDataInput;
}

interface UpdatePostEmbeddingDataInput {
  legacyData?: any;
  postId?: string | null;
  postHash?: string | null;
  lastGeneratedAt?: Date | null;
  model?: string | null;
  embeddings?: Array<number | null> | null;
}

interface UpdatePostEmbeddingInput {
  selector: SelectorInput;
  data: UpdatePostEmbeddingDataInput;
}

interface PostEmbeddingOutput {
  data?: UpdatePostEmbeddingDataInput | null;
}

interface CreatePostViewTimeDataInput {
  legacyData?: any;
}

interface CreatePostViewTimeInput {
  data: CreatePostViewTimeDataInput;
}

interface UpdatePostViewTimeDataInput {
  legacyData?: any;
}

interface UpdatePostViewTimeInput {
  selector: SelectorInput;
  data: UpdatePostViewTimeDataInput;
}

interface PostViewTimeOutput {
  data?: UpdatePostViewTimeDataInput | null;
}

interface CreatePostViewsDataInput {
  legacyData?: any;
}

interface CreatePostViewsInput {
  data: CreatePostViewsDataInput;
}

interface UpdatePostViewsDataInput {
  legacyData?: any;
}

interface UpdatePostViewsInput {
  selector: SelectorInput;
  data: UpdatePostViewsDataInput;
}

interface PostViewsOutput {
  data?: PostViews | null;
}

interface CreatePostDataInput {
  legacyData?: any;
  contents?: any;
  moderationGuidelines?: any;
  customHighlight?: any;
  slug?: string | null;
  postedAt?: Date | null;
  url?: string | null;
  postCategory?: string | null;
  title: string;
  status?: number | null;
  sticky?: boolean | null;
  stickyPriority?: number | null;
  userId?: string | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  readTimeMinutesOverride?: number | null;
  submitToFrontpage?: boolean | null;
  hiddenRelatedQuestion?: boolean | null;
  originalPostRelationSourceId?: string | null;
  shortform?: boolean | null;
  canonicalSource?: string | null;
  manifoldReviewMarketId?: string | null;
  tagRelevance?: any;
  noIndex?: boolean | null;
  activateRSVPs?: boolean | null;
  nextDayReminderSent?: boolean | null;
  onlyVisibleToLoggedIn?: boolean | null;
  onlyVisibleToEstablishedAccounts?: boolean | null;
  hideFromRecentDiscussions?: boolean | null;
  podcastEpisodeId?: string | null;
  forceAllowType3Audio?: boolean | null;
  legacy?: boolean | null;
  legacyId?: string | null;
  legacySpam?: boolean | null;
  feedId?: string | null;
  feedLink?: string | null;
  curatedDate?: Date | null;
  metaDate?: Date | null;
  suggestForCuratedUserIds?: Array<string | null> | null;
  frontpageDate?: Date | null;
  autoFrontpage?: string | null;
  collectionTitle?: string | null;
  coauthorStatuses?: Array<any> | null;
  hasCoauthorPermission?: boolean | null;
  socialPreviewImageId?: string | null;
  socialPreviewImageAutoUrl?: string | null;
  socialPreview?: any;
  fmCrosspost?: any;
  canonicalSequenceId?: string | null;
  canonicalCollectionSlug?: string | null;
  canonicalBookId?: string | null;
  canonicalNextPostSlug?: string | null;
  canonicalPrevPostSlug?: string | null;
  unlisted?: boolean | null;
  disableRecommendation?: boolean | null;
  defaultRecommendation?: boolean | null;
  hideFromPopularComments?: boolean | null;
  draft?: boolean | null;
  wasEverUndrafted?: boolean | null;
  meta?: boolean | null;
  hideFrontpageComments?: boolean | null;
  bannedUserIds?: Array<string | null> | null;
  commentsLocked?: boolean | null;
  commentsLockedToAccountsCreatedAfter?: Date | null;
  organizerIds?: Array<string | null> | null;
  groupId?: string | null;
  eventType?: string | null;
  isEvent?: boolean | null;
  reviewedByUserId?: string | null;
  reviewForCuratedUserId?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  eventRegistrationLink?: string | null;
  joinEventLink?: string | null;
  onlineEvent?: boolean | null;
  globalEvent?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  contactInfo?: string | null;
  facebookLink?: string | null;
  meetupLink?: string | null;
  website?: string | null;
  eventImageId?: string | null;
  types?: Array<string | null> | null;
  metaSticky?: boolean | null;
  sharingSettings?: any;
  shareWithUsers?: Array<string | null> | null;
  commentSortOrder?: string | null;
  hideAuthor?: boolean | null;
  sideCommentVisibility?: string | null;
  disableSidenotes?: boolean | null;
  moderationStyle?: string | null;
  ignoreRateLimits?: boolean | null;
  hideCommentKarma?: boolean | null;
  collabEditorDialogue?: boolean | null;
  rejected?: boolean | null;
  rejectedReason?: string | null;
  rejectedByUserId?: string | null;
  subforumTagId?: string | null;
  af?: boolean | null;
  afDate?: Date | null;
  afSticky?: boolean | null;
  suggestForAlignmentUserIds?: Array<string | null> | null;
  reviewForAlignmentUserId?: string | null;
  agentFoundationsId?: string | null;
  swrCachingEnabled?: boolean | null;
  generateDraftJargon?: boolean | null;
}

interface CreatePostInput {
  data: CreatePostDataInput;
}

interface UpdatePostDataInput {
  legacyData?: any;
  contents?: any;
  moderationGuidelines?: any;
  customHighlight?: any;
  slug?: string | null;
  postedAt?: Date | null;
  url?: string | null;
  postCategory?: string | null;
  title?: string | null;
  deletedDraft?: boolean | null;
  status?: number | null;
  sticky?: boolean | null;
  stickyPriority?: number | null;
  userId?: string | null;
  question?: boolean | null;
  authorIsUnreviewed?: boolean | null;
  readTimeMinutesOverride?: number | null;
  submitToFrontpage?: boolean | null;
  hiddenRelatedQuestion?: boolean | null;
  shortform?: boolean | null;
  canonicalSource?: string | null;
  manifoldReviewMarketId?: string | null;
  tagRelevance?: any;
  noIndex?: boolean | null;
  activateRSVPs?: boolean | null;
  nextDayReminderSent?: boolean | null;
  onlyVisibleToLoggedIn?: boolean | null;
  onlyVisibleToEstablishedAccounts?: boolean | null;
  hideFromRecentDiscussions?: boolean | null;
  votingSystem?: string | null;
  podcastEpisodeId?: string | null;
  forceAllowType3Audio?: boolean | null;
  legacy?: boolean | null;
  legacyId?: string | null;
  legacySpam?: boolean | null;
  feedId?: string | null;
  feedLink?: string | null;
  curatedDate?: Date | null;
  metaDate?: Date | null;
  suggestForCuratedUserIds?: Array<string | null> | null;
  frontpageDate?: Date | null;
  autoFrontpage?: string | null;
  collectionTitle?: string | null;
  coauthorStatuses?: Array<any> | null;
  hasCoauthorPermission?: boolean | null;
  socialPreviewImageId?: string | null;
  socialPreviewImageAutoUrl?: string | null;
  socialPreview?: any;
  fmCrosspost?: any;
  canonicalSequenceId?: string | null;
  canonicalCollectionSlug?: string | null;
  canonicalBookId?: string | null;
  canonicalNextPostSlug?: string | null;
  canonicalPrevPostSlug?: string | null;
  unlisted?: boolean | null;
  disableRecommendation?: boolean | null;
  defaultRecommendation?: boolean | null;
  hideFromPopularComments?: boolean | null;
  draft?: boolean | null;
  wasEverUndrafted?: boolean | null;
  meta?: boolean | null;
  hideFrontpageComments?: boolean | null;
  bannedUserIds?: Array<string | null> | null;
  commentsLocked?: boolean | null;
  commentsLockedToAccountsCreatedAfter?: Date | null;
  organizerIds?: Array<string | null> | null;
  groupId?: string | null;
  eventType?: string | null;
  isEvent?: boolean | null;
  reviewedByUserId?: string | null;
  reviewForCuratedUserId?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  eventRegistrationLink?: string | null;
  joinEventLink?: string | null;
  onlineEvent?: boolean | null;
  globalEvent?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  contactInfo?: string | null;
  facebookLink?: string | null;
  meetupLink?: string | null;
  website?: string | null;
  eventImageId?: string | null;
  types?: Array<string | null> | null;
  metaSticky?: boolean | null;
  sharingSettings?: any;
  shareWithUsers?: Array<string | null> | null;
  linkSharingKey?: string | null;
  commentSortOrder?: string | null;
  hideAuthor?: boolean | null;
  sideCommentVisibility?: string | null;
  disableSidenotes?: boolean | null;
  moderationStyle?: string | null;
  ignoreRateLimits?: boolean | null;
  hideCommentKarma?: boolean | null;
  collabEditorDialogue?: boolean | null;
  rejected?: boolean | null;
  rejectedReason?: string | null;
  rejectedByUserId?: string | null;
  subforumTagId?: string | null;
  af?: boolean | null;
  afDate?: Date | null;
  afSticky?: boolean | null;
  suggestForAlignmentUserIds?: Array<string | null> | null;
  reviewForAlignmentUserId?: string | null;
  agentFoundationsId?: string | null;
  swrCachingEnabled?: boolean | null;
  generateDraftJargon?: boolean | null;
}

interface UpdatePostInput {
  selector: SelectorInput;
  data: UpdatePostDataInput;
}

interface PostOutput {
  data?: UpdatePostDataInput | null;
}

interface CreateRSSFeedDataInput {
  legacyData?: any;
  userId?: string | null;
  ownedByUser?: boolean | null;
  displayFullContent?: boolean | null;
  nickname?: string | null;
  url?: string | null;
  rawFeed?: any;
  setCanonicalUrl?: boolean | null;
  importAsDraft?: boolean | null;
}

interface CreateRSSFeedInput {
  data: CreateRSSFeedDataInput;
}

interface UpdateRSSFeedDataInput {
  legacyData?: any;
  userId?: string | null;
  ownedByUser?: boolean | null;
  displayFullContent?: boolean | null;
  nickname?: string | null;
  url?: string | null;
  status?: string | null;
  rawFeed?: any;
  setCanonicalUrl?: boolean | null;
  importAsDraft?: boolean | null;
}

interface UpdateRSSFeedInput {
  selector: SelectorInput;
  data: UpdateRSSFeedDataInput;
}

interface RSSFeedOutput {
  data?: UpdateRSSFeedDataInput | null;
}

interface CreateReportDataInput {
  legacyData?: any;
  userId?: string | null;
  reportedUserId?: string | null;
  commentId?: string | null;
  postId?: string | null;
  link: string;
  claimedUserId?: string | null;
  description?: string | null;
  reportedAsSpam?: boolean | null;
}

interface CreateReportInput {
  data: CreateReportDataInput;
}

interface UpdateReportDataInput {
  createdAt?: Date | null;
  legacyData?: any;
  claimedUserId?: string | null;
  description?: string | null;
  closedAt?: Date | null;
  markedAsSpam?: boolean | null;
  reportedAsSpam?: boolean | null;
}

interface UpdateReportInput {
  selector: SelectorInput;
  data: UpdateReportDataInput;
}

interface ReportOutput {
  data?: UpdateReportDataInput | null;
}

interface UpdateRevisionDataInput {
  legacyData?: any;
  skipAttributions?: boolean | null;
}

interface UpdateRevisionInput {
  selector: SelectorInput;
  data: UpdateRevisionDataInput;
}

interface RevisionOutput {
  data?: UpdateRevisionDataInput | null;
}

interface CreateSequenceDataInput {
  legacyData?: any;
  contents?: any;
  lastUpdated?: Date | null;
  userId?: string | null;
  title: string;
  bannerImageId?: string | null;
  gridImageId?: string | null;
  hideFromAuthorPage?: boolean | null;
  draft?: boolean | null;
  isDeleted?: boolean | null;
  curatedOrder?: number | null;
  userProfileOrder?: number | null;
  canonicalCollectionSlug?: string | null;
  hidden?: boolean | null;
  noindex?: boolean | null;
  af?: boolean | null;
}

interface CreateSequenceInput {
  data: CreateSequenceDataInput;
}

interface UpdateSequenceDataInput {
  legacyData?: any;
  contents?: any;
  lastUpdated?: Date | null;
  userId?: string | null;
  title?: string | null;
  bannerImageId?: string | null;
  gridImageId?: string | null;
  hideFromAuthorPage?: boolean | null;
  draft?: boolean | null;
  isDeleted?: boolean | null;
  curatedOrder?: number | null;
  userProfileOrder?: number | null;
  canonicalCollectionSlug?: string | null;
  hidden?: boolean | null;
  noindex?: boolean | null;
  af?: boolean | null;
}

interface UpdateSequenceInput {
  selector: SelectorInput;
  data: UpdateSequenceDataInput;
}

interface SequenceOutput {
  data?: UpdateSequenceDataInput | null;
}

interface CreateSplashArtCoordinateDataInput {
  legacyData?: any;
  reviewWinnerArtId: string;
  leftXPct: number;
  leftYPct: number;
  leftHeightPct: number;
  leftWidthPct: number;
  leftFlipped?: boolean | null;
  middleXPct: number;
  middleYPct: number;
  middleHeightPct: number;
  middleWidthPct: number;
  middleFlipped?: boolean | null;
  rightXPct: number;
  rightYPct: number;
  rightHeightPct: number;
  rightWidthPct: number;
  rightFlipped: boolean;
}

interface CreateSplashArtCoordinateInput {
  data: CreateSplashArtCoordinateDataInput;
}

interface UpdateSplashArtCoordinateDataInput {
  legacyData?: any;
  reviewWinnerArtId?: string | null;
  leftXPct?: number | null;
  leftYPct?: number | null;
  leftHeightPct?: number | null;
  leftWidthPct?: number | null;
  leftFlipped?: boolean | null;
  middleXPct?: number | null;
  middleYPct?: number | null;
  middleHeightPct?: number | null;
  middleWidthPct?: number | null;
  middleFlipped?: boolean | null;
  rightXPct?: number | null;
  rightYPct?: number | null;
  rightHeightPct?: number | null;
  rightWidthPct?: number | null;
  rightFlipped?: boolean | null;
}

interface UpdateSplashArtCoordinateInput {
  selector: SelectorInput;
  data: UpdateSplashArtCoordinateDataInput;
}

interface SplashArtCoordinateOutput {
  data?: UpdateSplashArtCoordinateDataInput | null;
}

interface CreateSpotlightDataInput {
  legacyData?: any;
  description?: any;
  documentId: string;
  documentType: string;
  position?: number | null;
  duration: number;
  customTitle?: string | null;
  customSubtitle?: string | null;
  subtitleUrl?: string | null;
  headerTitle?: string | null;
  headerTitleLeftColor?: string | null;
  headerTitleRightColor?: string | null;
  lastPromotedAt: Date;
  spotlightSplashImageUrl?: string | null;
  draft: boolean;
  showAuthor?: boolean | null;
  imageFade?: boolean | null;
  imageFadeColor?: string | null;
  spotlightImageId?: string | null;
  spotlightDarkImageId?: string | null;
}

interface CreateSpotlightInput {
  data: CreateSpotlightDataInput;
}

interface UpdateSpotlightDataInput {
  legacyData?: any;
  description?: any;
  documentId?: string | null;
  documentType?: string | null;
  position?: number | null;
  duration?: number | null;
  customTitle?: string | null;
  customSubtitle?: string | null;
  subtitleUrl?: string | null;
  headerTitle?: string | null;
  headerTitleLeftColor?: string | null;
  headerTitleRightColor?: string | null;
  lastPromotedAt?: Date | null;
  spotlightSplashImageUrl?: string | null;
  draft?: boolean | null;
  deletedDraft?: boolean | null;
  showAuthor?: boolean | null;
  imageFade?: boolean | null;
  imageFadeColor?: string | null;
  spotlightImageId?: string | null;
  spotlightDarkImageId?: string | null;
}

interface UpdateSpotlightInput {
  selector: SelectorInput;
  data: UpdateSpotlightDataInput;
}

interface SpotlightOutput {
  data?: UpdateSpotlightDataInput | null;
}

interface CreateSubscriptionDataInput {
  legacyData?: any;
  state: string;
  documentId: string;
  collectionName: string;
  type: string;
}

interface CreateSubscriptionInput {
  data: CreateSubscriptionDataInput;
}

interface SubscriptionOutput {
  data?: UpdateSubscriptionDataInput | null;
}

interface CreateSurveyQuestionDataInput {
  legacyData?: any;
  surveyId: string;
  question: string;
  format: string;
  order: number;
}

interface CreateSurveyQuestionInput {
  data: CreateSurveyQuestionDataInput;
}

interface UpdateSurveyQuestionDataInput {
  legacyData?: any;
  surveyId?: string | null;
  question?: string | null;
  format?: string | null;
  order?: number | null;
}

interface UpdateSurveyQuestionInput {
  selector: SelectorInput;
  data: UpdateSurveyQuestionDataInput;
}

interface SurveyQuestionOutput {
  data?: UpdateSurveyQuestionDataInput | null;
}

interface CreateSurveyResponseDataInput {
  legacyData?: any;
  surveyId: string;
  surveyScheduleId: string;
  userId: string;
  clientId: string;
  response?: any;
}

interface CreateSurveyResponseInput {
  data: CreateSurveyResponseDataInput;
}

interface UpdateSurveyResponseDataInput {
  legacyData?: any;
  surveyId?: string | null;
  surveyScheduleId?: string | null;
  userId?: string | null;
  clientId?: string | null;
  response?: any;
}

interface UpdateSurveyResponseInput {
  selector: SelectorInput;
  data: UpdateSurveyResponseDataInput;
}

interface SurveyResponseOutput {
  data?: UpdateSurveyResponseDataInput | null;
}

interface CreateSurveyScheduleDataInput {
  legacyData?: any;
  surveyId: string;
  name: string;
  impressionsLimit?: number | null;
  maxVisitorPercentage?: number | null;
  minKarma?: number | null;
  maxKarma?: number | null;
  target: string;
  startDate?: Date | null;
  endDate?: Date | null;
  deactivated?: boolean | null;
  clientIds: Array<string | null>;
}

interface CreateSurveyScheduleInput {
  data: CreateSurveyScheduleDataInput;
}

interface UpdateSurveyScheduleDataInput {
  legacyData?: any;
  surveyId?: string | null;
  name?: string | null;
  impressionsLimit?: number | null;
  maxVisitorPercentage?: number | null;
  minKarma?: number | null;
  maxKarma?: number | null;
  target?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  deactivated?: boolean | null;
  clientIds?: Array<string | null> | null;
}

interface UpdateSurveyScheduleInput {
  selector: SelectorInput;
  data: UpdateSurveyScheduleDataInput;
}

interface SurveyScheduleOutput {
  data?: UpdateSurveyScheduleDataInput | null;
}

interface CreateSurveyDataInput {
  legacyData?: any;
  name: string;
}

interface CreateSurveyInput {
  data: CreateSurveyDataInput;
}

interface UpdateSurveyDataInput {
  legacyData?: any;
  name?: string | null;
}

interface UpdateSurveyInput {
  selector: SelectorInput;
  data: UpdateSurveyDataInput;
}

interface SurveyOutput {
  data?: UpdateSurveyDataInput | null;
}

interface CreateTagFlagDataInput {
  legacyData?: any;
  contents?: any;
  slug?: string | null;
  name: string;
  deleted?: boolean | null;
  order?: number | null;
}

interface CreateTagFlagInput {
  data: CreateTagFlagDataInput;
}

interface UpdateTagFlagDataInput {
  legacyData?: any;
  contents?: any;
  slug?: string | null;
  name?: string | null;
  deleted?: boolean | null;
  order?: number | null;
}

interface UpdateTagFlagInput {
  selector: SelectorInput;
  data: UpdateTagFlagDataInput;
}

interface TagFlagOutput {
  data?: UpdateTagFlagDataInput | null;
}

interface CreateTagRelDataInput {
  legacyData?: any;
  tagId: string;
  postId: string;
  userId: string;
}

interface CreateTagRelInput {
  data: CreateTagRelDataInput;
}

interface UpdateTagRelDataInput {
  legacyData?: any;
  deleted?: boolean | null;
}

interface UpdateTagRelInput {
  selector: SelectorInput;
  data: UpdateTagRelDataInput;
}

interface TagRelOutput {
  data?: UpdateTagRelDataInput | null;
}

interface CreateTagDataInput {
  legacyData?: any;
  description?: any;
  subforumWelcomeText?: any;
  moderationGuidelines?: any;
  slug?: string | null;
  name: string;
  shortName?: string | null;
  subtitle?: string | null;
  core?: boolean | null;
  isPostType?: boolean | null;
  suggestedAsFilter?: boolean | null;
  defaultOrder?: number | null;
  descriptionTruncationCount?: number | null;
  adminOnly?: boolean | null;
  canEditUserIds?: Array<string | null> | null;
  reviewedByUserId?: string | null;
  wikiGrade?: number | null;
  wikiOnly?: boolean | null;
  bannerImageId?: string | null;
  squareImageId?: string | null;
  tagFlagsIds?: Array<string | null> | null;
  introSequenceId?: string | null;
  postsDefaultSortOrder?: string | null;
  canVoteOnRels?: Array<string | null> | null;
  isSubforum?: boolean | null;
  subforumModeratorIds?: Array<string | null> | null;
  subforumIntroPostId?: string | null;
  parentTagId?: string | null;
  subTagIds?: Array<string | null> | null;
  autoTagModel?: string | null;
  autoTagPrompt?: string | null;
  coreTagId?: string | null;
  forceAllowType3Audio?: boolean | null;
}

interface CreateTagInput {
  data: CreateTagDataInput;
}

interface UpdateTagDataInput {
  legacyData?: any;
  description?: any;
  subforumWelcomeText?: any;
  moderationGuidelines?: any;
  slug?: string | null;
  name?: string | null;
  shortName?: string | null;
  subtitle?: string | null;
  core?: boolean | null;
  isPostType?: boolean | null;
  suggestedAsFilter?: boolean | null;
  defaultOrder?: number | null;
  descriptionTruncationCount?: number | null;
  adminOnly?: boolean | null;
  canEditUserIds?: Array<string | null> | null;
  deleted?: boolean | null;
  needsReview?: boolean | null;
  reviewedByUserId?: string | null;
  wikiGrade?: number | null;
  wikiOnly?: boolean | null;
  bannerImageId?: string | null;
  squareImageId?: string | null;
  tagFlagsIds?: Array<string | null> | null;
  introSequenceId?: string | null;
  postsDefaultSortOrder?: string | null;
  canVoteOnRels?: Array<string | null> | null;
  isSubforum?: boolean | null;
  subforumModeratorIds?: Array<string | null> | null;
  subforumIntroPostId?: string | null;
  parentTagId?: string | null;
  subTagIds?: Array<string | null> | null;
  autoTagModel?: string | null;
  autoTagPrompt?: string | null;
  noindex?: boolean | null;
  isPlaceholderPage?: boolean | null;
  coreTagId?: string | null;
  forceAllowType3Audio?: boolean | null;
}

interface UpdateTagInput {
  selector: SelectorInput;
  data: UpdateTagDataInput;
}

interface TagOutput {
  data?: UpdateTagDataInput | null;
}

interface CreateUserEAGDetailDataInput {
  legacyData?: any;
  lastUpdated?: Date | null;
}

interface CreateUserEAGDetailInput {
  data: CreateUserEAGDetailDataInput;
}

interface UpdateUserEAGDetailDataInput {
  legacyData?: any;
  careerStage?: Array<string | null> | null;
  countryOrRegion?: string | null;
  nearestCity?: string | null;
  willingnessToRelocate?: any;
  experiencedIn?: Array<string | null> | null;
  interestedIn?: Array<string | null> | null;
  lastUpdated?: Date | null;
}

interface UpdateUserEAGDetailInput {
  selector: SelectorInput;
  data: UpdateUserEAGDetailDataInput;
}

interface UserEAGDetailOutput {
  data?: UpdateUserEAGDetailDataInput | null;
}

interface CreateUserJobAdDataInput {
  legacyData?: any;
  userId: string;
  jobName: string;
  adState: string;
  reminderSetAt?: Date | null;
  lastUpdated?: Date | null;
}

interface CreateUserJobAdInput {
  data: CreateUserJobAdDataInput;
}

interface UpdateUserJobAdDataInput {
  legacyData?: any;
  adState?: string | null;
  reminderSetAt?: Date | null;
  lastUpdated?: Date | null;
}

interface UpdateUserJobAdInput {
  selector: SelectorInput;
  data: UpdateUserJobAdDataInput;
}

interface UserJobAdOutput {
  data?: UpdateUserJobAdDataInput | null;
}

interface CreateUserMostValuablePostDataInput {
  legacyData?: any;
  userId: string;
  postId: string;
  deleted?: boolean | null;
}

interface CreateUserMostValuablePostInput {
  data: CreateUserMostValuablePostDataInput;
}

interface UpdateUserMostValuablePostDataInput {
  legacyData?: any;
  userId?: string | null;
  postId?: string | null;
  deleted?: boolean | null;
}

interface UpdateUserMostValuablePostInput {
  selector: SelectorInput;
  data: UpdateUserMostValuablePostDataInput;
}

interface UserMostValuablePostOutput {
  data?: UpdateUserMostValuablePostDataInput | null;
}

interface CreateUserRateLimitDataInput {
  legacyData?: any;
  userId: string;
  type: string;
  intervalUnit: string;
  intervalLength: number;
  actionsPerInterval: number;
  endedAt?: Date | null;
}

interface CreateUserRateLimitInput {
  data: CreateUserRateLimitDataInput;
}

interface UpdateUserRateLimitDataInput {
  legacyData?: any;
  userId?: string | null;
  type?: string | null;
  intervalUnit?: string | null;
  intervalLength?: number | null;
  actionsPerInterval?: number | null;
  endedAt?: Date | null;
}

interface UpdateUserRateLimitInput {
  selector: SelectorInput;
  data: UpdateUserRateLimitDataInput;
}

interface UserRateLimitOutput {
  data?: UpdateUserRateLimitDataInput | null;
}

interface CreateUserTagRelDataInput {
  legacyData?: any;
  tagId: string;
  userId: string;
  subforumShowUnreadInSidebar?: boolean | null;
  subforumEmailNotifications?: boolean | null;
  subforumHideIntroPost?: boolean | null;
}

interface CreateUserTagRelInput {
  data: CreateUserTagRelDataInput;
}

interface UpdateUserTagRelDataInput {
  legacyData?: any;
  subforumShowUnreadInSidebar?: boolean | null;
  subforumEmailNotifications?: boolean | null;
  subforumHideIntroPost?: boolean | null;
}

interface UpdateUserTagRelInput {
  selector: SelectorInput;
  data: UpdateUserTagRelDataInput;
}

interface UserTagRelOutput {
  data?: UpdateUserTagRelDataInput | null;
}

interface CreateUserDataInput {
  legacyData?: any;
  moderationGuidelines?: any;
  howOthersCanHelpMe?: any;
  howICanHelpOthers?: any;
  slug?: string | null;
  biography?: any;
  username?: string | null;
  isAdmin?: boolean | null;
  displayName?: string | null;
  previousDisplayName?: string | null;
  email?: string | null;
  groups?: Array<string | null> | null;
  theme?: any;
  lastUsedTimezone?: string | null;
  whenConfirmationEmailSent?: Date | null;
  legacy?: boolean | null;
  commentSorting?: string | null;
  noKibitz?: boolean | null;
  showHideKarmaOption?: boolean | null;
  showPostAuthorCard?: boolean | null;
  hideIntercom?: boolean | null;
  noSingleLineComments?: boolean | null;
  noCollapseCommentsPosts?: boolean | null;
  noCollapseCommentsFrontpage?: boolean | null;
  hideCommunitySection?: boolean | null;
  expandedFrontpageSections?: any;
  showCommunityInRecentDiscussion?: boolean | null;
  hidePostsRecommendations?: boolean | null;
  petrovOptOut?: boolean | null;
  optedOutOfSurveys?: boolean | null;
  postGlossariesPinned?: boolean | null;
  acceptedTos?: boolean | null;
  hideNavigationSidebar?: boolean | null;
  currentFrontpageFilter?: string | null;
  frontpageSelectedTab?: string | null;
  frontpageFilterSettings?: any;
  hideFrontpageFilterSettingsDesktop?: boolean | null;
  allPostsTimeframe?: string | null;
  allPostsFilter?: string | null;
  allPostsSorting?: string | null;
  allPostsShowLowKarma?: boolean | null;
  allPostsIncludeEvents?: boolean | null;
  allPostsHideCommunity?: boolean | null;
  allPostsOpenSettings?: boolean | null;
  draftsListSorting?: string | null;
  draftsListShowArchived?: boolean | null;
  draftsListShowShared?: boolean | null;
  lastNotificationsCheck?: Date | null;
  moderationStyle?: string | null;
  moderatorAssistance?: boolean | null;
  collapseModerationGuidelines?: boolean | null;
  bannedUserIds?: Array<string | null> | null;
  bannedPersonalUserIds?: Array<string | null> | null;
  legacyId?: string | null;
  voteBanned?: boolean | null;
  nullifyVotes?: boolean | null;
  deleteContent?: boolean | null;
  banned?: Date | null;
  auto_subscribe_to_my_posts?: boolean | null;
  auto_subscribe_to_my_comments?: boolean | null;
  autoSubscribeAsOrganizer?: boolean | null;
  notificationCommentsOnSubscribedPost?: any;
  notificationShortformContent?: any;
  notificationRepliesToMyComments?: any;
  notificationRepliesToSubscribedComments?: any;
  notificationSubscribedUserPost?: any;
  notificationSubscribedUserComment?: any;
  notificationPostsInGroups?: any;
  notificationSubscribedTagPost?: any;
  notificationSubscribedSequencePost?: any;
  notificationPrivateMessage?: any;
  notificationSharedWithMe?: any;
  notificationAlignmentSubmissionApproved?: any;
  notificationEventInRadius?: any;
  notificationKarmaPowersGained?: any;
  notificationRSVPs?: any;
  notificationGroupAdministration?: any;
  notificationCommentsOnDraft?: any;
  notificationPostsNominatedReview?: any;
  notificationSubforumUnread?: any;
  notificationNewMention?: any;
  notificationDialogueMessages?: any;
  notificationPublishedDialogueMessages?: any;
  notificationAddedAsCoauthor?: any;
  notificationDebateCommentsOnSubscribedPost?: any;
  notificationDebateReplies?: any;
  notificationDialogueMatch?: any;
  notificationNewDialogueChecks?: any;
  notificationYourTurnMatchForm?: any;
  hideDialogueFacilitation?: boolean | null;
  revealChecksToAdmins?: boolean | null;
  optedInToDialogueFacilitation?: boolean | null;
  showDialoguesList?: boolean | null;
  showMyDialogues?: boolean | null;
  showMatches?: boolean | null;
  showRecommendedPartners?: boolean | null;
  hideActiveDialogueUsers?: boolean | null;
  karmaChangeNotifierSettings?: any;
  karmaChangeLastOpened?: Date | null;
  karmaChangeBatchStart?: Date | null;
  emailSubscribedToCurated?: boolean | null;
  subscribedToDigest?: boolean | null;
  unsubscribeFromAll?: boolean | null;
  hideSubscribePoke?: boolean | null;
  hideMeetupsPoke?: boolean | null;
  hideHomeRHS?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  mapLocation?: any;
  mapMarkerText?: string | null;
  nearbyEventsNotifications?: boolean | null;
  nearbyEventsNotificationsLocation?: any;
  nearbyEventsNotificationsRadius?: number | null;
  nearbyPeopleNotificationThreshold?: number | null;
  hideFrontpageMap?: boolean | null;
  hideTaggingProgressBar?: boolean | null;
  hideFrontpageBookAd?: boolean | null;
  hideFrontpageBook2019Ad?: boolean | null;
  hideFrontpageBook2020Ad?: boolean | null;
  reviewedByUserId?: string | null;
  shortformFeedId?: string | null;
  viewUnreviewedComments?: boolean | null;
  noExpandUnreadCommentsReview?: boolean | null;
  profileUpdatedAt?: Date | null;
  jobTitle?: string | null;
  organization?: string | null;
  careerStage?: Array<string | null> | null;
  website?: string | null;
  fmCrosspostUserId?: string | null;
  linkedinProfileURL?: string | null;
  facebookProfileURL?: string | null;
  blueskyProfileURL?: string | null;
  twitterProfileURL?: string | null;
  twitterProfileURLAdmin?: string | null;
  githubProfileURL?: string | null;
  profileTagIds?: Array<string | null> | null;
  organizerOfGroupIds?: Array<string | null> | null;
  programParticipation?: Array<string | null> | null;
  postingDisabled?: boolean | null;
  allCommentingDisabled?: boolean | null;
  commentingOnOtherUsersDisabled?: boolean | null;
  conversationsDisabled?: boolean | null;
  acknowledgedNewUserGuidelines?: boolean | null;
  subforumPreferredLayout?: string | null;
  hideJobAdUntil?: Date | null;
  criticismTipsDismissed?: boolean | null;
  hideFromPeopleDirectory?: boolean | null;
  allowDatadogSessionReplay?: boolean | null;
  reviewForAlignmentForumUserId?: string | null;
  afSubmittedApplication?: boolean | null;
  hideSunshineSidebar?: boolean | null;
  inactiveSurveyEmailSentAt?: Date | null;
  userSurveyEmailSentAt?: Date | null;
}

interface CreateUserInput {
  data: CreateUserDataInput;
}

interface UpdateUserDataInput {
  legacyData?: any;
  moderationGuidelines?: any;
  howOthersCanHelpMe?: any;
  howICanHelpOthers?: any;
  slug?: string | null;
  biography?: any;
  username?: string | null;
  isAdmin?: boolean | null;
  displayName?: string | null;
  previousDisplayName?: string | null;
  email?: string | null;
  noindex?: boolean | null;
  groups?: Array<string | null> | null;
  theme?: any;
  lastUsedTimezone?: string | null;
  whenConfirmationEmailSent?: Date | null;
  legacy?: boolean | null;
  commentSorting?: string | null;
  sortDraftsBy?: string | null;
  reactPaletteStyle?: string | null;
  noKibitz?: boolean | null;
  showHideKarmaOption?: boolean | null;
  showPostAuthorCard?: boolean | null;
  hideIntercom?: boolean | null;
  markDownPostEditor?: boolean | null;
  hideElicitPredictions?: boolean | null;
  hideAFNonMemberInitialWarning?: boolean | null;
  noSingleLineComments?: boolean | null;
  noCollapseCommentsPosts?: boolean | null;
  noCollapseCommentsFrontpage?: boolean | null;
  hideCommunitySection?: boolean | null;
  expandedFrontpageSections?: any;
  showCommunityInRecentDiscussion?: boolean | null;
  hidePostsRecommendations?: boolean | null;
  petrovOptOut?: boolean | null;
  optedOutOfSurveys?: boolean | null;
  postGlossariesPinned?: boolean | null;
  generateJargonForDrafts?: boolean | null;
  generateJargonForPublishedPosts?: boolean | null;
  acceptedTos?: boolean | null;
  hideNavigationSidebar?: boolean | null;
  currentFrontpageFilter?: string | null;
  frontpageSelectedTab?: string | null;
  frontpageFilterSettings?: any;
  hideFrontpageFilterSettingsDesktop?: boolean | null;
  allPostsTimeframe?: string | null;
  allPostsFilter?: string | null;
  allPostsSorting?: string | null;
  allPostsShowLowKarma?: boolean | null;
  allPostsIncludeEvents?: boolean | null;
  allPostsHideCommunity?: boolean | null;
  allPostsOpenSettings?: boolean | null;
  draftsListSorting?: string | null;
  draftsListShowArchived?: boolean | null;
  draftsListShowShared?: boolean | null;
  lastNotificationsCheck?: Date | null;
  moderationStyle?: string | null;
  moderatorAssistance?: boolean | null;
  collapseModerationGuidelines?: boolean | null;
  bannedUserIds?: Array<string | null> | null;
  bannedPersonalUserIds?: Array<string | null> | null;
  bookmarkedPostsMetadata?: Array<any> | null;
  hiddenPostsMetadata?: Array<any> | null;
  legacyId?: string | null;
  deleted?: boolean | null;
  permanentDeletionRequestedAt?: Date | null;
  voteBanned?: boolean | null;
  nullifyVotes?: boolean | null;
  deleteContent?: boolean | null;
  banned?: Date | null;
  auto_subscribe_to_my_posts?: boolean | null;
  auto_subscribe_to_my_comments?: boolean | null;
  autoSubscribeAsOrganizer?: boolean | null;
  notificationCommentsOnSubscribedPost?: any;
  notificationShortformContent?: any;
  notificationRepliesToMyComments?: any;
  notificationRepliesToSubscribedComments?: any;
  notificationSubscribedUserPost?: any;
  notificationSubscribedUserComment?: any;
  notificationPostsInGroups?: any;
  notificationSubscribedTagPost?: any;
  notificationSubscribedSequencePost?: any;
  notificationPrivateMessage?: any;
  notificationSharedWithMe?: any;
  notificationAlignmentSubmissionApproved?: any;
  notificationEventInRadius?: any;
  notificationKarmaPowersGained?: any;
  notificationRSVPs?: any;
  notificationGroupAdministration?: any;
  notificationCommentsOnDraft?: any;
  notificationPostsNominatedReview?: any;
  notificationSubforumUnread?: any;
  notificationNewMention?: any;
  notificationDialogueMessages?: any;
  notificationPublishedDialogueMessages?: any;
  notificationAddedAsCoauthor?: any;
  notificationDebateCommentsOnSubscribedPost?: any;
  notificationDebateReplies?: any;
  notificationDialogueMatch?: any;
  notificationNewDialogueChecks?: any;
  notificationYourTurnMatchForm?: any;
  hideDialogueFacilitation?: boolean | null;
  revealChecksToAdmins?: boolean | null;
  optedInToDialogueFacilitation?: boolean | null;
  showDialoguesList?: boolean | null;
  showMyDialogues?: boolean | null;
  showMatches?: boolean | null;
  showRecommendedPartners?: boolean | null;
  hideActiveDialogueUsers?: boolean | null;
  karmaChangeNotifierSettings?: any;
  karmaChangeLastOpened?: Date | null;
  karmaChangeBatchStart?: Date | null;
  emailSubscribedToCurated?: boolean | null;
  subscribedToDigest?: boolean | null;
  unsubscribeFromAll?: boolean | null;
  hideSubscribePoke?: boolean | null;
  hideMeetupsPoke?: boolean | null;
  hideHomeRHS?: boolean | null;
  googleLocation?: any;
  location?: string | null;
  mapLocation?: any;
  mapMarkerText?: string | null;
  nearbyEventsNotifications?: boolean | null;
  nearbyEventsNotificationsLocation?: any;
  nearbyEventsNotificationsRadius?: number | null;
  nearbyPeopleNotificationThreshold?: number | null;
  hideFrontpageMap?: boolean | null;
  hideTaggingProgressBar?: boolean | null;
  hideFrontpageBook2019Ad?: boolean | null;
  hideFrontpageBook2020Ad?: boolean | null;
  sunshineNotes?: string | null;
  sunshineFlagged?: boolean | null;
  needsReview?: boolean | null;
  sunshineSnoozed?: boolean | null;
  snoozedUntilContentCount?: number | null;
  reviewedByUserId?: string | null;
  reviewedAt?: Date | null;
  fullName?: string | null;
  shortformFeedId?: string | null;
  viewUnreviewedComments?: boolean | null;
  partiallyReadSequences?: Array<any> | null;
  beta?: boolean | null;
  reviewVotesQuadratic?: boolean | null;
  reviewVotesQuadratic2019?: boolean | null;
  reviewVotesQuadratic2020?: boolean | null;
  petrovPressedButtonDate?: Date | null;
  petrovLaunchCodeDate?: Date | null;
  defaultToCKEditor?: boolean | null;
  signUpReCaptchaRating?: number | null;
  noExpandUnreadCommentsReview?: boolean | null;
  abTestKey?: string | null;
  abTestOverrides?: any;
  walledGardenInvite?: boolean | null;
  walledGardenPortalOnboarded?: boolean | null;
  taggingDashboardCollapsed?: boolean | null;
  usernameUnset?: boolean | null;
  paymentEmail?: string | null;
  paymentInfo?: string | null;
  profileUpdatedAt?: Date | null;
  profileImageId?: string | null;
  jobTitle?: string | null;
  organization?: string | null;
  careerStage?: Array<string | null> | null;
  website?: string | null;
  fmCrosspostUserId?: string | null;
  linkedinProfileURL?: string | null;
  facebookProfileURL?: string | null;
  blueskyProfileURL?: string | null;
  twitterProfileURL?: string | null;
  twitterProfileURLAdmin?: string | null;
  githubProfileURL?: string | null;
  profileTagIds?: Array<string | null> | null;
  organizerOfGroupIds?: Array<string | null> | null;
  programParticipation?: Array<string | null> | null;
  postingDisabled?: boolean | null;
  allCommentingDisabled?: boolean | null;
  commentingOnOtherUsersDisabled?: boolean | null;
  conversationsDisabled?: boolean | null;
  acknowledgedNewUserGuidelines?: boolean | null;
  subforumPreferredLayout?: string | null;
  hideJobAdUntil?: Date | null;
  criticismTipsDismissed?: boolean | null;
  hideFromPeopleDirectory?: boolean | null;
  allowDatadogSessionReplay?: boolean | null;
  reviewForAlignmentForumUserId?: string | null;
  afApplicationText?: string | null;
  afSubmittedApplication?: boolean | null;
  hideSunshineSidebar?: boolean | null;
  inactiveSurveyEmailSentAt?: Date | null;
  userSurveyEmailSentAt?: Date | null;
  recommendationSettings?: any;
}

interface UpdateUserInput {
  selector: SelectorInput;
  data: UpdateUserDataInput;
}

interface UserOutput {
  data?: UpdateUserDataInput | null;
}

interface GraphQLTypeMap {
  SingleAdvisorRequestInput: SingleAdvisorRequestInput;
  MultiAdvisorRequestInput: MultiAdvisorRequestInput;
  SingleAdvisorRequestOutput: SingleAdvisorRequestOutput;
  MultiAdvisorRequestOutput: MultiAdvisorRequestOutput;
  ArbitalCaches: ArbitalCaches;
  SingleArbitalCachesInput: SingleArbitalCachesInput;
  MultiArbitalCachesInput: MultiArbitalCachesInput;
  SingleArbitalCachesOutput: SingleArbitalCachesOutput;
  MultiArbitalCachesOutput: MultiArbitalCachesOutput;
  SingleArbitalTagContentRelInput: SingleArbitalTagContentRelInput;
  MultiArbitalTagContentRelInput: MultiArbitalTagContentRelInput;
  SingleArbitalTagContentRelOutput: SingleArbitalTagContentRelOutput;
  MultiArbitalTagContentRelOutput: MultiArbitalTagContentRelOutput;
  SingleBanInput: SingleBanInput;
  MultiBanInput: MultiBanInput;
  SingleBanOutput: SingleBanOutput;
  MultiBanOutput: MultiBanOutput;
  SingleBookInput: SingleBookInput;
  MultiBookInput: MultiBookInput;
  SingleBookOutput: SingleBookOutput;
  MultiBookOutput: MultiBookOutput;
  SingleChapterInput: SingleChapterInput;
  MultiChapterInput: MultiChapterInput;
  SingleChapterOutput: SingleChapterOutput;
  MultiChapterOutput: MultiChapterOutput;
  SingleCkEditorUserSessionInput: SingleCkEditorUserSessionInput;
  MultiCkEditorUserSessionInput: MultiCkEditorUserSessionInput;
  SingleCkEditorUserSessionOutput: SingleCkEditorUserSessionOutput;
  MultiCkEditorUserSessionOutput: MultiCkEditorUserSessionOutput;
  SingleClientIdInput: SingleClientIdInput;
  MultiClientIdInput: MultiClientIdInput;
  SingleClientIdOutput: SingleClientIdOutput;
  MultiClientIdOutput: MultiClientIdOutput;
  SingleCollectionInput: SingleCollectionInput;
  MultiCollectionInput: MultiCollectionInput;
  SingleCollectionOutput: SingleCollectionOutput;
  MultiCollectionOutput: MultiCollectionOutput;
  SingleCommentModeratorActionInput: SingleCommentModeratorActionInput;
  MultiCommentModeratorActionInput: MultiCommentModeratorActionInput;
  SingleCommentModeratorActionOutput: SingleCommentModeratorActionOutput;
  MultiCommentModeratorActionOutput: MultiCommentModeratorActionOutput;
  SingleCommentInput: SingleCommentInput;
  MultiCommentInput: MultiCommentInput;
  SingleCommentOutput: SingleCommentOutput;
  MultiCommentOutput: MultiCommentOutput;
  SingleConversationInput: SingleConversationInput;
  MultiConversationInput: MultiConversationInput;
  SingleConversationOutput: SingleConversationOutput;
  MultiConversationOutput: MultiConversationOutput;
  SingleCronHistoryInput: SingleCronHistoryInput;
  MultiCronHistoryInput: MultiCronHistoryInput;
  SingleCronHistoryOutput: SingleCronHistoryOutput;
  MultiCronHistoryOutput: MultiCronHistoryOutput;
  SingleCurationEmailInput: SingleCurationEmailInput;
  MultiCurationEmailInput: MultiCurationEmailInput;
  SingleCurationEmailOutput: SingleCurationEmailOutput;
  MultiCurationEmailOutput: MultiCurationEmailOutput;
  SingleCurationNoticeInput: SingleCurationNoticeInput;
  MultiCurationNoticeInput: MultiCurationNoticeInput;
  SingleCurationNoticeOutput: SingleCurationNoticeOutput;
  MultiCurationNoticeOutput: MultiCurationNoticeOutput;
  DatabaseMetadata: DatabaseMetadata;
  SingleDatabaseMetadataInput: SingleDatabaseMetadataInput;
  MultiDatabaseMetadataInput: MultiDatabaseMetadataInput;
  SingleDatabaseMetadataOutput: SingleDatabaseMetadataOutput;
  MultiDatabaseMetadataOutput: MultiDatabaseMetadataOutput;
  DebouncerEvents: DebouncerEvents;
  SingleDebouncerEventsInput: SingleDebouncerEventsInput;
  MultiDebouncerEventsInput: MultiDebouncerEventsInput;
  SingleDebouncerEventsOutput: SingleDebouncerEventsOutput;
  MultiDebouncerEventsOutput: MultiDebouncerEventsOutput;
  SingleDialogueCheckInput: SingleDialogueCheckInput;
  MultiDialogueCheckInput: MultiDialogueCheckInput;
  SingleDialogueCheckOutput: SingleDialogueCheckOutput;
  MultiDialogueCheckOutput: MultiDialogueCheckOutput;
  SingleDialogueMatchPreferenceInput: SingleDialogueMatchPreferenceInput;
  MultiDialogueMatchPreferenceInput: MultiDialogueMatchPreferenceInput;
  SingleDialogueMatchPreferenceOutput: SingleDialogueMatchPreferenceOutput;
  MultiDialogueMatchPreferenceOutput: MultiDialogueMatchPreferenceOutput;
  SingleDigestPostInput: SingleDigestPostInput;
  MultiDigestPostInput: MultiDigestPostInput;
  SingleDigestPostOutput: SingleDigestPostOutput;
  MultiDigestPostOutput: MultiDigestPostOutput;
  SingleDigestInput: SingleDigestInput;
  MultiDigestInput: MultiDigestInput;
  SingleDigestOutput: SingleDigestOutput;
  MultiDigestOutput: MultiDigestOutput;
  SingleElectionCandidateInput: SingleElectionCandidateInput;
  MultiElectionCandidateInput: MultiElectionCandidateInput;
  SingleElectionCandidateOutput: SingleElectionCandidateOutput;
  MultiElectionCandidateOutput: MultiElectionCandidateOutput;
  SingleElectionVoteInput: SingleElectionVoteInput;
  MultiElectionVoteInput: MultiElectionVoteInput;
  SingleElectionVoteOutput: SingleElectionVoteOutput;
  MultiElectionVoteOutput: MultiElectionVoteOutput;
  SingleElicitQuestionPredictionInput: SingleElicitQuestionPredictionInput;
  MultiElicitQuestionPredictionInput: MultiElicitQuestionPredictionInput;
  SingleElicitQuestionPredictionOutput: SingleElicitQuestionPredictionOutput;
  MultiElicitQuestionPredictionOutput: MultiElicitQuestionPredictionOutput;
  SingleElicitQuestionInput: SingleElicitQuestionInput;
  MultiElicitQuestionInput: MultiElicitQuestionInput;
  SingleElicitQuestionOutput: SingleElicitQuestionOutput;
  MultiElicitQuestionOutput: MultiElicitQuestionOutput;
  EmailTokens: EmailTokens;
  SingleEmailTokensInput: SingleEmailTokensInput;
  MultiEmailTokensInput: MultiEmailTokensInput;
  SingleEmailTokensOutput: SingleEmailTokensOutput;
  MultiEmailTokensOutput: MultiEmailTokensOutput;
  SingleFeaturedResourceInput: SingleFeaturedResourceInput;
  MultiFeaturedResourceInput: MultiFeaturedResourceInput;
  SingleFeaturedResourceOutput: SingleFeaturedResourceOutput;
  MultiFeaturedResourceOutput: MultiFeaturedResourceOutput;
  SingleFieldChangeInput: SingleFieldChangeInput;
  MultiFieldChangeInput: MultiFieldChangeInput;
  SingleFieldChangeOutput: SingleFieldChangeOutput;
  MultiFieldChangeOutput: MultiFieldChangeOutput;
  SingleForumEventInput: SingleForumEventInput;
  MultiForumEventInput: MultiForumEventInput;
  SingleForumEventOutput: SingleForumEventOutput;
  MultiForumEventOutput: MultiForumEventOutput;
  SingleGardenCodeInput: SingleGardenCodeInput;
  MultiGardenCodeInput: MultiGardenCodeInput;
  SingleGardenCodeOutput: SingleGardenCodeOutput;
  MultiGardenCodeOutput: MultiGardenCodeOutput;
  SingleGoogleServiceAccountSessionInput: SingleGoogleServiceAccountSessionInput;
  MultiGoogleServiceAccountSessionInput: MultiGoogleServiceAccountSessionInput;
  SingleGoogleServiceAccountSessionOutput: SingleGoogleServiceAccountSessionOutput;
  MultiGoogleServiceAccountSessionOutput: MultiGoogleServiceAccountSessionOutput;
  Images: Images;
  SingleImagesInput: SingleImagesInput;
  MultiImagesInput: MultiImagesInput;
  SingleImagesOutput: SingleImagesOutput;
  MultiImagesOutput: MultiImagesOutput;
  SingleJargonTermInput: SingleJargonTermInput;
  MultiJargonTermInput: MultiJargonTermInput;
  SingleJargonTermOutput: SingleJargonTermOutput;
  MultiJargonTermOutput: MultiJargonTermOutput;
  SingleLWEventInput: SingleLWEventInput;
  MultiLWEventInput: MultiLWEventInput;
  SingleLWEventOutput: SingleLWEventOutput;
  MultiLWEventOutput: MultiLWEventOutput;
  LegacyData: LegacyData;
  SingleLegacyDataInput: SingleLegacyDataInput;
  MultiLegacyDataInput: MultiLegacyDataInput;
  SingleLegacyDataOutput: SingleLegacyDataOutput;
  MultiLegacyDataOutput: MultiLegacyDataOutput;
  SingleLlmConversationInput: SingleLlmConversationInput;
  MultiLlmConversationInput: MultiLlmConversationInput;
  SingleLlmConversationOutput: SingleLlmConversationOutput;
  MultiLlmConversationOutput: MultiLlmConversationOutput;
  SingleLlmMessageInput: SingleLlmMessageInput;
  MultiLlmMessageInput: MultiLlmMessageInput;
  SingleLlmMessageOutput: SingleLlmMessageOutput;
  MultiLlmMessageOutput: MultiLlmMessageOutput;
  SingleLocalgroupInput: SingleLocalgroupInput;
  MultiLocalgroupInput: MultiLocalgroupInput;
  SingleLocalgroupOutput: SingleLocalgroupOutput;
  MultiLocalgroupOutput: MultiLocalgroupOutput;
  SingleManifoldProbabilitiesCacheInput: SingleManifoldProbabilitiesCacheInput;
  MultiManifoldProbabilitiesCacheInput: MultiManifoldProbabilitiesCacheInput;
  SingleManifoldProbabilitiesCacheOutput: SingleManifoldProbabilitiesCacheOutput;
  MultiManifoldProbabilitiesCacheOutput: MultiManifoldProbabilitiesCacheOutput;
  SingleMessageInput: SingleMessageInput;
  MultiMessageInput: MultiMessageInput;
  SingleMessageOutput: SingleMessageOutput;
  MultiMessageOutput: MultiMessageOutput;
  SingleMigrationInput: SingleMigrationInput;
  MultiMigrationInput: MultiMigrationInput;
  SingleMigrationOutput: SingleMigrationOutput;
  MultiMigrationOutput: MultiMigrationOutput;
  SingleModerationTemplateInput: SingleModerationTemplateInput;
  MultiModerationTemplateInput: MultiModerationTemplateInput;
  SingleModerationTemplateOutput: SingleModerationTemplateOutput;
  MultiModerationTemplateOutput: MultiModerationTemplateOutput;
  SingleModeratorActionInput: SingleModeratorActionInput;
  MultiModeratorActionInput: MultiModeratorActionInput;
  SingleModeratorActionOutput: SingleModeratorActionOutput;
  MultiModeratorActionOutput: MultiModeratorActionOutput;
  SingleMultiDocumentInput: SingleMultiDocumentInput;
  MultiMultiDocumentInput: MultiMultiDocumentInput;
  SingleMultiDocumentOutput: SingleMultiDocumentOutput;
  MultiMultiDocumentOutput: MultiMultiDocumentOutput;
  SingleNotificationInput: SingleNotificationInput;
  MultiNotificationInput: MultiNotificationInput;
  SingleNotificationOutput: SingleNotificationOutput;
  MultiNotificationOutput: MultiNotificationOutput;
  PageCacheEntry: PageCacheEntry;
  SinglePageCacheEntryInput: SinglePageCacheEntryInput;
  MultiPageCacheEntryInput: MultiPageCacheEntryInput;
  SinglePageCacheEntryOutput: SinglePageCacheEntryOutput;
  MultiPageCacheEntryOutput: MultiPageCacheEntryOutput;
  SinglePetrovDayActionInput: SinglePetrovDayActionInput;
  MultiPetrovDayActionInput: MultiPetrovDayActionInput;
  SinglePetrovDayActionOutput: SinglePetrovDayActionOutput;
  MultiPetrovDayActionOutput: MultiPetrovDayActionOutput;
  SinglePetrovDayLaunchInput: SinglePetrovDayLaunchInput;
  MultiPetrovDayLaunchInput: MultiPetrovDayLaunchInput;
  SinglePetrovDayLaunchOutput: SinglePetrovDayLaunchOutput;
  MultiPetrovDayLaunchOutput: MultiPetrovDayLaunchOutput;
  SinglePodcastEpisodeInput: SinglePodcastEpisodeInput;
  MultiPodcastEpisodeInput: MultiPodcastEpisodeInput;
  SinglePodcastEpisodeOutput: SinglePodcastEpisodeOutput;
  MultiPodcastEpisodeOutput: MultiPodcastEpisodeOutput;
  SinglePodcastInput: SinglePodcastInput;
  MultiPodcastInput: MultiPodcastInput;
  SinglePodcastOutput: SinglePodcastOutput;
  MultiPodcastOutput: MultiPodcastOutput;
  SinglePostEmbeddingInput: SinglePostEmbeddingInput;
  MultiPostEmbeddingInput: MultiPostEmbeddingInput;
  SinglePostEmbeddingOutput: SinglePostEmbeddingOutput;
  MultiPostEmbeddingOutput: MultiPostEmbeddingOutput;
  SinglePostRecommendationInput: SinglePostRecommendationInput;
  MultiPostRecommendationInput: MultiPostRecommendationInput;
  SinglePostRecommendationOutput: SinglePostRecommendationOutput;
  MultiPostRecommendationOutput: MultiPostRecommendationOutput;
  SinglePostRelationInput: SinglePostRelationInput;
  MultiPostRelationInput: MultiPostRelationInput;
  SinglePostRelationOutput: SinglePostRelationOutput;
  MultiPostRelationOutput: MultiPostRelationOutput;
  SinglePostViewTimeInput: SinglePostViewTimeInput;
  MultiPostViewTimeInput: MultiPostViewTimeInput;
  SinglePostViewTimeOutput: SinglePostViewTimeOutput;
  MultiPostViewTimeOutput: MultiPostViewTimeOutput;
  PostViews: PostViews;
  SinglePostViewsInput: SinglePostViewsInput;
  MultiPostViewsInput: MultiPostViewsInput;
  SinglePostViewsOutput: SinglePostViewsOutput;
  MultiPostViewsOutput: MultiPostViewsOutput;
  SinglePostInput: SinglePostInput;
  MultiPostInput: MultiPostInput;
  SinglePostOutput: SinglePostOutput;
  MultiPostOutput: MultiPostOutput;
  SingleRSSFeedInput: SingleRSSFeedInput;
  MultiRSSFeedInput: MultiRSSFeedInput;
  SingleRSSFeedOutput: SingleRSSFeedOutput;
  MultiRSSFeedOutput: MultiRSSFeedOutput;
  SingleReadStatusInput: SingleReadStatusInput;
  MultiReadStatusInput: MultiReadStatusInput;
  SingleReadStatusOutput: SingleReadStatusOutput;
  MultiReadStatusOutput: MultiReadStatusOutput;
  SingleRecommendationsCacheInput: SingleRecommendationsCacheInput;
  MultiRecommendationsCacheInput: MultiRecommendationsCacheInput;
  SingleRecommendationsCacheOutput: SingleRecommendationsCacheOutput;
  MultiRecommendationsCacheOutput: MultiRecommendationsCacheOutput;
  SingleReportInput: SingleReportInput;
  MultiReportInput: MultiReportInput;
  SingleReportOutput: SingleReportOutput;
  MultiReportOutput: MultiReportOutput;
  SingleReviewVoteInput: SingleReviewVoteInput;
  MultiReviewVoteInput: MultiReviewVoteInput;
  SingleReviewVoteOutput: SingleReviewVoteOutput;
  MultiReviewVoteOutput: MultiReviewVoteOutput;
  SingleReviewWinnerArtInput: SingleReviewWinnerArtInput;
  MultiReviewWinnerArtInput: MultiReviewWinnerArtInput;
  SingleReviewWinnerArtOutput: SingleReviewWinnerArtOutput;
  MultiReviewWinnerArtOutput: MultiReviewWinnerArtOutput;
  SingleReviewWinnerInput: SingleReviewWinnerInput;
  MultiReviewWinnerInput: MultiReviewWinnerInput;
  SingleReviewWinnerOutput: SingleReviewWinnerOutput;
  MultiReviewWinnerOutput: MultiReviewWinnerOutput;
  SingleRevisionInput: SingleRevisionInput;
  MultiRevisionInput: MultiRevisionInput;
  SingleRevisionOutput: SingleRevisionOutput;
  MultiRevisionOutput: MultiRevisionOutput;
  SingleSequenceInput: SingleSequenceInput;
  MultiSequenceInput: MultiSequenceInput;
  SingleSequenceOutput: SingleSequenceOutput;
  MultiSequenceOutput: MultiSequenceOutput;
  SingleSessionInput: SingleSessionInput;
  MultiSessionInput: MultiSessionInput;
  SingleSessionOutput: SingleSessionOutput;
  MultiSessionOutput: MultiSessionOutput;
  SingleSideCommentCacheInput: SingleSideCommentCacheInput;
  MultiSideCommentCacheInput: MultiSideCommentCacheInput;
  SingleSideCommentCacheOutput: SingleSideCommentCacheOutput;
  MultiSideCommentCacheOutput: MultiSideCommentCacheOutput;
  SingleSplashArtCoordinateInput: SingleSplashArtCoordinateInput;
  MultiSplashArtCoordinateInput: MultiSplashArtCoordinateInput;
  SingleSplashArtCoordinateOutput: SingleSplashArtCoordinateOutput;
  MultiSplashArtCoordinateOutput: MultiSplashArtCoordinateOutput;
  SingleSpotlightInput: SingleSpotlightInput;
  MultiSpotlightInput: MultiSpotlightInput;
  SingleSpotlightOutput: SingleSpotlightOutput;
  MultiSpotlightOutput: MultiSpotlightOutput;
  SingleSubscriptionInput: SingleSubscriptionInput;
  MultiSubscriptionInput: MultiSubscriptionInput;
  SingleSubscriptionOutput: SingleSubscriptionOutput;
  MultiSubscriptionOutput: MultiSubscriptionOutput;
  SingleSurveyQuestionInput: SingleSurveyQuestionInput;
  MultiSurveyQuestionInput: MultiSurveyQuestionInput;
  SingleSurveyQuestionOutput: SingleSurveyQuestionOutput;
  MultiSurveyQuestionOutput: MultiSurveyQuestionOutput;
  SingleSurveyResponseInput: SingleSurveyResponseInput;
  MultiSurveyResponseInput: MultiSurveyResponseInput;
  SingleSurveyResponseOutput: SingleSurveyResponseOutput;
  MultiSurveyResponseOutput: MultiSurveyResponseOutput;
  SingleSurveyScheduleInput: SingleSurveyScheduleInput;
  MultiSurveyScheduleInput: MultiSurveyScheduleInput;
  SingleSurveyScheduleOutput: SingleSurveyScheduleOutput;
  MultiSurveyScheduleOutput: MultiSurveyScheduleOutput;
  SingleSurveyInput: SingleSurveyInput;
  MultiSurveyInput: MultiSurveyInput;
  SingleSurveyOutput: SingleSurveyOutput;
  MultiSurveyOutput: MultiSurveyOutput;
  SingleTagFlagInput: SingleTagFlagInput;
  MultiTagFlagInput: MultiTagFlagInput;
  SingleTagFlagOutput: SingleTagFlagOutput;
  MultiTagFlagOutput: MultiTagFlagOutput;
  SingleTagRelInput: SingleTagRelInput;
  MultiTagRelInput: MultiTagRelInput;
  SingleTagRelOutput: SingleTagRelOutput;
  MultiTagRelOutput: MultiTagRelOutput;
  SingleTagInput: SingleTagInput;
  MultiTagInput: MultiTagInput;
  SingleTagOutput: SingleTagOutput;
  MultiTagOutput: MultiTagOutput;
  SingleTweetInput: SingleTweetInput;
  MultiTweetInput: MultiTweetInput;
  SingleTweetOutput: SingleTweetOutput;
  MultiTweetOutput: MultiTweetOutput;
  SingleTypingIndicatorInput: SingleTypingIndicatorInput;
  MultiTypingIndicatorInput: MultiTypingIndicatorInput;
  SingleTypingIndicatorOutput: SingleTypingIndicatorOutput;
  MultiTypingIndicatorOutput: MultiTypingIndicatorOutput;
  SingleUserActivityInput: SingleUserActivityInput;
  MultiUserActivityInput: MultiUserActivityInput;
  SingleUserActivityOutput: SingleUserActivityOutput;
  MultiUserActivityOutput: MultiUserActivityOutput;
  SingleUserEAGDetailInput: SingleUserEAGDetailInput;
  MultiUserEAGDetailInput: MultiUserEAGDetailInput;
  SingleUserEAGDetailOutput: SingleUserEAGDetailOutput;
  MultiUserEAGDetailOutput: MultiUserEAGDetailOutput;
  SingleUserJobAdInput: SingleUserJobAdInput;
  MultiUserJobAdInput: MultiUserJobAdInput;
  SingleUserJobAdOutput: SingleUserJobAdOutput;
  MultiUserJobAdOutput: MultiUserJobAdOutput;
  SingleUserMostValuablePostInput: SingleUserMostValuablePostInput;
  MultiUserMostValuablePostInput: MultiUserMostValuablePostInput;
  SingleUserMostValuablePostOutput: SingleUserMostValuablePostOutput;
  MultiUserMostValuablePostOutput: MultiUserMostValuablePostOutput;
  SingleUserRateLimitInput: SingleUserRateLimitInput;
  MultiUserRateLimitInput: MultiUserRateLimitInput;
  SingleUserRateLimitOutput: SingleUserRateLimitOutput;
  MultiUserRateLimitOutput: MultiUserRateLimitOutput;
  SingleUserTagRelInput: SingleUserTagRelInput;
  MultiUserTagRelInput: MultiUserTagRelInput;
  SingleUserTagRelOutput: SingleUserTagRelOutput;
  MultiUserTagRelOutput: MultiUserTagRelOutput;
  SingleUserInput: SingleUserInput;
  MultiUserInput: MultiUserInput;
  SingleUserOutput: SingleUserOutput;
  MultiUserOutput: MultiUserOutput;
  SingleVoteInput: SingleVoteInput;
  MultiVoteInput: MultiVoteInput;
  SingleVoteOutput: SingleVoteOutput;
  MultiVoteOutput: MultiVoteOutput;
  Query: Query;
  Mutation: Mutation;
  SelectorInput: SelectorInput;
  EmailPreview: EmailPreview;
  ArbitalLinkedPage: ArbitalLinkedPage;
  ArbitalLinkedPages: ArbitalLinkedPages;
  SocialPreviewType: SocialPreviewType;
  ContentType: ContentType;
  TagContributor: TagContributor;
  TagContributorsList: TagContributorsList;
  UserLikingTag: UserLikingTag;
  LatLng: LatLng;
  RecommendResumeSequence: RecommendResumeSequence;
  CommentCountTag: CommentCountTag;
  TopCommentedTagUser: TopCommentedTagUser;
  UpvotedUser: UpvotedUser;
  UserDialogueUsefulData: UserDialogueUsefulData;
  NewUserCompletedProfile: NewUserCompletedProfile;
  UserCoreTagReads: UserCoreTagReads;
  SuggestedFeedSubscriptionUsersResult: SuggestedFeedSubscriptionUsersResult;
  VoteResultPost: VoteResultPost;
  VoteResultComment: VoteResultComment;
  VoteResultTagRel: VoteResultTagRel;
  VoteResultRevision: VoteResultRevision;
  VoteResultElectionCandidate: VoteResultElectionCandidate;
  VoteResultTag: VoteResultTag;
  VoteResultMultiDocument: VoteResultMultiDocument;
  CommentsWithReactsResult: CommentsWithReactsResult;
  PopularCommentsResult: PopularCommentsResult;
  PostKarmaChange: PostKarmaChange;
  CommentKarmaChange: CommentKarmaChange;
  RevisionsKarmaChange: RevisionsKarmaChange;
  ReactionChange: ReactionChange;
  KarmaChangesSimple: KarmaChangesSimple;
  KarmaChanges: KarmaChanges;
  UniqueClientViewsSeries: UniqueClientViewsSeries;
  PostAnalyticsResult: PostAnalyticsResult;
  PostAnalytics2Result: PostAnalytics2Result;
  MultiPostAnalyticsResult: MultiPostAnalyticsResult;
  AnalyticsSeriesValue: AnalyticsSeriesValue;
  ArbitalPageData: ArbitalPageData;
  ElicitUser: ElicitUser;
  ElicitPrediction: ElicitPrediction;
  ElicitBlockData: ElicitBlockData;
  NotificationCounts: NotificationCounts;
  NotificationDisplaysResult: NotificationDisplaysResult;
  PetrovDay2024CheckNumberOfIncomingData: PetrovDay2024CheckNumberOfIncomingData;
  PetrovDayCheckIfIncomingData: PetrovDayCheckIfIncomingData;
  PetrovDayLaunchMissileData: PetrovDayLaunchMissileData;
  GivingSeasonHeart: GivingSeasonHeart;
  UserReadHistoryResult: UserReadHistoryResult;
  PostsUserCommentedOnResult: PostsUserCommentedOnResult;
  PostReviewFilter: PostReviewFilter;
  PostReviewSort: PostReviewSort;
  DigestPlannerPost: DigestPlannerPost;
  RecombeeRecommendedPost: RecombeeRecommendedPost;
  VertexRecommendedPost: VertexRecommendedPost;
  PostWithApprovedJargon: PostWithApprovedJargon;
  DigestHighlightsResult: DigestHighlightsResult;
  DigestPostsThisWeekResult: DigestPostsThisWeekResult;
  CuratedAndPopularThisWeekResult: CuratedAndPopularThisWeekResult;
  RecentlyActiveDialoguesResult: RecentlyActiveDialoguesResult;
  MyDialoguesResult: MyDialoguesResult;
  GoogleVertexPostsResult: GoogleVertexPostsResult;
  CrossedKarmaThresholdResult: CrossedKarmaThresholdResult;
  RecombeeLatestPostsResult: RecombeeLatestPostsResult;
  RecombeeHybridPostsResult: RecombeeHybridPostsResult;
  PostsWithActiveDiscussionResult: PostsWithActiveDiscussionResult;
  PostsBySubscribedAuthorsResult: PostsBySubscribedAuthorsResult;
  PostsWithApprovedJargonResult: PostsWithApprovedJargonResult;
  AllTagsActivityFeedQueryResults: AllTagsActivityFeedQueryResults;
  AllTagsActivityFeedEntryType: AllTagsActivityFeedEntryType;
  RecentDiscussionFeedQueryResults: RecentDiscussionFeedQueryResults;
  RecentDiscussionFeedEntryType: RecentDiscussionFeedEntryType;
  SubscribedPostAndComments: SubscribedPostAndComments;
  SubscribedFeedQueryResults: SubscribedFeedQueryResults;
  SubscribedFeedEntryType: SubscribedFeedEntryType;
  TagHistoryFeedQueryResults: TagHistoryFeedQueryResults;
  TagHistoryFeedEntryType: TagHistoryFeedEntryType;
  SubforumMagicFeedQueryResults: SubforumMagicFeedQueryResults;
  SubforumMagicFeedEntryType: SubforumMagicFeedEntryType;
  SubforumTopFeedQueryResults: SubforumTopFeedQueryResults;
  SubforumTopFeedEntryType: SubforumTopFeedEntryType;
  SubforumRecentCommentsFeedQueryResults: SubforumRecentCommentsFeedQueryResults;
  SubforumRecentCommentsFeedEntryType: SubforumRecentCommentsFeedEntryType;
  SubforumNewFeedQueryResults: SubforumNewFeedQueryResults;
  SubforumNewFeedEntryType: SubforumNewFeedEntryType;
  SubforumOldFeedQueryResults: SubforumOldFeedQueryResults;
  SubforumOldFeedEntryType: SubforumOldFeedEntryType;
  SurveyQuestionInfo: SurveyQuestionInfo;
  DocumentDeletion: DocumentDeletion;
  TagUpdates: TagUpdates;
  TagPreviewWithSummaries: TagPreviewWithSummaries;
  TagWithTotalCount: TagWithTotalCount;
  MostReadTopic: MostReadTopic;
  TagReadLikelihoodRatio: TagReadLikelihoodRatio;
  MostReadAuthor: MostReadAuthor;
  TopCommentContents: TopCommentContents;
  TopComment: TopComment;
  MostReceivedReact: MostReceivedReact;
  CombinedKarmaVals: CombinedKarmaVals;
  WrappedDataByYear: WrappedDataByYear;
  Site: Site;
  LoginReturnData: LoginReturnData;
  MigrationsDashboardData: MigrationsDashboardData;
  MigrationStatus: MigrationStatus;
  MigrationRun: MigrationRun;
  CoauthorStatus: CoauthorStatus;
  ExternalPost: ExternalPost;
  ExternalPostImportData: ExternalPostImportData;
  AutosaveContentType: AutosaveContentType;
  ModeratorIPAddressInfo: ModeratorIPAddressInfo;
  RssPostChangeInfo: RssPostChangeInfo;
  CreateAdvisorRequestDataInput: CreateAdvisorRequestDataInput;
  CreateAdvisorRequestInput: CreateAdvisorRequestInput;
  UpdateAdvisorRequestDataInput: UpdateAdvisorRequestDataInput;
  UpdateAdvisorRequestInput: UpdateAdvisorRequestInput;
  AdvisorRequestOutput: AdvisorRequestOutput;
  CreateArbitalTagContentRelDataInput: CreateArbitalTagContentRelDataInput;
  CreateArbitalTagContentRelInput: CreateArbitalTagContentRelInput;
  UpdateArbitalTagContentRelDataInput: UpdateArbitalTagContentRelDataInput;
  UpdateArbitalTagContentRelInput: UpdateArbitalTagContentRelInput;
  ArbitalTagContentRelOutput: ArbitalTagContentRelOutput;
  CreateBanDataInput: CreateBanDataInput;
  CreateBanInput: CreateBanInput;
  UpdateBanDataInput: UpdateBanDataInput;
  UpdateBanInput: UpdateBanInput;
  BanOutput: BanOutput;
  CreateBookDataInput: CreateBookDataInput;
  CreateBookInput: CreateBookInput;
  UpdateBookDataInput: UpdateBookDataInput;
  UpdateBookInput: UpdateBookInput;
  BookOutput: BookOutput;
  CreateChapterDataInput: CreateChapterDataInput;
  CreateChapterInput: CreateChapterInput;
  UpdateChapterDataInput: UpdateChapterDataInput;
  UpdateChapterInput: UpdateChapterInput;
  ChapterOutput: ChapterOutput;
  CreateCollectionDataInput: CreateCollectionDataInput;
  CreateCollectionInput: CreateCollectionInput;
  UpdateCollectionDataInput: UpdateCollectionDataInput;
  UpdateCollectionInput: UpdateCollectionInput;
  CollectionOutput: CollectionOutput;
  CreateCommentModeratorActionDataInput: CreateCommentModeratorActionDataInput;
  CreateCommentModeratorActionInput: CreateCommentModeratorActionInput;
  UpdateCommentModeratorActionDataInput: UpdateCommentModeratorActionDataInput;
  UpdateCommentModeratorActionInput: UpdateCommentModeratorActionInput;
  CommentModeratorActionOutput: CommentModeratorActionOutput;
  CreateCommentDataInput: CreateCommentDataInput;
  CreateCommentInput: CreateCommentInput;
  UpdateCommentDataInput: UpdateCommentDataInput;
  UpdateCommentInput: UpdateCommentInput;
  CommentOutput: CommentOutput;
  CreateConversationDataInput: CreateConversationDataInput;
  CreateConversationInput: CreateConversationInput;
  UpdateConversationDataInput: UpdateConversationDataInput;
  UpdateConversationInput: UpdateConversationInput;
  ConversationOutput: ConversationOutput;
  CreateCurationNoticeDataInput: CreateCurationNoticeDataInput;
  CreateCurationNoticeInput: CreateCurationNoticeInput;
  UpdateCurationNoticeDataInput: UpdateCurationNoticeDataInput;
  UpdateCurationNoticeInput: UpdateCurationNoticeInput;
  CurationNoticeOutput: CurationNoticeOutput;
  CreateDialogueMatchPreferenceDataInput: CreateDialogueMatchPreferenceDataInput;
  CreateDialogueMatchPreferenceInput: CreateDialogueMatchPreferenceInput;
  UpdateDialogueMatchPreferenceDataInput: UpdateDialogueMatchPreferenceDataInput;
  UpdateDialogueMatchPreferenceInput: UpdateDialogueMatchPreferenceInput;
  DialogueMatchPreferenceOutput: DialogueMatchPreferenceOutput;
  CreateDigestPostDataInput: CreateDigestPostDataInput;
  CreateDigestPostInput: CreateDigestPostInput;
  UpdateDigestPostDataInput: UpdateDigestPostDataInput;
  UpdateDigestPostInput: UpdateDigestPostInput;
  DigestPostOutput: DigestPostOutput;
  CreateDigestDataInput: CreateDigestDataInput;
  CreateDigestInput: CreateDigestInput;
  UpdateDigestDataInput: UpdateDigestDataInput;
  UpdateDigestInput: UpdateDigestInput;
  DigestOutput: DigestOutput;
  CreateElectionCandidateDataInput: CreateElectionCandidateDataInput;
  CreateElectionCandidateInput: CreateElectionCandidateInput;
  UpdateElectionCandidateDataInput: UpdateElectionCandidateDataInput;
  UpdateElectionCandidateInput: UpdateElectionCandidateInput;
  ElectionCandidateOutput: ElectionCandidateOutput;
  CreateElectionVoteDataInput: CreateElectionVoteDataInput;
  CreateElectionVoteInput: CreateElectionVoteInput;
  UpdateElectionVoteDataInput: UpdateElectionVoteDataInput;
  UpdateElectionVoteInput: UpdateElectionVoteInput;
  ElectionVoteOutput: ElectionVoteOutput;
  CreateElicitQuestionDataInput: CreateElicitQuestionDataInput;
  CreateElicitQuestionInput: CreateElicitQuestionInput;
  UpdateElicitQuestionDataInput: UpdateElicitQuestionDataInput;
  UpdateElicitQuestionInput: UpdateElicitQuestionInput;
  ElicitQuestionOutput: ElicitQuestionOutput;
  CreateForumEventDataInput: CreateForumEventDataInput;
  CreateForumEventInput: CreateForumEventInput;
  UpdateForumEventDataInput: UpdateForumEventDataInput;
  UpdateForumEventInput: UpdateForumEventInput;
  ForumEventOutput: ForumEventOutput;
  CreateGardenCodeDataInput: CreateGardenCodeDataInput;
  CreateGardenCodeInput: CreateGardenCodeInput;
  UpdateGardenCodeDataInput: UpdateGardenCodeDataInput;
  UpdateGardenCodeInput: UpdateGardenCodeInput;
  GardenCodeOutput: GardenCodeOutput;
  CreateGoogleServiceAccountSessionDataInput: CreateGoogleServiceAccountSessionDataInput;
  CreateGoogleServiceAccountSessionInput: CreateGoogleServiceAccountSessionInput;
  UpdateGoogleServiceAccountSessionDataInput: UpdateGoogleServiceAccountSessionDataInput;
  UpdateGoogleServiceAccountSessionInput: UpdateGoogleServiceAccountSessionInput;
  GoogleServiceAccountSessionOutput: GoogleServiceAccountSessionOutput;
  CreateJargonTermDataInput: CreateJargonTermDataInput;
  CreateJargonTermInput: CreateJargonTermInput;
  UpdateJargonTermDataInput: UpdateJargonTermDataInput;
  UpdateJargonTermInput: UpdateJargonTermInput;
  JargonTermOutput: JargonTermOutput;
  CreateLWEventDataInput: CreateLWEventDataInput;
  CreateLWEventInput: CreateLWEventInput;
  UpdateLWEventDataInput: UpdateLWEventDataInput;
  UpdateLWEventInput: UpdateLWEventInput;
  LWEventOutput: LWEventOutput;
  UpdateLlmConversationDataInput: UpdateLlmConversationDataInput;
  UpdateLlmConversationInput: UpdateLlmConversationInput;
  LlmConversationOutput: LlmConversationOutput;
  CreateLocalgroupDataInput: CreateLocalgroupDataInput;
  CreateLocalgroupInput: CreateLocalgroupInput;
  UpdateLocalgroupDataInput: UpdateLocalgroupDataInput;
  UpdateLocalgroupInput: UpdateLocalgroupInput;
  LocalgroupOutput: LocalgroupOutput;
  CreateMessageDataInput: CreateMessageDataInput;
  CreateMessageInput: CreateMessageInput;
  UpdateMessageDataInput: UpdateMessageDataInput;
  UpdateMessageInput: UpdateMessageInput;
  MessageOutput: MessageOutput;
  CreateModerationTemplateDataInput: CreateModerationTemplateDataInput;
  CreateModerationTemplateInput: CreateModerationTemplateInput;
  UpdateModerationTemplateDataInput: UpdateModerationTemplateDataInput;
  UpdateModerationTemplateInput: UpdateModerationTemplateInput;
  ModerationTemplateOutput: ModerationTemplateOutput;
  CreateModeratorActionDataInput: CreateModeratorActionDataInput;
  CreateModeratorActionInput: CreateModeratorActionInput;
  UpdateModeratorActionDataInput: UpdateModeratorActionDataInput;
  UpdateModeratorActionInput: UpdateModeratorActionInput;
  ModeratorActionOutput: ModeratorActionOutput;
  CreateMultiDocumentDataInput: CreateMultiDocumentDataInput;
  CreateMultiDocumentInput: CreateMultiDocumentInput;
  UpdateMultiDocumentDataInput: UpdateMultiDocumentDataInput;
  UpdateMultiDocumentInput: UpdateMultiDocumentInput;
  MultiDocumentOutput: MultiDocumentOutput;
  CreateNotificationDataInput: CreateNotificationDataInput;
  CreateNotificationInput: CreateNotificationInput;
  UpdateNotificationDataInput: UpdateNotificationDataInput;
  UpdateNotificationInput: UpdateNotificationInput;
  NotificationOutput: NotificationOutput;
  CreatePetrovDayActionDataInput: CreatePetrovDayActionDataInput;
  CreatePetrovDayActionInput: CreatePetrovDayActionInput;
  PetrovDayActionOutput: PetrovDayActionOutput;
  CreatePodcastEpisodeDataInput: CreatePodcastEpisodeDataInput;
  CreatePodcastEpisodeInput: CreatePodcastEpisodeInput;
  UpdatePodcastEpisodeDataInput: UpdatePodcastEpisodeDataInput;
  UpdatePodcastEpisodeInput: UpdatePodcastEpisodeInput;
  PodcastEpisodeOutput: PodcastEpisodeOutput;
  CreatePostEmbeddingDataInput: CreatePostEmbeddingDataInput;
  CreatePostEmbeddingInput: CreatePostEmbeddingInput;
  UpdatePostEmbeddingDataInput: UpdatePostEmbeddingDataInput;
  UpdatePostEmbeddingInput: UpdatePostEmbeddingInput;
  PostEmbeddingOutput: PostEmbeddingOutput;
  CreatePostViewTimeDataInput: CreatePostViewTimeDataInput;
  CreatePostViewTimeInput: CreatePostViewTimeInput;
  UpdatePostViewTimeDataInput: UpdatePostViewTimeDataInput;
  UpdatePostViewTimeInput: UpdatePostViewTimeInput;
  PostViewTimeOutput: PostViewTimeOutput;
  CreatePostViewsDataInput: CreatePostViewsDataInput;
  CreatePostViewsInput: CreatePostViewsInput;
  UpdatePostViewsDataInput: UpdatePostViewsDataInput;
  UpdatePostViewsInput: UpdatePostViewsInput;
  PostViewsOutput: PostViewsOutput;
  CreatePostDataInput: CreatePostDataInput;
  CreatePostInput: CreatePostInput;
  UpdatePostDataInput: UpdatePostDataInput;
  UpdatePostInput: UpdatePostInput;
  PostOutput: PostOutput;
  CreateRSSFeedDataInput: CreateRSSFeedDataInput;
  CreateRSSFeedInput: CreateRSSFeedInput;
  UpdateRSSFeedDataInput: UpdateRSSFeedDataInput;
  UpdateRSSFeedInput: UpdateRSSFeedInput;
  RSSFeedOutput: RSSFeedOutput;
  CreateReportDataInput: CreateReportDataInput;
  CreateReportInput: CreateReportInput;
  UpdateReportDataInput: UpdateReportDataInput;
  UpdateReportInput: UpdateReportInput;
  ReportOutput: ReportOutput;
  UpdateRevisionDataInput: UpdateRevisionDataInput;
  UpdateRevisionInput: UpdateRevisionInput;
  RevisionOutput: RevisionOutput;
  CreateSequenceDataInput: CreateSequenceDataInput;
  CreateSequenceInput: CreateSequenceInput;
  UpdateSequenceDataInput: UpdateSequenceDataInput;
  UpdateSequenceInput: UpdateSequenceInput;
  SequenceOutput: SequenceOutput;
  CreateSplashArtCoordinateDataInput: CreateSplashArtCoordinateDataInput;
  CreateSplashArtCoordinateInput: CreateSplashArtCoordinateInput;
  UpdateSplashArtCoordinateDataInput: UpdateSplashArtCoordinateDataInput;
  UpdateSplashArtCoordinateInput: UpdateSplashArtCoordinateInput;
  SplashArtCoordinateOutput: SplashArtCoordinateOutput;
  CreateSpotlightDataInput: CreateSpotlightDataInput;
  CreateSpotlightInput: CreateSpotlightInput;
  UpdateSpotlightDataInput: UpdateSpotlightDataInput;
  UpdateSpotlightInput: UpdateSpotlightInput;
  SpotlightOutput: SpotlightOutput;
  CreateSubscriptionDataInput: CreateSubscriptionDataInput;
  CreateSubscriptionInput: CreateSubscriptionInput;
  SubscriptionOutput: SubscriptionOutput;
  CreateSurveyQuestionDataInput: CreateSurveyQuestionDataInput;
  CreateSurveyQuestionInput: CreateSurveyQuestionInput;
  UpdateSurveyQuestionDataInput: UpdateSurveyQuestionDataInput;
  UpdateSurveyQuestionInput: UpdateSurveyQuestionInput;
  SurveyQuestionOutput: SurveyQuestionOutput;
  CreateSurveyResponseDataInput: CreateSurveyResponseDataInput;
  CreateSurveyResponseInput: CreateSurveyResponseInput;
  UpdateSurveyResponseDataInput: UpdateSurveyResponseDataInput;
  UpdateSurveyResponseInput: UpdateSurveyResponseInput;
  SurveyResponseOutput: SurveyResponseOutput;
  CreateSurveyScheduleDataInput: CreateSurveyScheduleDataInput;
  CreateSurveyScheduleInput: CreateSurveyScheduleInput;
  UpdateSurveyScheduleDataInput: UpdateSurveyScheduleDataInput;
  UpdateSurveyScheduleInput: UpdateSurveyScheduleInput;
  SurveyScheduleOutput: SurveyScheduleOutput;
  CreateSurveyDataInput: CreateSurveyDataInput;
  CreateSurveyInput: CreateSurveyInput;
  UpdateSurveyDataInput: UpdateSurveyDataInput;
  UpdateSurveyInput: UpdateSurveyInput;
  SurveyOutput: SurveyOutput;
  CreateTagFlagDataInput: CreateTagFlagDataInput;
  CreateTagFlagInput: CreateTagFlagInput;
  UpdateTagFlagDataInput: UpdateTagFlagDataInput;
  UpdateTagFlagInput: UpdateTagFlagInput;
  TagFlagOutput: TagFlagOutput;
  CreateTagRelDataInput: CreateTagRelDataInput;
  CreateTagRelInput: CreateTagRelInput;
  UpdateTagRelDataInput: UpdateTagRelDataInput;
  UpdateTagRelInput: UpdateTagRelInput;
  TagRelOutput: TagRelOutput;
  CreateTagDataInput: CreateTagDataInput;
  CreateTagInput: CreateTagInput;
  UpdateTagDataInput: UpdateTagDataInput;
  UpdateTagInput: UpdateTagInput;
  TagOutput: TagOutput;
  CreateUserEAGDetailDataInput: CreateUserEAGDetailDataInput;
  CreateUserEAGDetailInput: CreateUserEAGDetailInput;
  UpdateUserEAGDetailDataInput: UpdateUserEAGDetailDataInput;
  UpdateUserEAGDetailInput: UpdateUserEAGDetailInput;
  UserEAGDetailOutput: UserEAGDetailOutput;
  CreateUserJobAdDataInput: CreateUserJobAdDataInput;
  CreateUserJobAdInput: CreateUserJobAdInput;
  UpdateUserJobAdDataInput: UpdateUserJobAdDataInput;
  UpdateUserJobAdInput: UpdateUserJobAdInput;
  UserJobAdOutput: UserJobAdOutput;
  CreateUserMostValuablePostDataInput: CreateUserMostValuablePostDataInput;
  CreateUserMostValuablePostInput: CreateUserMostValuablePostInput;
  UpdateUserMostValuablePostDataInput: UpdateUserMostValuablePostDataInput;
  UpdateUserMostValuablePostInput: UpdateUserMostValuablePostInput;
  UserMostValuablePostOutput: UserMostValuablePostOutput;
  CreateUserRateLimitDataInput: CreateUserRateLimitDataInput;
  CreateUserRateLimitInput: CreateUserRateLimitInput;
  UpdateUserRateLimitDataInput: UpdateUserRateLimitDataInput;
  UpdateUserRateLimitInput: UpdateUserRateLimitInput;
  UserRateLimitOutput: UserRateLimitOutput;
  CreateUserTagRelDataInput: CreateUserTagRelDataInput;
  CreateUserTagRelInput: CreateUserTagRelInput;
  UpdateUserTagRelDataInput: UpdateUserTagRelDataInput;
  UpdateUserTagRelInput: UpdateUserTagRelInput;
  UserTagRelOutput: UserTagRelOutput;
  CreateUserDataInput: CreateUserDataInput;
  CreateUserInput: CreateUserInput;
  UpdateUserDataInput: UpdateUserDataInput;
  UpdateUserInput: UpdateUserInput;
  UserOutput: UserOutput;
}

interface CreateInputsByCollectionName {
  AdvisorRequests: CreateAdvisorRequestInput;
  ArbitalTagContentRels: CreateArbitalTagContentRelInput;
  Bans: CreateBanInput;
  Books: CreateBookInput;
  Chapters: CreateChapterInput;
  Collections: CreateCollectionInput;
  CommentModeratorActions: CreateCommentModeratorActionInput;
  Comments: CreateCommentInput;
  Conversations: CreateConversationInput;
  CurationNotices: CreateCurationNoticeInput;
  DialogueMatchPreferences: CreateDialogueMatchPreferenceInput;
  DigestPosts: CreateDigestPostInput;
  Digests: CreateDigestInput;
  ElectionCandidates: CreateElectionCandidateInput;
  ElectionVotes: CreateElectionVoteInput;
  ElicitQuestions: CreateElicitQuestionInput;
  ForumEvents: CreateForumEventInput;
  GardenCodes: CreateGardenCodeInput;
  GoogleServiceAccountSessions: CreateGoogleServiceAccountSessionInput;
  JargonTerms: CreateJargonTermInput;
  LWEvents: CreateLWEventInput;
  Localgroups: CreateLocalgroupInput;
  Messages: CreateMessageInput;
  ModerationTemplates: CreateModerationTemplateInput;
  ModeratorActions: CreateModeratorActionInput;
  MultiDocuments: CreateMultiDocumentInput;
  Notifications: CreateNotificationInput;
  PetrovDayActions: CreatePetrovDayActionInput;
  PodcastEpisodes: CreatePodcastEpisodeInput;
  PostEmbeddings: CreatePostEmbeddingInput;
  PostViewTimes: CreatePostViewTimeInput;
  PostViews: CreatePostViewsInput;
  Posts: CreatePostInput;
  RSSFeeds: CreateRSSFeedInput;
  Reports: CreateReportInput;
  Sequences: CreateSequenceInput;
  SplashArtCoordinates: CreateSplashArtCoordinateInput;
  Spotlights: CreateSpotlightInput;
  Subscriptions: CreateSubscriptionInput;
  SurveyQuestions: CreateSurveyQuestionInput;
  SurveyResponses: CreateSurveyResponseInput;
  SurveySchedules: CreateSurveyScheduleInput;
  Surveys: CreateSurveyInput;
  TagFlags: CreateTagFlagInput;
  TagRels: CreateTagRelInput;
  Tags: CreateTagInput;
  UserEAGDetails: CreateUserEAGDetailInput;
  UserJobAds: CreateUserJobAdInput;
  UserMostValuablePosts: CreateUserMostValuablePostInput;
  UserRateLimits: CreateUserRateLimitInput;
  UserTagRels: CreateUserTagRelInput;
  Users: CreateUserInput;
  ArbitalCaches: never;
  CkEditorUserSessions: never;
  ClientIds: never;
  CronHistories: never;
  CurationEmails: never;
  DatabaseMetadata: never;
  DebouncerEvents: never;
  DialogueChecks: never;
  ElicitQuestionPredictions: never;
  EmailTokens: never;
  FeaturedResources: never;
  FieldChanges: never;
  Images: never;
  LegacyData: never;
  LlmConversations: never;
  LlmMessages: never;
  ManifoldProbabilitiesCaches: never;
  Migrations: never;
  PageCache: never;
  PetrovDayLaunchs: never;
  Podcasts: never;
  PostRecommendations: never;
  PostRelations: never;
  ReadStatuses: never;
  RecommendationsCaches: never;
  ReviewVotes: never;
  ReviewWinnerArts: never;
  ReviewWinners: never;
  Revisions: never;
  Sessions: never;
  SideCommentCaches: never;
  Tweets: never;
  TypingIndicators: never;
  UserActivities: never;
  Votes: never;
}

interface UpdateInputsByCollectionName {
  AdvisorRequests: UpdateAdvisorRequestInput;
  ArbitalTagContentRels: UpdateArbitalTagContentRelInput;
  Bans: UpdateBanInput;
  Books: UpdateBookInput;
  Chapters: UpdateChapterInput;
  Collections: UpdateCollectionInput;
  CommentModeratorActions: UpdateCommentModeratorActionInput;
  Comments: UpdateCommentInput;
  Conversations: UpdateConversationInput;
  CurationNotices: UpdateCurationNoticeInput;
  DialogueMatchPreferences: UpdateDialogueMatchPreferenceInput;
  DigestPosts: UpdateDigestPostInput;
  Digests: UpdateDigestInput;
  ElectionCandidates: UpdateElectionCandidateInput;
  ElectionVotes: UpdateElectionVoteInput;
  ElicitQuestions: UpdateElicitQuestionInput;
  ForumEvents: UpdateForumEventInput;
  GardenCodes: UpdateGardenCodeInput;
  GoogleServiceAccountSessions: UpdateGoogleServiceAccountSessionInput;
  JargonTerms: UpdateJargonTermInput;
  LWEvents: UpdateLWEventInput;
  LlmConversations: UpdateLlmConversationInput;
  Localgroups: UpdateLocalgroupInput;
  Messages: UpdateMessageInput;
  ModerationTemplates: UpdateModerationTemplateInput;
  ModeratorActions: UpdateModeratorActionInput;
  MultiDocuments: UpdateMultiDocumentInput;
  Notifications: UpdateNotificationInput;
  PodcastEpisodes: UpdatePodcastEpisodeInput;
  PostEmbeddings: UpdatePostEmbeddingInput;
  PostViewTimes: UpdatePostViewTimeInput;
  PostViews: UpdatePostViewsInput;
  Posts: UpdatePostInput;
  RSSFeeds: UpdateRSSFeedInput;
  Reports: UpdateReportInput;
  Revisions: UpdateRevisionInput;
  Sequences: UpdateSequenceInput;
  SplashArtCoordinates: UpdateSplashArtCoordinateInput;
  Spotlights: UpdateSpotlightInput;
  SurveyQuestions: UpdateSurveyQuestionInput;
  SurveyResponses: UpdateSurveyResponseInput;
  SurveySchedules: UpdateSurveyScheduleInput;
  Surveys: UpdateSurveyInput;
  TagFlags: UpdateTagFlagInput;
  TagRels: UpdateTagRelInput;
  Tags: UpdateTagInput;
  UserEAGDetails: UpdateUserEAGDetailInput;
  UserJobAds: UpdateUserJobAdInput;
  UserMostValuablePosts: UpdateUserMostValuablePostInput;
  UserRateLimits: UpdateUserRateLimitInput;
  UserTagRels: UpdateUserTagRelInput;
  Users: UpdateUserInput;
  ArbitalCaches: never;
  CkEditorUserSessions: never;
  ClientIds: never;
  CronHistories: never;
  CurationEmails: never;
  DatabaseMetadata: never;
  DebouncerEvents: never;
  DialogueChecks: never;
  ElicitQuestionPredictions: never;
  EmailTokens: never;
  FeaturedResources: never;
  FieldChanges: never;
  Images: never;
  LegacyData: never;
  LlmMessages: never;
  ManifoldProbabilitiesCaches: never;
  Migrations: never;
  PageCache: never;
  PetrovDayActions: never;
  PetrovDayLaunchs: never;
  Podcasts: never;
  PostRecommendations: never;
  PostRelations: never;
  ReadStatuses: never;
  RecommendationsCaches: never;
  ReviewVotes: never;
  ReviewWinnerArts: never;
  ReviewWinners: never;
  Sessions: never;
  SideCommentCaches: never;
  Subscriptions: never;
  Tweets: never;
  TypingIndicators: never;
  UserActivities: never;
  Votes: never;
}
