import ConversationsRepo from "./ConversationsRepo";
import DatabaseMetadataRepo from "./DatabaseMetadataRepo";
import DebouncerEventsRepo from "./DebouncerEventsRepo";
import LocalgroupsRepo from "./LocalgroupsRepo";
import PostRelationsRepo from "./PostRelationsRepo";
import PostsRepo from "./PostsRepo";
import UsersRepo from "./UsersRepo";
import VotesRepo from "./VotesRepo";

declare global {
  type Repos = ReturnType<typeof getAllRepos>;
}

const getAllRepos = () => ({
  conversations: new ConversationsRepo(),
  databaseMetadata: new DatabaseMetadataRepo(),
  debouncerEvents: new DebouncerEventsRepo(),
  localgroups: new LocalgroupsRepo(),
  postRelations: new PostRelationsRepo(),
  posts: new PostsRepo(),
  users: new UsersRepo(),
  votes: new VotesRepo(),
} as const);

export {
  ConversationsRepo,
  DatabaseMetadataRepo,
  DebouncerEventsRepo,
  LocalgroupsRepo,
  PostRelationsRepo,
  PostsRepo,
  UsersRepo,
  VotesRepo,
  getAllRepos,
};
