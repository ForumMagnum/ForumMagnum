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
  // We don't wrap DatabaseMetadataRepo because it's used during server startup, and the perf metric code depends on database settings which it itself is responsible for loading
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

// function wrapMethods<T extends typeof repoClasses[number]>(targetClass: T) {
//   const methodNames = Object.getOwnPropertyNames(targetClass.prototype);

//   methodNames.forEach(methodName => {
//       // @ts-ignore - TS really doesn't like index access on unions of multiple class prototypes
//       const originalMethod = targetClass.prototype[methodName];

//       if (typeof originalMethod === 'function' && methodName !== 'constructor') {
//         // @ts-ignore - TS really doesn't like index access on unions of multiple class prototypes
//         targetClass.prototype[methodName] = wrapWithPerfMetrics(originalMethod, targetClass.name, methodName);
//       }
//   });
// }

// function wrapWithPerfMetrics(method: Function, repoName: string, methodName: string) {
//   return function (this: AnyBecauseHard, ...args: AnyBecauseHard[]) {
//     const asyncContext = asyncLocalStorage.getStore();

//     let parentTraceIdField;
//     if (asyncContext) {
//       parentTraceIdField = { parent_trace_id: asyncContext.get('context')?.perfMetric?.trace_id }
//     } else {
//       parentTraceIdField = {};
//     }

//     const opName = `${repoName}.${methodName}`;

//     const startedDbRepoMetric = openPerfMetric({
//       op_type: 'db_repo_method',
//       op_name: opName,
//       ...parentTraceIdField
//     });

//     const results = method.apply(this, args);
//     // Not all methods on Repos return promises.
//     // The naive method of accomplishing this would just be `const results = await method.apply(...)`
//     // But this would require this closure to be an async function
//     // Since this function is wrapping functions in Repos, it needs to not accidentally cause them to return promises if they weren't already doing so
//     // That would break anything which called those functions and expected a sensible result (rather than a promise)
//     if (results instanceof Promise) {
//       return results.then(res => {
//         closePerfMetric(startedDbRepoMetric);
//         return res;
//       });
//     }

//     return results;
//   };
// }

// // We immediately run this when this module is imported, since we need to wrap the class prototypes
// repoClasses.forEach(repo => {
//   wrapMethods(repo);
// });

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
