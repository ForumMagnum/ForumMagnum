import { markdownToHtml } from '../editor/make_editable_callbacks';
import Users from '../../lib/collections/users/collection';
import { addFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'

addFieldsDict(Users, {
  htmlBio: {
    ...denormalizedField({
      needsUpdate: (data) => ('bio' in data),
      getValue: async (user) => {
        if (!user.bio) return "";
        return await markdownToHtml(user.bio);
      }
    })
  },
  htmlMapMarkerText: {
    ...denormalizedField({
      needsUpdate: (data) => ('mapMarkerText' in data),
      getValue: async (user) => {
        if (!user.mapMarkerText) return "";
        return await markdownToHtml(user.mapMarkerText);
      }
    })
  },
});
