import { PetrovDayLaunchs } from "../..";
import fetch from 'node-fetch'

import { addGraphQLSchema, addGraphQLResolvers, addGraphQLMutation, addGraphQLQuery, Utils } from "../../vulcan-lib";

const PetrovDayCheckIfIncoming = `type PetrovDayCheckIfIncomingData {
  launched: Boolean
}`

const hashPetrovCode = (code: string): string => {
  // @ts-ignore
  const crypto = Npm.require('crypto');
  var hash = crypto.createHash('sha256');
  hash.update(code);
  return hash.digest('base64');
};

const hashedCodes = [
  "NyaDNd1pMQRb3N+SYj/4GaZCRLU9DnRtQ4eXNJ1NpXg=",
]

addGraphQLSchema(PetrovDayCheckIfIncoming);

const PetrovDayLaunchMissile = `type PetrovDayLaunchMissileData {
  launchCode: String
  createdAt: Date
}`

addGraphQLSchema(PetrovDayLaunchMissile);

const petrovDayLaunchResolvers = {
  Query: {
    async PetrovDayCheckIfIncoming(root, { external }, context: ResolverContext) {
      if (external) {
        const externalUrl = `http://localhost:3000/graphql?`
        const payload = [{ 
          "operationName": "petrovDayLaunchResolvers", 
          "variables": {}, 
          "query": `query petrovDayLaunchResolvers 
            {\n  PetrovDayCheckIfIncoming(external: false)
              {\n    launched\n    __typename\n  }
            \n}
          \n` 
        }]

        const response = await fetch(externalUrl, {
          "headers": {
            "accept": "application/json",
            "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
            "cache-control": "no-cache",
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
          method: "POST",
          redirect: 'follow'
        });
        const text = await response.text()
        const data = JSON.parse(text)
        return {
          launched: data[0]?.data?.PetrovDayCheckIfIncoming.launched
        }
      }
      const launches = PetrovDayLaunchs.find().fetch()
      for (const launch of launches) {
        if (hashedCodes.includes(launch.hashedLaunchCode)) {
          return { launched: true }
        }
      }
      return { launched: false }
    }
  },
  Mutation: {
    async PetrovDayLaunchMissile(root, { launchCode }, context: ResolverContext) {
      const { currentUser } = context
      const newLaunch = await Utils.createMutator({
        collection: PetrovDayLaunchs,
        document: {
          launchCode,
          hashedLaunchCode: hashPetrovCode(launchCode)
        },
        validate: false,
        currentUser,
      });
      return newLaunch.data
    }
  }
};

addGraphQLResolvers(petrovDayLaunchResolvers);

addGraphQLQuery('PetrovDayCheckIfIncoming(external: Boolean): PetrovDayCheckIfIncomingData');
addGraphQLMutation('PetrovDayLaunchMissile(launchCode: String): PetrovDayLaunchMissileData');

