import Users from 'meteor/vulcan:users';
import Votes from './collection.js'

/**
 * @summary List of votes by document id
 */
Votes.addView("votesForDocument", terms => ({
  selector: {
    documentId: terms.documentId
  }
}));
