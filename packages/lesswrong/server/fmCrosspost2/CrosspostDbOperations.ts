import Users from "../../lib/collections/users/collection";

class CrosspostDbOperations {
  async setForeignUserId(localUserId: string, foreignUserId: string) {
    await Users.rawUpdateOne({_id: foreignUserId}, {
      $set: {fmCrosspostUserId: localUserId},
    });
  }
}

export default CrosspostDbOperations;
