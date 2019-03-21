import { markdownToHtml } from '../../../server/editor/make_editable_callbacks.js';
import Users from 'meteor/vulcan:users';
import { addFieldsDict, denormalizedField } from '../../modules/utils/schemaUtils'

addFieldsDict(Users, {
  htmlBio: {
    ...denormalizedField({
      needsUpdate: (data) => ('bio' in data),
      getValue: async (user) => {
        if (!user.bio) return "";
        return markdownToHtml(user.bio);
      }
    })
  }
});