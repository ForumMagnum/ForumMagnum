import PostRelationsRepo from "./PostRelationsRepo";

const getAllRepos = (): Repos => ({
  postRelations: PostRelationsRepo.resolve(),
});

export {
  PostRelationsRepo,
  getAllRepos,
};
