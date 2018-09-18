import Users from "meteor/vulcan:users";

Users.addField([
  {
    fieldName: 'afKarma',
    fieldSchema: {
      type: Number,
      optional: true,
      label: "Alignment Base Score",
      viewableBy: ['guests'],
    }
  },

  {
    fieldName: 'afPostCount',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'afCommentCount',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'afSequenceCount',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },

  {
    fieldName: 'afSequenceDraftCount',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      onInsert: (document, currentUser) => 0,
    }
  },
]);
