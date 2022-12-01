import { markdownToHtml, dataToMarkdown } from '../editor/conversionUtils';
import Users from '../../lib/collections/users/collection';
import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { addGraphQLMutation, addGraphQLResolvers, addGraphQLSchema, slugify, updateMutator, Utils } from '../vulcan-lib';
import pick from 'lodash/pick';
import SimpleSchema from 'simpl-schema';
import {getUserEmail} from "../../lib/collections/users/helpers";
import {userFindOneByEmail} from "../../lib/collections/users/commonQueries";
import {forumTypeSetting} from '../../lib/instanceSettings';

augmentFieldsDict(Users, {
  htmlMapMarkerText: {
    ...denormalizedField({
      needsUpdate: (data: Partial<DbUser>) => ('mapMarkerText' in data),
      getValue: async (user: DbUser) => {
        if (!user.mapMarkerText) return "";
        return await markdownToHtml(user.mapMarkerText);
      }
    })
  },
  bio: {
    resolveAs: {
      type: "String",
      resolver: (user: DbUser, args: void, { Users }: ResolverContext) => {
        const bio = user.biography?.originalContents;
        if (!bio) return "";
        return dataToMarkdown(bio.data, bio.type);
      }
    }
  },
  htmlBio: {
    resolveAs: {
      type: "String",
      resolver: (user: DbUser, args: void, { Users }: ResolverContext) => {
        const bio = user.biography;
        return bio?.html || "";
      }
    }
  },
});

addGraphQLSchema(`
  type NewUserCompletedProfile {
    username: String,
    slug: String,
    displayName: String,
    subscribedToDigest: Boolean,
    usernameUnset: Boolean
  }
`)

type NewUserUpdates = {
  username: string
  email?: string
  subscribeToDigest: boolean
  acceptedTos: boolean
}

addGraphQLResolvers({
  Mutation: {
    async NewUserCompleteProfile(root: void, { username, email, subscribeToDigest, acceptedTos }: NewUserUpdates, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Cannot change username without being logged in')
      }
      // Check they accepted the terms of use
      if (forumTypeSetting.get() === "EAForum" && !acceptedTos) {
        throw new Error("You must accept the terms of use to continue");
      }
      // Only for new users. Existing users should need to contact support to
      // change their usernames
      if (!currentUser.usernameUnset) {
        throw new Error('Only new users can set their username this way')
      }
      // Check for uniqueness
      const existingUser = await Users.findOne({username})
      if (existingUser && existingUser._id !== currentUser._id) {
        throw new Error('Username already exists')
      }
      // Check for someone setting an email when they already have one
      if (email && getUserEmail(currentUser)) {
        throw new Error('You already have an email address')
      }
      // Check for email uniqueness
      if (email && await userFindOneByEmail(email)) {
        throw new Error('Email already taken')
      }
      // Check for valid email
      if (email && !SimpleSchema.RegEx.Email.test(email)) {
        throw new Error('Invalid email')
      }
      const updatedUser = (await updateMutator({
        collection: Users,
        documentId: currentUser._id,
        set: {
          usernameUnset: false,
          username,
          displayName: username,
          slug: await Utils.getUnusedSlugByCollectionName("Users", slugify(username)),
          ...(email ? {email} : {}),
          subscribedToDigest: subscribeToDigest,
          acceptedTos,
        },
        // We've already done necessary gating
        validate: false
      })).data
      // Don't want to return the whole object without more permission checking
      return pick(updatedUser, 'username', 'slug', 'displayName', 'subscribedToCurated', 'usernameUnset')
    },
    async UserAcceptTos(_root: void, _args: {}, {currentUser}: ResolverContext) {
      if (!currentUser) {
        throw new Error('Cannot accept terms of use while not logged in');
      }
      const updatedUser = (await updateMutator({
        collection: Users,
        documentId: currentUser._id,
        set: {
          acceptedTos: true,
        },
        validate: false,
      })).data;
      return updatedUser.acceptedTos;
    },
  },
})

addGraphQLMutation(
  'NewUserCompleteProfile(username: String!, subscribeToDigest: Boolean!, email: String, acceptedTos: Boolean): NewUserCompletedProfile'
)
addGraphQLMutation(
  'UserAcceptTos: Boolean'
)
