import { createMutator } from "../../../server/vulcan-lib/mutators";
import UserTagRels from "./collection";

export async function registerSubforumView(userId: string, tagId: string) {
  const existingRel = await UserTagRels.findOne({userId, tagId});
  if (existingRel) {
    await UserTagRels.rawUpdateOne({_id: existingRel._id}, {$set: {subforumLastVisitedAt: new Date()}});
  } else {
    await createMutator({
      collection: UserTagRels,
      document: {userId, tagId, subforumLastVisitedAt: new Date()},
      validate: false,
      currentUser: null
    })
  }
}