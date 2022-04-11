import SimpleSchema from 'simpl-schema';
import { Utils, slugify, getNestedProperty } from '../../vulcan-lib/utils';
import { userGetProfileUrl } from "./helpers";
import { userGetEditUrl } from '../../vulcan-users/helpers';
import { userGroups, userOwns, userIsAdmin, userHasntChangedName } from '../../vulcan-users/permissions';
import { formGroups } from './formGroups';
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

const createDisplayName = (user: DbInsertion<DbUser>): string => {
  const profileName = getNestedProperty(user, 'profile.name');
  const twitterName = getNestedProperty(user, 'services.twitter.screenName');
  const linkedinFirstName = getNestedProperty(user, 'services.linkedin.firstName');
  if (profileName) return profileName;
  if (twitterName) return twitterName;
  if (linkedinFirstName)
    return `${linkedinFirstName} ${getNestedProperty(user, 'services.linkedin.lastName')}`;
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
  return userOwns(user, document) || userIsAdmin(user);
};

/**
 * @summary Users schema
 * @type {Object}
 */
const schema: SchemaType<DbUser> = {
  username: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['members'],
    hidden: true,
    onInsert: user => {
      if (!user.username && user.services?.twitter?.screenName) {
        return user.services.twitter.screenName;
      }
    },
  },
  // Emails (not to be confused with email). This field belongs to Meteor's
  // accounts system; we should never write it, but we do need to read it to find
  // out whether a user's email address is verified.
  // FIXME: Update this comment
  emails: {
    type: Array,
    optional: true,
    hidden: true,
    canRead: [userOwns, 'sunshineRegiment', 'admins'],
    
    // FIXME
    // This is dead code and doesn't actually run, but we do have to implement something like this in a post Meteor world
    onCreate: ({document: user}) => {
    
      const oAuthEmail = getNestedProperty(user, 'services.facebook.email') |
        getNestedProperty(user, 'services.google.email') | 
        getNestedProperty(user, 'services.github.email') | 
        getNestedProperty(user, 'services.linkedin.emailAddress')
      
      if (oAuthEmail) {
        return [{address: oAuthEmail, verified: true}]
      }
    }
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
  // NB: Not used on the EA Forum
  'emails.$.verified': {
    type: Boolean,
    optional: true,
  },
  createdAt: {
    type: Date,
    optional: true,
    canRead: ["guests"],
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
    canRead: ownsOrIsAdmin
  },
  // The name displayed throughout the app. Can contain spaces and special characters, doesn't need to be unique
  // Hide the option to change your displayName (for now) TODO: Create proper process for changing name
  displayName: {
    type: String,
    optional: true,
    input: 'text',
    canUpdate: ['sunshineRegiment', 'admins', userHasntChangedName],
    canCreate: ['sunshineRegiment', 'admins'],
    canRead: ['guests'],
    order: 10,
    onCreate: ({ document: user }) => {
      return user.displayName || createDisplayName(user);
    },
    group: formGroups.default,
  },
  /**
   Used for tracking changes of displayName
   */
  previousDisplayName: {
    type: String,
    optional: true,
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    canRead: ['guests'],
    order: 11,
    group: formGroups.default,
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
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canRead: ownsOrIsAdmin,
    order: 20,
    group: formGroups.default,
    onCreate: ({ document: user }) => {
      // look in a few places for the user email
      const facebookEmail: any = getNestedProperty(user, 'services.facebook.email');
      const githubEmail: any = getNestedProperty(user, 'services.github.email');
      const googleEmail: any = getNestedProperty(user, 'services.google.email');
      const linkedinEmail: any = getNestedProperty(user, 'services.linkedin.emailAddress');

      if (facebookEmail) return facebookEmail;
      if (githubEmail) return githubEmail;
      if (googleEmail) return googleEmail;
      if (linkedinEmail) return linkedinEmail;
      return undefined;
    },
    // unique: true // note: find a way to fix duplicate accounts before enabling this
  },
  // The user's profile URL slug // TODO: change this when displayName changes
  // Unique user slug for URLs, copied over from Vulcan-Accounts
  slug: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    order: 40,
    group: formGroups.adminOptions,
    
    onCreate: async ({ document: user }) => {
      // create a basic slug from display name and then modify it if this slugs already exists;
      const displayName = createDisplayName(user);
      const basicSlug = slugify(displayName);
      return await Utils.getUnusedSlugByCollectionName('Users', basicSlug);
    },
    onUpdate: async ({data, oldDocument}) => {
      if (data.slug && data.slug !== oldDocument.slug) {
        const slugIsUsed = await Utils.slugIsUsed("Users", data.slug)
        if (slugIsUsed) {
          throw Error(`Specified slug is already used: ${data.slug}`)
        }
      }
    }
  },
  
  noindex: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: ['admins'],
    order: 48,
    group: formGroups.adminOptions,
    label: "No Index",
    tooltip: "Hide this user's profile from search engines",
  },
  
  /**
    Groups
  */
  groups: {
    type: Array,
    optional: true,
    control: 'checkboxgroup',
    canCreate: ['admins'],
    canUpdate: ['alignmentForumAdmins', 'admins'],
    canRead: ['guests'],
    group: adminGroup,
    form: {
      options: function() {
        const groups = _.without(
          _.keys(userGroups),
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
        return userGetProfileUrl(user, true);
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
        return userGetProfileUrl(user, false);
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
        return userGetEditUrl(user, true);
      },
    },
  },
  lwWikiImport: {
    type: Boolean,
    optional: true, 
    canRead: ['guests'],
  },
  
  lastUsedTimezone: {
    type: String,
    optional: true,
    hidden: true,
    canCreate: ['members'],
    canRead: [userOwns],
    canUpdate: [userOwns],
  },
};

export default schema;
