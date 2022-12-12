import PostRelationsRepo from "./PostRelationsRepo";

const getAllRepos = (): Repos => ({
  postRelations: new PostRelationsRepo(),
});

export {
  PostRelationsRepo,
  getAllRepos,
};
