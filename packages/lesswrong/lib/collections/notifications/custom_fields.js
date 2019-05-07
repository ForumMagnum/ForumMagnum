import Users from 'meteor/vulcan:users';
import { addFieldsDict } from '../../modules/utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';

const notificationsGroup = {
  name: "notifications",
  order: 2
};

// Add notifications options to user profile settings
addFieldsDict(Users, {
  auto_subscribe_to_my_posts: {
    label: 'Comments on my posts',
    type: Boolean,
    optional: true,
    control: "checkbox",
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    group: notificationsGroup,
    ...schemaDefaultValue(true),
  },
  auto_subscribe_to_my_comments: {
    label: 'Replies to my comments',
    type: Boolean,
    optional: true,
    control: "checkbox",
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    group: notificationsGroup,
    ...schemaDefaultValue(true),
  },
  autoSubscribeAsOrganizer: {
    label: "Notifications for posts and meetups in groups I organize",
    type: Boolean,
    optional: true,
    control: "checkbox",
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    group: notificationsGroup,
    ...schemaDefaultValue(true),
  },
});
