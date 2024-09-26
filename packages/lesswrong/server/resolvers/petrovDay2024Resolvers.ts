import { PetrovDayLaunchs } from "@/lib/collections/petrovDayLaunchs";
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers } from "../vulcan-lib";
import { petrovDayLaunchCode } from "@/components/seasonal/PetrovDayButton";
import PetrovDayActions from "@/lib/collections/petrovDayActions/collection";
import { petrovBeforeTime } from "@/components/Layout";

const petrovDayLaunchResolvers = {
  Query: {
    async PetrovDay2024CheckNumberOfIncoming(root: void, context: ResolverContext) {
      const startTime = petrovBeforeTime.get()
      const actions = await PetrovDayActions.find({createdAt: {$gte: startTime}, actionType: {$ne: 'optIn'}}, {limit: 100}).fetch()
      const userRole = actions.find(action => action.userId === context.currentUser?._id)?.data?.role

      console.log(context.currentUser?.displayName)
      console.log(userRole)

      context.currentUser
      const launches = await PetrovDayActions.find({}).fetch()


      return { launched: false }
    }
  },
};

addGraphQLResolvers(petrovDayLaunchResolvers);

addGraphQLQuery('PetrovDay2024CheckNumberOfIncoming: PetrovDay2024CheckNumberOfIncomingData');
