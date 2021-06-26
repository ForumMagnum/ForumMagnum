import { markdownToHtml } from '../editor/make_editable_callbacks';
import Users from '../../lib/collections/users/collection';
import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'

augmentFieldsDict(Users, {
  htmlBio: {
    ...denormalizedField({
      needsUpdate: (data: Partial<DbUser>) => ('bio' in data),
      getValue: async (user: DbUser) => {
        if (!user.bio) return "";
        return await markdownToHtml(user.bio);
      }
    })
  },
  htmlMapMarkerText: {
    ...denormalizedField({
      needsUpdate: (data: Partial<DbUser>) => ('mapMarkerText' in data),
      getValue: async (user: DbUser) => {
        if (!user.mapMarkerText) return "";
        return await markdownToHtml(user.mapMarkerText);
      }
    })
  },
});
