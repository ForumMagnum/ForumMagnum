import { markdownToHtml } from '../editor/make_editable_callbacks';
import Users from '../../lib/collections/users/collection';
import { addFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { addGraphQLMutation, addGraphQLResolvers, addGraphQLSchema, slugify, Utils } from '../vulcan-lib';
import pick from 'lodash/pick';

addFieldsDict(Users, {
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

addGraphQLSchema(`
  type NewUserCompletedProfile {
    username: String,
    slug: String,
    displayName: String,
    subscribedToDigest: Boolean,
    userNameUnset: Boolean
  }
`)

type NewUserUpdates = {
  displayName: string
  subscribeToDigest: boolean
}

addGraphQLResolvers({
  Mutation: {
    async NewUserCompleteProfile(root: void, { displayName, subscribeToDigest }: NewUserUpdates, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Cannot change username without being logged in')
      }
      // Only for new users. Existing users should need to contact support to
      // change their usernames
      // TODO; rename all occurances to usernameUnset
      if (!currentUser.userNameUnset) {
        throw new Error('Only new users can set their username this way')
      }
      // TODO; subscribed to digest?
      // TODO; should we use a updateMutator?
      await Users.update(
        {_id: currentUser._id,},
        {$set: {
          userNameUnset: false,
          username: displayName,
          displayName,
          slug: await Utils.getUnusedSlugByCollectionName("Users", slugify(displayName)),
          // subscribedToDigest: subscribeToDigest
        }}
      )
      const updatedUser = await Users.findOne(currentUser._id)
      // Don't want to return the whole object without more permission checking
      return pick(updatedUser, 'username', 'slug', 'displayName', 'subscribedToCurated', 'userNameUnset')
    }
  }
})

addGraphQLMutation(
  'NewUserCompleteProfile(displayName: String!, subscribeToDigest: Boolean!): NewUserCompletedProfile'
)
