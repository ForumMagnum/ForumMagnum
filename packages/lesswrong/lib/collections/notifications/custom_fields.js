import Users from 'meteor/vulcan:users';
import { addFieldsDict } from '../../modules/utils/schemaUtils'

const notificationsGroup = {
  name: "notifications",
  order: 2
};

// Add notifications options to user profile settings
addFieldsDict(Users, {
  notifications_users: {
      label: 'New users',
      type: Boolean,
      optional: true,
      onInsert: (document, currentUser) => false,
      control: "checkbox",
      canRead: ['guests'],
      canCreate: ['admins'],
      canUpdate: ['admins'],
      group: notificationsGroup,
  },
  notifications_posts: {
      label: 'New posts',
      type: Boolean,
      optional: true,
      onInsert: (document, currentUser) => false,
      control: "checkbox",
      canRead: ['guests'],
      canCreate: ['members'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      group: notificationsGroup,
  },
  auto_subscribe_to_my_posts: {
      label: 'Comments on my posts',
      type: Boolean,
      optional: true,
      onInsert: (document, currentUser) => true,
      control: "checkbox",
      canRead: ['guests'],
      canCreate: ['members'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      group: notificationsGroup,
  },
  auto_subscribe_to_my_comments: {
      label: 'Replies to my comments',
      type: Boolean,
      optional: true,
      onInsert: (document, currentUser) => true,
      control: "checkbox",
      canRead: ['guests'],
      canCreate: ['members'],
      canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
      group: notificationsGroup,
  }
});
