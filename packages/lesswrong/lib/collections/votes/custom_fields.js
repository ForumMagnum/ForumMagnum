import { Votes } from "meteor/vulcan:voting";

Votes.addField([
  {
    fieldName: "afPower",
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
    }
  }
]);
