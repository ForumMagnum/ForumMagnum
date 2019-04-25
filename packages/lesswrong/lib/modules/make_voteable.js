import { Connectors } from 'meteor/vulcan:core'; // import from vulcan:lib because vulcan:core isn't loaded yet
import { addFieldsDict } from './utils/schemaUtils'

export const VoteableCollections = [];

export const makeVoteable = collection => {

  VoteableCollections.push(collection);

  addFieldsDict(collection, {
    // The document's base score (not factoring in the document's age)
    baseScore: {
      type: Number,
      optional: true,
      defaultValue: 0,
      canRead: ['guests'],
      onInsert: document => {
        // default to 0 if empty
        return document.baseScore || 0;
      }
    },
    // The document's current score (factoring in age)
    score: {
      type: Number,
      optional: true,
      defaultValue: 0,
      canRead: ['guests'],
      onInsert: document => {
        // default to 0 if empty
        return document.score || 0;
      }
    },
    // Whether the document is inactive. Inactive documents see their score
    // recalculated less often
    inactive: {
      type: Boolean,
      optional: true,
      onInsert: () => false
    },
  });
}
