import { Votes } from "meteor/vulcan:voting";
// import Users from "meteor/vulcan:users";

Votes.addField([
  /**
    URL (Overwriting original schema)
  */
  {
    fieldName: "afPower",
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
    }
  }
]);
