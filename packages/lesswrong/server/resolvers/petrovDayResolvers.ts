import { PetrovDayLaunchs } from '../../server/collections/petrovDayLaunchs/collection';
import { addGraphQLSchema, addGraphQLResolvers, addGraphQLMutation, addGraphQLQuery } from "../../lib/vulcan-lib/graphql";
import { createMutator, updateMutator } from "../vulcan-lib/mutators";
const crypto = require('crypto');
import { petrovDayLaunchCode } from "../../components/seasonal/PetrovDayButton";
import { userCanLaunchPetrovMissile } from "../../lib/petrovHelpers";


const PetrovDayCheckIfIncoming = `type PetrovDayCheckIfIncomingData {
  launched: Boolean
  createdAt: Date
}`

const hashPetrovCode = (code: string): string => {
  // @ts-ignore
  var hash = crypto.createHash('sha256');
  hash.update(code);
  return hash.digest('base64');
};

addGraphQLSchema(PetrovDayCheckIfIncoming);

const PetrovDayLaunchMissile = `type PetrovDayLaunchMissileData {
  launchCode: String
  createdAt: Date
}`

addGraphQLSchema(PetrovDayLaunchMissile);

const petrovDayLaunchResolvers = {
  Query: {
    async PetrovDayCheckIfIncoming(root: void, context: ResolverContext) {
      const launches = await PetrovDayLaunchs.find().fetch()

      for (const launch of launches) {
        if (launch.launchCode === petrovDayLaunchCode) {
          return { launched: true, createdAt: launch.createdAt }
        }
      }
      return { launched: false }
    }
  },
  Mutation: {
    async PetrovDayLaunchMissile(root: void, {launchCode}: {launchCode: string}, context: ResolverContext) {
      const { currentUser } = context
      if (userCanLaunchPetrovMissile(currentUser)) {
        const newLaunch = await createMutator({
          collection: PetrovDayLaunchs,
          document: {
            launchCode,
            // hashedLaunchCode: hashPetrovCode(launchCode),
            // userId: currentUser._id
          },
          validate: false,
        });
        // await updateMutator({
        //   collection: Users,
        //   documentId: currentUser._id,
        //   data: {
        //     petrovLaunchCodeDate: new Date()
        //   },
        //   validate: false
        // })
        return newLaunch.data
      } else {
        throw new Error("User not authorized to launch")
      }
    } 
  }
};

addGraphQLResolvers(petrovDayLaunchResolvers);

addGraphQLQuery('PetrovDayCheckIfIncoming: PetrovDayCheckIfIncomingData');
addGraphQLMutation('PetrovDayLaunchMissile(launchCode: String): PetrovDayLaunchMissileData');
