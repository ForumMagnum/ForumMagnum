import Users from 'meteor/vulcan:users';

const notificationsGroup = {
  name: "notifications",
  order: 2
};

// Add notifications options to user profile settings
Users.addField([
  {
    fieldName: 'notifications_users',
    fieldSchema: {
      label: 'New users',
      type: Boolean,
      optional: true,
      onInsert: (document, currentUser) => false,
      control: "checkbox",
      viewableBy: ['guests'],
      insertableBy: ['admins'],
      editableBy: ['admins'],
      group: notificationsGroup,
    }
  },
  {
    fieldName: 'notifications_posts',
    fieldSchema: {
      label: 'New posts',
      type: Boolean,
      optional: true,
      onInsert: (document, currentUser) => false,
      control: "checkbox",
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      group: notificationsGroup,
    }
  }
]);

Users.addField([
  {
    fieldName: 'auto_subscribe_to_my_posts',
    fieldSchema: {
      label: 'Comments on my posts',
      type: Boolean,
      optional: true,
      onInsert: (document, currentUser) => true,
      control: "checkbox",
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      group: notificationsGroup,
    }
  },
  {
    fieldName: 'auto_subscribe_to_my_comments',
    fieldSchema: {
      label: 'Replies to my comments',
      type: Boolean,
      optional: true,
      onInsert: (document, currentUser) => true,
      control: "checkbox",
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      group: notificationsGroup,
    }
  }
]);
