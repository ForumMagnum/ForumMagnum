import Users from "../../../lib/collections/users/collection";

export async function postsMoveToAFAddsAlignmentVoting (post: DbPost, oldPost: DbPost) {
  if (post.af && !oldPost.af) {
    await Users.rawUpdateOne({_id:post.userId}, {$addToSet: {groups: 'alignmentVoters'}})
  }
}
