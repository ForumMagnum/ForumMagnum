import PostRelationsRepo from "./PostRelationsRepo";
import PostsRepo from "./PostsRepo";
import VotesRepo from "./VotesRepo";

declare global {
  type Repos = ReturnType<typeof getAllRepos>;
}

const getAllRepos = () => ({
  postRelations: new PostRelationsRepo(),
  posts: new PostsRepo(),
  votes: new VotesRepo(),
} as const);

export {
  PostRelationsRepo,
  PostsRepo,
  VotesRepo,
  getAllRepos,
};
