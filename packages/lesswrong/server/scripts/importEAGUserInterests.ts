import fs from 'mz/fs';
import { z } from "zod";
import Papa from 'papaparse';
import Users from '../../lib/collections/users/collection';
import { wrapVulcanAsyncScript } from './utils';
import UserEAGDetails from '../../lib/collections/userEAGDetails/collection';
import moment from 'moment';

const csvSchema = z.object({
  email: z.string(),
  submissionDate: z.string().optional(),
  careerStage: z.string().optional(),
  countryOrRegion: z.string().optional(),
  nearestCity: z.string().optional(),
  willingnessToRelocateBoston: z.string().optional(),
  willingnessToRelocateBayArea: z.string().optional(),
  willingnessToRelocateDC: z.string().optional(),
  willingnessToRelocateLondon: z.string().optional(),
  willingnessToRelocateNYC: z.string().optional(),
  willingnessToRelocateOxford: z.string().optional(),
  willingnessToRelocateRemote: z.string().optional(),
  experiencedIn: z.string().optional(),
  interestedIn: z.string().optional(),
});

export type UserEAGDetailsRow = z.infer<typeof csvSchema>;

/**
 * Given a CSV with users' EAG data, import it to the "UserEAGDetails" table, replacing any existing user data.
 * Users can appear multiple times in the CSV, so we try to pick the most recently submitted row per user.
 * Exported to allow running manually with "yarn repl"
 */
export const importEAGUserDetails = wrapVulcanAsyncScript(
  'importEAGUserDetails',
  async (fileName='EAG_users.csv') => {
    const now = new Date()
    // This maps {userId: EAGDetails}
    const records: Record<string, Partial<DbUserEAGDetail> & {submissionDate?: Date}> = {}
    
    const dataStream: AsyncIterable<AnyBecauseIsInput> = fs.createReadStream(fileName)
      .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, {header: true, delimiter: ','}))

    for await (const data of dataStream) {
      const row: UserEAGDetailsRow = csvSchema.parse(data);
      // Do a simple check to see if we have a user with this email address
      const user = await Users.findOne({email: row.email})
      if (!user) continue
      
      // Users can appear multiple times in the CSV, and sometimes a row doesn't have a submission date.
      // We try to pick the latest submission per user, and fallback to using a row without a submission date.
      const submissionDate = row.submissionDate ? moment(row.submissionDate).toDate() : undefined
      const prevSubmissionDate = records[user._id]?.submissionDate
      if (prevSubmissionDate && (!submissionDate || submissionDate < prevSubmissionDate)) continue
  
      records[user._id] = {
        userId: user._id,
        careerStage: row.careerStage?.split('; '),
        countryOrRegion: row.countryOrRegion,
        nearestCity: row.nearestCity,
        willingnessToRelocate: {
          BayArea: row.willingnessToRelocateBayArea,
          Boston: row.willingnessToRelocateBoston,
          DC: row.willingnessToRelocateDC,
          London: row.willingnessToRelocateLondon,
          NYC: row.willingnessToRelocateNYC,
          Oxford: row.willingnessToRelocateOxford,
          Remote: row.willingnessToRelocateRemote,
        },
        experiencedIn: row.experiencedIn?.split('; '),
        interestedIn: row.interestedIn?.split('; '),
        lastUpdated: now,
        submissionDate: submissionDate
      }
    }
    // eslint-disable-next-line no-console
    console.log(`importEAGUserDetails: upserting ${Object.values(records).length} rows`)
    
    // Upsert EAG data for all the users in the CSV
    // WARNING: Upserts will be deprecated at some point
    void UserEAGDetails.rawCollection().bulkWrite(Object.values(records).map((record) => {
      delete record.submissionDate
      return {
        updateOne: {
          filter: {userId: record.userId},
          update: {$set: record},
          upsert: true,
        }
      }
    }));
  }
)
