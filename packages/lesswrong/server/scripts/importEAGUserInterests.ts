import fs from 'mz/fs';
import Papa from 'papaparse';
import Users from '../../lib/collections/users/collection';
import { updateMutator, Vulcan } from '../vulcan-lib';
import { wrapVulcanAsyncScript } from './utils';
import UserEAGDetails from '../../lib/collections/userEAGDetails/collection';

/**
 * Given a CSV with users' Email, Experience, and Interest data from EAG,
 * import it to the users' "experiencedIn" and "interestedIn".
 *
 * TODO: Prob no longer needed, delete
 */
Vulcan.importEAGUserInterests = wrapVulcanAsyncScript(
  'importEAGUserInterests',
  async (fileName='EAG_users.csv') => {
    fs.createReadStream(fileName)
      .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, {header: true, delimiter: ','}))
      .on("data", async data => {
        // do a simple check to see if we have a user with this email address
        const user = await Users.findOne({email: data.Email})
        if (!user) return
        
        // replace any existing data with the imported data
        void updateMutator({
          collection: Users,
          documentId: user._id,
          set: {
            experiencedIn: data.Experience.split('; '),
            interestedIn: data.Interest.split('; ')
          },
          unset: {},
          currentUser: user,
          validate: false,
        })
      })
  }
)


type UserEAGDetailsRow = {
  email: string,
  careerStage?: string,
  countryOrRegion?: string,
  nearestCity?: string,
  willingnessToRelocateBoston?: string,
  willingnessToRelocateBayArea?: string,
  willingnessToRelocateDC?: string,
  willingnessToRelocateLondon?: string,
  willingnessToRelocateNYC?: string,
  willingnessToRelocateOxford?: string,
  willingnessToRelocateRemote?: string,
  experiencedIn?: string,
  interestedIn?: string
}

/**
 * Given a CSV with users' EAG data, import it to the "UserEAGDetails" table, replacing any existing user data.
 */
Vulcan.importEAGUserDetails = wrapVulcanAsyncScript(
  'importEAGUserDetails',
  async (fileName='EAG_users.csv') => {
    const now = new Date()
    const records: AnyBecauseTodo[] = []
    
    const dataStream: AsyncIterable<AnyBecauseTodo> = fs.createReadStream(fileName)
      .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, {header: true, delimiter: ','}))

    for await (const row of dataStream) {
      // do a simple check to see if we have a user with this email address
      const user = await Users.findOne({email: row.email})
      if (!user) continue

      records.push({
        userId: user._id,
        careerStage: row.careerStage?.split('; '),
        countryOrRegion: row.countryOrRegion,
        nearestCity: row.nearestCity,
        willingnessToRelocate: {
          Boston: row.willingnessToRelocateBoston,
          BayArea: row.willingnessToRelocateBayArea,
          DC: row.willingnessToRelocateDC,
          London: row.willingnessToRelocateLondon,
          NYC: row.willingnessToRelocateNYC,
          Oxford: row.willingnessToRelocateOxford,
          Remote: row.willingnessToRelocateRemote,
        },
        experiencedIn: row.experiencedIn?.split('; '),
        interestedIn: row.interestedIn?.split('; '),
        lastUpdated: now
      })
    }
    
    // upsert EAG data for all the users in the CSV
    void UserEAGDetails.rawCollection().bulkWrite(records.map((record) => ({
      updateOne: {
        filter: {userId: record.userId},
        update: {$set: record},
        upsert: true,
      }
    })));
  }
)
