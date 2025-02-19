import { registerMigration, forEachDocumentInCollection } from './migrationUtils';
import { Users } from '../../lib/collections/users/collection';

registerMigration({
  name: "ckEditorBioField",
  dateWritten: "2022-05-20",
  idempotent: true,
  action: async () => {
    await forEachDocumentInCollection({
      collection: Users,
      callback: async (user: DbUser) => {
        type LegacyUserType = DbUser&{bio?: string, htmlBio?: string};
        const legacyUser: LegacyUserType = user as LegacyUserType;
        if (legacyUser.bio && !legacyUser.biography) {
          await Users.rawUpdateOne(
            {_id: legacyUser._id},
            {
              $set: {
                biography: {
                  originalContents: {
                    type: "ckEditorMarkup",
                    data: legacyUser.htmlBio,
                  },
                  html: legacyUser.htmlBio,
                },
              },
            }
          );
        }
      }
    });
  },
});
