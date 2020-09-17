import { PetrovDayLaunchs, ReviewVotes } from "../..";
// import fetch from 'node-fetch'
// import { DatabaseServerSetting } from '../databaseSettings';

import { addGraphQLSchema, addGraphQLResolvers, addGraphQLMutation, addGraphQLQuery, Utils } from "../../vulcan-lib";

const PetrovDayCheckIfIncoming = `type PetrovDayCheckIfIncomingData {
  launched: Boolean
}` 

addGraphQLSchema(PetrovDayCheckIfIncoming);

const PetrovDayLaunchMissile = `type PetrovDayLaunchMissileData {
  launchCode: Boolean
  createdAt: Date
}` 

addGraphQLSchema(PetrovDayLaunchMissile);

const petrovDayLaunchResolvers = {
  Query: {
    async PetrovDayCheckIfIncoming(root, { }, context: ResolverContext) {
      const s = PetrovDayLaunchs.find().fetch()
      console.log("ASDF", s)
      return {
        launched: true
      }
    }
  },
  Mutation: {
    async PetrovDayLaunchMissile(root, { launchCode }, context: ResolverContext) {
      const { currentUser } = context 
      const newLaunch = await Utils.createMutator({
        collection: PetrovDayLaunchs,
        document: { launchCode },
        validate: false,
        currentUser,
      });
      return newLaunch.data
    }
  }
};

addGraphQLResolvers(petrovDayLaunchResolvers);

addGraphQLQuery('PetrovDayCheckIfIncoming: PetrovDayCheckIfIncomingData');
addGraphQLMutation('PetrovDayLaunchMissile(launchCode: String): PetrovDayLaunchMissileData');

