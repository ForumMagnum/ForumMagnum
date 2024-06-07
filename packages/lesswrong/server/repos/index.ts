import CollectionsRepo from "./CollectionsRepo";
import ClientIdsRepo from "./ClientIdsRepo";
import CommentsRepo from "./CommentsRepo";
import ConversationsRepo from "./ConversationsRepo";
import CurationEmailsRepo from "./CurationEmailsRepo";
import DatabaseMetadataRepo from "./DatabaseMetadataRepo";
import DebouncerEventsRepo from "./DebouncerEventsRepo";
import DialogueChecksRepo from "./DialogueChecksRepo";
import ElectionCandidatesRepo from "./ElectionCandidatesRepo";
import ElectionVotesRepo from "./ElectionVotesRepo";
import LocalgroupsRepo from "./LocalgroupsRepo";
import ManifoldProbabilitiesCachesRepo from "./ManifoldProbabilitiesCachesRepo";
import NotificationsRepo from "./NotificationsRepo";
import PageCacheRepo from "./PageCacheRepo";
import PostEmbeddingsRepo from "./PostEmbeddingsRepo";
import PostRecommendationsRepo from "./PostRecommendationsRepo";
import PostRelationsRepo from "./PostRelationsRepo";
import PostViewTimesRepo from "./PostViewTimesRepo";
import PostViewsRepo from "./PostViewsRepo";
import PostsRepo from "./PostsRepo";
import ReadStatusesRepo from "./ReadStatusesRepo";
import RecommendationsCachesRepo from "./RecommendationsCachesRepo";
import ReviewWinnersRepo from "./ReviewWinnersRepo";
import ReviewWinnerArtsRepo from "./ReviewWinnerArtsRepo";
import SequencesRepo from "./SequencesRepo";
import SideCommentCachesRepo from "./SideCommentCachesRepo";
import SplashArtCoordinatesRepo from "./SplashArtCoordinatesRepo";
import SurveysRepo from "./SurveysRepo";
import TagsRepo from "./TagsRepo";
import TypingIndicatorsRepo from "./TypingIndicatorsRepo";
import UsersRepo from "./UsersRepo";
import VotesRepo from "./VotesRepo";

declare global {
  type Repos = ReturnType<typeof getAllRepos>;
}

const getAllRepos = () => ({
  collections: new CollectionsRepo(),
  clientIds: new ClientIdsRepo(),
  comments: new CommentsRepo(),
  conversations: new ConversationsRepo(),
  curationEmails: new CurationEmailsRepo(),
  databaseMetadata: new DatabaseMetadataRepo(),
  debouncerEvents: new DebouncerEventsRepo(),
  dialogueChecks: new DialogueChecksRepo(),
  electionCandidates: new ElectionCandidatesRepo(),
  electionVotes: new ElectionVotesRepo(),
  localgroups: new LocalgroupsRepo(),
  notifications: new NotificationsRepo(),
  postEmbeddings: new PostEmbeddingsRepo(),
  pageCaches: new PageCacheRepo(),
  manifoldProbabilitiesCachesRepo: new ManifoldProbabilitiesCachesRepo(),
  postRecommendations: new PostRecommendationsRepo(),
  postRelations: new PostRelationsRepo(),
  posts: new PostsRepo(),
  postViews: new PostViewsRepo(),
  postViewTimes: new PostViewTimesRepo(),
  readStatuses: new ReadStatusesRepo(),
  recommendationsCaches: new RecommendationsCachesRepo(),
  reviewWinners: new ReviewWinnersRepo(),
  reviewWinnerArts: new ReviewWinnerArtsRepo(),
  sequences: new SequencesRepo(),
  sideComments: new SideCommentCachesRepo(),
  splashArtCoordinates: new SplashArtCoordinatesRepo(),
  surveys: new SurveysRepo(),
  tags: new TagsRepo(),
  typingIndicators: new TypingIndicatorsRepo(),
  users: new UsersRepo(),
  votes: new VotesRepo(),
} as const);

export {
  CollectionsRepo,
  ClientIdsRepo,
  CommentsRepo,
  ConversationsRepo,
  CurationEmailsRepo,
  DatabaseMetadataRepo,
  DebouncerEventsRepo,
  DialogueChecksRepo,
  ElectionCandidatesRepo,
  ElectionVotesRepo,
  LocalgroupsRepo,
  ManifoldProbabilitiesCachesRepo,
  NotificationsRepo,
  PageCacheRepo,
  PostEmbeddingsRepo,
  PostRecommendationsRepo,
  PostRelationsRepo,
  PostsRepo,
  ReadStatusesRepo,
  RecommendationsCachesRepo,
  SequencesRepo,
  SideCommentCachesRepo,
  SplashArtCoordinatesRepo,
  TagsRepo,
  TypingIndicatorsRepo,
  UsersRepo,
  VotesRepo,
  getAllRepos,
};
