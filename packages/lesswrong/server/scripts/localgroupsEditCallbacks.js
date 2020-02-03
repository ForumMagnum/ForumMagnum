/* global Vulcan */
import { Localgroups } from '../../lib/collections/localgroups/collection';
import { runCallbacks } from '../vulcan-lib';

Vulcan.runLocalgroupsEditCallbacks = async () => {
  let groupCount = 0;
  // To fetch all posts from a given user:
  // const posts = Posts.find({draft:{$ne:true}, userId:'N9zj5qpTfqmbn9dro'}).fetch()
  // To fetch all posts, starting with most recent:
  const groups = Localgroups.find({}, {sort:{createdAt:-1}}).fetch()
  //eslint-disable-next-line no-console
  console.log(`Found ${groups.length} groups, triggering Edit Callbacks`)
  for (let group of groups) {
    if (group.description) {
      try {
        const newGroupFields = await runCallbacks("localgroups.edit.sync", {$set: {content:group.description}}, group, {isAdmin: false})
        Localgroups.update(group._id,newGroupFields, group, {isAdmin: false})
      } catch (e) {
        //eslint-disable-next-line no-console
        console.error(e)
      }
    }
    if (groupCount % 1 == 0) {
      //eslint-disable-next-line no-console
      console.log(`${groupCount} groups / ${groups.length}, ${group._id}`);
    }
    groupCount++
  }
}
