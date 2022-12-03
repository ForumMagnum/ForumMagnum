import fs from 'mz/fs';
import Papa from 'papaparse';
import Users from '../../lib/collections/users/collection';
import { updateMutator, Vulcan } from '../vulcan-lib';
import { wrapVulcanAsyncScript } from './utils';

/**
 * Given a CSV with users' Email, Experience, and Interest data from EAG,
 * import it to the users' "experiencedIn" and "interestedIn"
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
