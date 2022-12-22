import PostRelationsRepo from "./PostRelationsRepo";
import VotesRepo from "./VotesRepo";

declare global {
  type Repos = ReturnType<typeof getAllRepos>;
}

const getAllRepos = () => ({
  postRelations: new PostRelationsRepo(),
  votes: new VotesRepo(),
} as const);

export {
  PostRelationsRepo,
  VotesRepo,
  getAllRepos,
};
