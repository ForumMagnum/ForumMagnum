import { Connectors } from 'meteor/vulcan:core'; // import from vulcan:lib because vulcan:core isn't loaded yet

export const VoteableCollections = [];

export const makeVoteable = collection => {

  VoteableCollections.push(collection);

  collection.addField([
    /**
      The document's base score (not factoring in the document's age)
    */
    {
      fieldName: 'baseScore',
      fieldSchema: {
        type: Number,
        optional: true,
        defaultValue: 0,
        canRead: ['guests'],
        onInsert: document => {
          // default to 0 if empty
          return document.baseScore || 0;
        }
      }
    },
    /**
      The document's current score (factoring in age)
    */
    {
      fieldName: 'score',
      fieldSchema: {
        type: Number,
        optional: true,
        defaultValue: 0,
        canRead: ['guests'],
        onInsert: document => {
          // default to 0 if empty
          return document.score || 0;
        }
      }
    },
    /**
      Whether the document is inactive. Inactive documents see their score recalculated less often
    */
    {
      fieldName: 'inactive',
      fieldSchema: {
        type: Boolean,
        optional: true,
        onInsert: () => false
      }
    },

  ]);
}
