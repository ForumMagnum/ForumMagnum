import { asyncLocalStorage, closePerfMetric, openPerfMetric } from "../perfMetrics";
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
  // TODO - explain why this isn't included
  // DatabaseMetadataRepo,
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
        targetClass.prototype[methodName] = wrapWithPerfMetrics(originalMethod, methodName, targetClass.name);
      }
  });
}

function wrapWithPerfMetrics(method: Function, methodName: string, repoName: string) {
  return function (this: AnyBecauseHard, ...args: AnyBecauseHard[]) {
    const asyncContext = asyncLocalStorage.getStore();
    if (!asyncContext) {
      console.log('async request context does not exist', repoName, methodName);
    }
    if (asyncContext && !asyncContext.has('context')) {
      console.log('async request context exists, but missing ResolverContext in map', repoName, methodName);
    }
    const parentTraceId = asyncContext ? { parent_trace_id: asyncContext.get('context')?.perfMetric?.trace_id } : {};
    const startedDbRepoMetric = openPerfMetric({
      op_type: 'db_repo_method',
      op_name: `${repoName}.${methodName}`,
      ...parentTraceId
    });
    const results = method.apply(this, args);
    // TODO - document this
    if (results instanceof Promise) {
      return results.then(res => {
        closePerfMetric(startedDbRepoMetric);
        return res;
      });
    }

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
