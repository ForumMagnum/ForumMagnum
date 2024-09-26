import { PetrovDayLaunchs } from "@/lib/collections/petrovDayLaunchs";
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../vulcan-lib";
import { petrovDayLaunchCode } from "@/components/seasonal/PetrovDayButton";
import PetrovDayActions from "@/lib/collections/petrovDayActions/collection";
import { petrovBeforeTime } from "@/components/Layout";
import { DatabaseServerSetting } from "../databaseSettings";
import sample from "lodash/sample";

const petrovFalseAlarmMissileCount = new DatabaseServerSetting<number[]>('petrovFalseAlarmMissileCount', [])
const petrovRealAttackMissileCount = new DatabaseServerSetting<number[]>('petrovRealAttackMissileCount', [])

const getIncomingCount = (incoming: boolean) => {
  if (incoming) {
    return sample(petrovRealAttackMissileCount.get())
  } else {
    return sample(petrovFalseAlarmMissileCount.get())
  }
}

const PetrovDay2024CheckNumberOfIncomingData = `type PetrovDay2024CheckNumberOfIncomingData {
  count: Int
}`

addGraphQLSchema(PetrovDay2024CheckNumberOfIncomingData);

const petrovDay2024Resolvers = {
  Query: {
    async PetrovDay2024CheckNumberOfIncoming(root: void, context: ResolverContext) {
      const startTime = new Date(petrovBeforeTime.get())
      const actions = await PetrovDayActions.find({createdAt: {$gte: startTime}, actionType: {$ne: 'optIn'}}, {limit: 100}).fetch()
      const userRole = actions.find(action => action.userId === context.currentUser?._id)?.data?.role

      if (userRole === 'eastPetrov') {
        const incoming = !!(actions.filter(action => action.data?.role === 'nukeTheEast')?.length > 0)
        return { count: getIncomingCount(incoming) }
      }
      if (userRole === 'westPetrov') {
        const incoming = !!(actions.filter(action => action.data?.role === 'nukeTheWest')?.length > 0)
        return { count: getIncomingCount(incoming) }
      }
      return { count: 0 }
    }
  },
};

addGraphQLResolvers(petrovDay2024Resolvers);

addGraphQLQuery('PetrovDay2024CheckNumberOfIncoming: PetrovDay2024CheckNumberOfIncomingData');
