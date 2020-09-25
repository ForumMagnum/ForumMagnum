import SimpleSchema from 'simpl-schema';
import { Utils, getCollection } from '../../vulcan-lib';
import Users from "./collection";
import { SchemaType } from '../../utils/schemaUtils';
import * as _ from 'underscore';

///////////////////////////////////////
// Order for the Schema is as follows. Change as you see fit:
// 00.
// 10. Display Name
// 20. Email
// 30. Bio
// 40. Slug
// 50. Website
// 60. Twitter username
// 70.
// 80.
// 90.
// 100.
// Anything else..
///////////////////////////////////////

const createDisplayName = (user: DbUser): string => {
  const profileName = Utils.getNestedProperty(user, 'profile.name');
  const twitterName = Utils.getNestedProperty(user, 'services.twitter.screenName');
  const linkedinFirstName = Utils.getNestedProperty(user, 'services.linkedin.firstName');
  if (profileName) return profileName;
  if (twitterName) return twitterName;
  if (linkedinFirstName)
    return `${linkedinFirstName} ${Utils.getNestedProperty(user, 'services.linkedin.lastName')}`;
  if (user.username) return user.username;
  if (user.email) return user.email.slice(0, user.email.indexOf('@'));
  return "[missing username]";
};

const adminGroup = {
  name: 'admin',
  order: 100,
  label: "Admin",
};

const ownsOrIsAdmin = (user: DbUser|null, document: any) => {
  return getCollection('Users').owns(user, document) || getCollection('Users').isAdmin(user);
};

/**
 * @summary Users schema
 * @type {Object}
 */
const schema: SchemaType<DbUser> = {
  _id: {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  username: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['members'],
    onInsert: user => {
      if (
        !user.username &&
        user.services &&
        user.services.twitter &&
        user.services.twitter.screenName
      ) {
        return user.services.twitter.screenName;
      }
    },
  },
  emails: {
    type: Array,
    optional: true,
  },
  'emails.$': {
    type: Object,
    optional: true,
  },
  'emails.$.address': {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true,
  },
  'emails.$.verified': {
    type: Boolean,
    optional: true,
  },
  createdAt: {
    type: Date,
    optional: true,
    canRead: ['admins'],
    onCreate: () => {
      return new Date();
    },
  },
  isAdmin: {
    type: Boolean,
    label: 'Admin',
    input: 'checkbox',
    optional: true,
    canCreate: ['admins'],
    canUpdate: ['admins'],
    canRead: ['guests'],
    group: adminGroup,
  },
  profile: {
    type: Object,
    optional: true,
    blackbox: true,
    hidden: true,
    canCreate: ['members'],
  },
  // // telescope-specific data, kept for backward compatibility and migration purposes
  // telescope: {
  //   type: Object,
  //   blackbox: true,
  //   optional: true,
  // },
  services: {
    type: Object,
    optional: true,
    blackbox: true,
    canRead: ownsOrIsAdmin,
  },
  /**
    The name displayed throughout the app. Can contain spaces and special characters, doesn't need to be unique
  */
  displayName: {
    type: String,
    optional: true,
    input: 'text',
    canCreate: ['members'],
    canUpdate: ['members'],
    canRead: ['guests'],
    order: 10,
    onCreate: ({ document: user }) => {
      return createDisplayName(user);
    },
  },
  /**
    The user's email. Modifiable.
  */
  email: {
    type: String,
    optional: true,
    regEx: SimpleSchema.RegEx.Email,
    input: 'text',
    canCreate: ['members'],
    canUpdate: ['members'],
    canRead: ownsOrIsAdmin,
    order: 20,
    onCreate: ({ document: user }) => {
      // look in a few places for the user email
      const facebookEmail: any = Utils.getNestedProperty(user, 'services.facebook.email');
      const githubEmail: any = Utils.getNestedProperty(user, 'services.github.email');
      const googleEmail: any = Utils.getNestedProperty(user, 'services.google.email');
      const linkedinEmail: any = Utils.getNestedProperty(user, 'services.linkedin.emailAddress');

      if (facebookEmail) return facebookEmail;
      if (githubEmail) return githubEmail;
      if (googleEmail) return googleEmail;
      if (linkedinEmail) return linkedinEmail;
      return undefined;
    },
    // unique: true // note: find a way to fix duplicate accounts before enabling this
  },
  /**
    The user's profile URL slug // TODO: change this when displayName changes
  */
  slug: {
    type: String,
    optional: true,
    canRead: ['guests'],
    order: 40,
    onCreate: ({ document: user }) => {
      // create a basic slug from display name and then modify it if this slugs already exists;
      const displayName = createDisplayName(user);
      const basicSlug = Utils.slugify(displayName);
      return Utils.getUnusedSlugByCollectionName('Users', basicSlug);
    },
  },
  /**
    Groups
  */
  groups: {
    type: Array,
    optional: true,
    control: 'checkboxgroup',
    canCreate: ['admins'],
    canUpdate: ['admins'],
    canRead: ['guests'],
    group: adminGroup,
    form: {
      options: function() {
        const groups = _.without(
          _.keys(getCollection('Users').groups),
          'guests',
          'members',
          'admins'
        );
        return groups.map(group => {
          return { value: group, label: group };
        });
      },
    },
  },
  'groups.$': {
    type: String,
    optional: true,
  },

  // GraphQL only fields

  pageUrl: {
    type: String,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      type: 'String',
      resolver: (user: DbUser, args: void, context: ResolverContext): string => {
        return Users.getProfileUrl(user, true);
      },
    },
  },

  pagePath: {
    type: String,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      type: 'String',
      resolver: (user: DbUser, args: void, context: ResolverContext): string => {
        return Users.getProfileUrl(user, false);
      },
    },
  },

  editUrl: {
    type: String,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      type: 'String',
      resolver: (user: DbUser, args: void, context: ResolverContext): string => {
        return Users.getEditUrl(user, true);
      },
    },
  },
  lwWikiImport: {
    type: Boolean,
    optional: true, 
    canRead: ['guests'],
  }
};

export default schema;
