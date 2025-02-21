import fs from 'mz/fs';
import Papa from 'papaparse';
import Localgroups from '../../lib/collections/localgroups/collection';
import { GROUP_CATEGORIES } from '../../lib/collections/localgroups/schema';
import { wrapVulcanAsyncScript } from './utils';
import { createMutator, updateMutator } from "../vulcan-lib/mutators";
import { Vulcan } from "../../lib/vulcan-lib/config";

/**
 * Import data for localgroups
 */
Vulcan.importLocalgroups = wrapVulcanAsyncScript(
  'importLocalgroups',
  async (fileName='localgroups.csv') => {
    fs.createReadStream(fileName)
      .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, {header: true, delimiter: ','}))
      .on("data", async data => {
        const groupName = `${data.name}${data.nameInAnotherLanguage ? ` (${data.nameInAnotherLanguage})` : ''}`
        // if the group has no _id, see if we can match one by name
        if (!data._id) {
          //eslint-disable-next-line no-console
          console.log(`${groupName} doesnt have an _id, checking db`)
          const group = await Localgroups.findOne({name: {$in: [data.name, data.nameInAnotherLanguage]}})
          if (group)
            data._id = group._id
        }
        
        let website = data.website || undefined
        if (website && !website.startsWith('http')) {
          website = `https://${website}`
        }
        
        const dataToSet = {
          name: data.name,
          nameInAnotherLanguage: data.nameInAnotherLanguage || undefined,
          inactive: data.inactive === 'TRUE',
          categories: data.categories.split('; ').map((label: AnyBecauseObsolete) => {
            return GROUP_CATEGORIES.find(cat => cat.label === label)?.value
          }).filter((val: AnyBecauseObsolete) => !!val),
          isOnline: data.isOnline === 'TRUE',
          contactInfo: data.contactInfo || undefined,
          website,
          facebookPageLink: data.facebookPageLink || undefined,
          facebookLink: data.facebookLink || undefined,
          meetupLink: data.meetupLink || undefined,
          slackLink: data.slackLink || undefined,
          salesforceId: data.salesforceId
        }
        //eslint-disable-next-line no-console
        console.log(dataToSet)
        
        // add the group if we haven't found them
        if (!data._id) {
          //eslint-disable-next-line no-console
          console.log(`${groupName} not found in the db - adding`)
          const newGroup = await createMutator({
            collection: Localgroups,
            document: {
              ...dataToSet,
              types: ["LW"], // not used by EA Forum but still required
              organizerIds: ['kPucqpaq7QyPczK5W'] // Group Organizer account
            },
            validate: false
          })
          //eslint-disable-next-line no-console
          console.log(`${newGroup.data._id} - ${groupName} added`)
        }
        // replace any existing data with the imported data
        else {
          void updateMutator({
            collection: Localgroups,
            documentId: data._id,
            set: dataToSet,
            validate: false
          })
        }
      })
  }
)
