import Users from "meteor/vulcan:users";

Users.addField([
  {
    fieldName: 'afKarma',
    fieldSchema: {
      type: Number,
      optional: true,
      label: "Alignment Base Score",
      defaultValue: false,
      viewableBy: ['guests'],
    }
  },
]);
