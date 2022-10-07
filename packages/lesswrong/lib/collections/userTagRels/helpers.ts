import { createMutator, updateMutator } from "../../../server/vulcan-lib/mutators";
import UserTagRels from "./collection";

export async function recordSubforumView(userId: string, tagId: string) {
  const existingRel = await UserTagRels.findOne({userId, tagId});
  if (existingRel) {
    await updateMutator({
      collection: UserTagRels,
      documentId: existingRel._id,
      set: {subforumLastVisitedAt: new Date()},
      validate: false,
    })
  } else {
    await createMutator({
      collection: UserTagRels,
      document: {userId, tagId, subforumLastVisitedAt: new Date()},
      validate: false,
    })
  }
}
