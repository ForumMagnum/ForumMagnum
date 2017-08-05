import Users from 'meteor/vulcan:users';
import Posts from 'meteor/vulcan:posts';
import Comments from 'meteor/vulcan:comments';
import Votes from './collection.js';
import { GraphQLSchema } from 'meteor/vulcan:lib';

/**
 * @summary A type that resolves to either a post or a comment.
 */
const votableSchema = `
  union Votable = Post | Comment
`;

GraphQLSchema.addSchema(votableSchema);

/**
 * @summary Votes form group
 * @type {Object}
 */
const formGroups = {
  admin: {
    name: "admin",
    order: 2
  }
};

/**
 * @summary Votes schema
 * @type {Object}
 */
const schema = {
  /**
    ID
  */
  _id: {
    type: String,
    optional: true,
    viewableBy: ['guests']
  },
  /**
    Timestamp of vote casting
  */
  votedAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    autoValue: (documentOrModifier) => {
      if (documentOrModifier && !documentOrModifier.$set) return new Date() // if this is an insert, set createdAt to current timestamp
    }
  },
  /**
    The vote caster's `_id`.
  */
  userId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    hidden: true,
    resolveAs: 'user: User',
  },
  /**
    The `_id` of the document the vote was cast on.
  */
  documentId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    hidden: true,
    resolveAs: 'document: Votable'
  },
  /**
    The document's type.
  */
  documentType: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    hidden: true
  },
  /**
    Voting power of the user who cast the vote.
  */
  weight: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    hidden: true,
    onInsert: () => 1
  },
  /**
    The vote's type.
  */
  voteType: {
    type: String,
    optional: false,
    hidden: false,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    control: "select",
    form: {
      noselect: true,
      options: () => Votes.types,
      group: 'admin'
    },
    group: formGroups.admin
  }
};

export default schema;
