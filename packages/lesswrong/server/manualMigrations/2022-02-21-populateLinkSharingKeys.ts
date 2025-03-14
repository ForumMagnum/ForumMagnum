import { registerMigration } from './migrationUtils';
import { generateLinkSharingKey } from '../ckEditor/ckEditorCallbacks';
import { Posts } from '../../server/collections/posts/collection';

export default registerMigration({
  name: "populateLinkSharingKeys",
  dateWritten: "2022-02-21",
  idempotent: true,
  action: async () => {
    const sharedPosts = await Posts.find({sharingSettings: {$exists: true}}).fetch();
    
    for (let sharedPost of sharedPosts) {
      if (!sharedPost.linkSharingKey) {
        await Posts.rawUpdateOne(
          {_id: sharedPost._id},
          {$set: {
            linkSharingKey: generateLinkSharingKey(),
          }}
        );
      }
    }
  },
});
