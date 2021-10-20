import { createMutator } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { getCollectionHooks } from '../mutationCallbacks';

// TODO: defenestrate this function
getCollectionHooks("Localgroups").createAfter.add(function GroupsNewDefaultPost (group: DbLocalgroup, {currentUser}: {currentUser: DbUser|null}) {
  const newFields = {
    title: `Welcome to ${group.name} [Edit With Your Details]`,
    groupId: group._id,
    userId: group.organizerIds && group.organizerIds[0],
    sticky: true,
  }
  const post = {...groupWelcomePostTemplate, ...newFields};
  //eslint-disable-next-line no-console
  console.info("Creating new post for new group", post);
  void createMutator({
    collection: Posts,
    document: post,
    currentUser,
    validate: false,
  })
});

const groupWelcomePostTemplate = {
  contents: {
    originalContents: {
      type: "html",
      data: `<p><em>(The following are our suggestions for what kind of information is best to include in the welcome post of your group, feel free to replace them with whatever you think is best)</em></p>
      <p><em>What kind of events does your group usually run? What does it usually do?</em></p>
      <p><em>How frequently does your group organize events or meet?</em></p>
      <p><em>Who would be a good fit for you group?</em></p>
      <p><em>Should they have any particular skills or have done some specific background reading?</em></p>`
    }
  },
}
