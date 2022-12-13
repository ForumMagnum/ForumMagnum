import PostRelationsRepo from "./PostRelationsRepo";

declare global {
  type Repos = ReturnType<typeof getAllRepos>;
}

const getAllRepos = () => ({
  postRelations: new PostRelationsRepo(),
} as const);

export {
  PostRelationsRepo,
  getAllRepos,
};
