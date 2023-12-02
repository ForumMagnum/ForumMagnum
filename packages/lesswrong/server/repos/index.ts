import { closePerfMetric, openPerfMetric } from "../perfMetrics";
import CollectionsRepo from "./CollectionsRepo";
import CommentsRepo from "./CommentsRepo";
import ConversationsRepo from "./ConversationsRepo";
import DatabaseMetadataRepo from "./DatabaseMetadataRepo";
import DebouncerEventsRepo from "./DebouncerEventsRepo";
import DialogueChecksRepo from "./DialogueChecksRepo";
import ElectionCandidatesRepo from "./ElectionCandidatesRepo";
import LocalgroupsRepo from "./LocalgroupsRepo";
import PostEmbeddingsRepo from "./PostEmbeddingsRepo";
import PostRecommendationsRepo from "./PostRecommendationsRepo";
import PostRelationsRepo from "./PostRelationsRepo";
import PostsRepo from "./PostsRepo";
import SequencesRepo from "./SequencesRepo";
import TagsRepo from "./TagsRepo";
import UsersRepo from "./UsersRepo";
import VotesRepo from "./VotesRepo";

declare global {
  type Repos = ReturnType<typeof getAllRepos>;
}

const getAllRepos = () => ({
  comments: new CommentsRepo(),
  collections: new CollectionsRepo(),
  conversations: new ConversationsRepo(),
  databaseMetadata: new DatabaseMetadataRepo(),
  debouncerEvents: new DebouncerEventsRepo(),
  dialogueChecks: new DialogueChecksRepo(),
  electionCandidates: new ElectionCandidatesRepo(),
  localgroups: new LocalgroupsRepo(),
  PostEmbeddingsRepo: new PostEmbeddingsRepo(),
  postRecommendations: new PostRecommendationsRepo(),
  postRelations: new PostRelationsRepo(),
  posts: new PostsRepo(),
  sequences: new SequencesRepo(),
  tags: new TagsRepo(),
  users: new UsersRepo(),
  votes: new VotesRepo(),
} as const);

const repoClasses = [
  CommentsRepo,
  ConversationsRepo,
  DatabaseMetadataRepo,
  DebouncerEventsRepo,
  DialogueChecksRepo,
  ElectionCandidatesRepo,
  LocalgroupsRepo,
  PostEmbeddingsRepo,
  PostRecommendationsRepo,
  PostRelationsRepo,
  PostsRepo,
  SequencesRepo,
  TagsRepo,
  UsersRepo,
  VotesRepo,
];

function wrapMethods<T extends typeof repoClasses[number]>(targetClass: T) {
  const methodNames = Object.getOwnPropertyNames(targetClass.prototype);

  methodNames.forEach(methodName => {
      // @ts-ignore - TS really doesn't like index access on unions of multiple class prototypes
      const originalMethod = targetClass.prototype[methodName];

      if (typeof originalMethod === 'function' && methodName !== 'constructor') {
        // @ts-ignore - TS really doesn't like index access on unions of multiple class prototypes
        targetClass.prototype[methodName] = wrapWithPerfMetrics(originalMethod, methodName);
      }
  });
}

function wrapWithPerfMetrics(method: Function, methodName: string) {
  return async function (this: AnyBecauseHard, ...args: AnyBecauseHard[]) {
    const startedDbRepoMetric = openPerfMetric({
      op_type: 'db_repo_method',
      op_name: methodName
    });
    const results = await method.apply(this, args);
    closePerfMetric(startedDbRepoMetric);
    return results;
  };
}

repoClasses.forEach(repo => {
  wrapMethods(repo);
});

export {
  CommentsRepo,
  ConversationsRepo,
  DatabaseMetadataRepo,
  DebouncerEventsRepo,
  DialogueChecksRepo,
  ElectionCandidatesRepo,
  LocalgroupsRepo,
  PostEmbeddingsRepo,
  PostRecommendationsRepo,
  PostRelationsRepo,
  PostsRepo,
  SequencesRepo,
  TagsRepo,
  UsersRepo,
  VotesRepo,
  getAllRepos,
};
