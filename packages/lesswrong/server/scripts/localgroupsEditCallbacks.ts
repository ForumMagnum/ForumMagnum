import { Localgroups } from '../../lib/collections/localgroups/collection';
import { Vulcan, runCallbacks } from '../vulcan-lib';

Vulcan.runLocalgroupsEditCallbacks = async () => {
  let groupCount = 0;
  // To fetch all posts from a given user:
  // const posts = Posts.find({draft:{$ne:true}, userId:'N9zj5qpTfqmbn9dro'}).fetch()
  // To fetch all posts, starting with most recent:
  const groups = Localgroups.find({}, {sort:{createdAt:-1}}).fetch()
  //eslint-disable-next-line no-console
  console.log(`Found ${groups.length} groups, triggering Edit Callbacks`)
  for (let group of groups) {
    // @ts-ignore FIXME: This should be "contents" not description (this script probably mostly doesn't work)
    if (group.description) {
      try {
        // @ts-ignore FIXME description
        const newGroupFields = await runCallbacks("localgroups.edit.sync", {$set: {content:group.description}}, group, {isAdmin: false})
        // @ts-ignore FIXME This has too many arguments and I have no idea what "isAdmin" is supposed to be
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
