import { asyncLocalStorage, closePerfMetric, openPerfMetric } from "../perfMetrics";
import CollectionsRepo from "./CollectionsRepo";
import CommentsRepo from "./CommentsRepo";
import ConversationsRepo from "./ConversationsRepo";
import DatabaseMetadataRepo from "./DatabaseMetadataRepo";
import DebouncerEventsRepo from "./DebouncerEventsRepo";
import DialogueChecksRepo from "./DialogueChecksRepo";
import ElectionCandidatesRepo from "./ElectionCandidatesRepo";
import LocalgroupsRepo from "./LocalgroupsRepo";
import PageCacheRepo from "./PageCacheRepo";
import PostEmbeddingsRepo from "./PostEmbeddingsRepo";
import PostRecommendationsRepo from "./PostRecommendationsRepo";
import PostRelationsRepo from "./PostRelationsRepo";
import PostsRepo from "./PostsRepo";
import SequencesRepo from "./SequencesRepo";
import TagsRepo from "./TagsRepo";
import TypingIndicatorsRepo from "./TypingIndicatorsRepo";
import UsersRepo from "./UsersRepo";
import VotesRepo from "./VotesRepo";

declare global {
  type Repos = ReturnType<typeof getAllRepos>;
}

const getAllRepos = () => ({
  collections: new CollectionsRepo(),
  comments: new CommentsRepo(),
  conversations: new ConversationsRepo(),
  databaseMetadata: new DatabaseMetadataRepo(),
  debouncerEvents: new DebouncerEventsRepo(),
  dialogueChecks: new DialogueChecksRepo(),
  electionCandidates: new ElectionCandidatesRepo(),
  localgroups: new LocalgroupsRepo(),
  pageCaches: new PageCacheRepo(),
  PostEmbeddingsRepo: new PostEmbeddingsRepo(),
  postRecommendations: new PostRecommendationsRepo(),
  postRelations: new PostRelationsRepo(),
  posts: new PostsRepo(),
  sequences: new SequencesRepo(),
  tags: new TagsRepo(),
  typingIndicators: new TypingIndicatorsRepo(),
  users: new UsersRepo(),
  votes: new VotesRepo(),
} as const);

export {
  CollectionsRepo,
  CommentsRepo,
  ConversationsRepo,
  DatabaseMetadataRepo,
  DebouncerEventsRepo,
  DialogueChecksRepo,
  ElectionCandidatesRepo,
  LocalgroupsRepo,
  PageCacheRepo,
  PostEmbeddingsRepo,
  PostRecommendationsRepo,
  PostRelationsRepo,
  PostsRepo,
  SequencesRepo,
  TagsRepo,
  TypingIndicatorsRepo,
  UsersRepo,
  VotesRepo,
  getAllRepos,
};
