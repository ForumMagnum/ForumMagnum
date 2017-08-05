import { GraphQLSchema } from 'meteor/vulcan:lib';
import { newMutation, editMutation } from 'meteor/vulcan:core';
import { log } from './helpers.js';

const voteResolver = {
  Mutation: {
    newVote(root, {documentId, documentType, userId, voteType, weight}, context) {
      log("newVoteResolver!", _.keys(context));
      const collection = context.Votes;
      const newVoteDoc = {documentId, documentType, userId, voteType, weight};
      const document = newMutation({
        collection,
        document: newVoteDoc,
        currentUser: context.currentUser,
        validate: false,
        context
      });
      log("vote created", document);
      return document;
    },
    updateVote(root, {id, documentId, documentType, userId, voteType, weight}, context) {
      log("updateVoteResolver!", _.keys(context));
      const collection = context.Votes;
      const updatedVoteDoc = {id, documentId, documentType, userId, voteType, weight};
      const document = editMutation({
        collection,
        documentId: id,
        set: updatedVoteDoc,
        currentUser: context.currentUser,
        validate: false,
        context
      });
      log("vote updated", document);
      return document;
    },
  },
};

GraphQLSchema.addMutation('updateVote(id: String, documentId: String, documentType: String, userId: String, voteType: String, weight: Int) : Vote');
GraphQLSchema.addMutation('newVote(documentId: String, documentType: String, userId: String, voteType: String, weight: Int) : Vote');

GraphQLSchema.addResolvers(voteResolver);

const resolvers = {
  list: {

    name: 'votesList',

    resolver(root, {terms}, context) {
      // log("votesListResolver!");
      let {selector, options} = context.Votes.getParameters(terms);

      options.limit = (terms.limit < 1 || terms.limit > 1000) ? 1000 : terms.limit;
      options.skip = terms.offset;
      options.fields = context.getViewableFields(context.currentUser, context.Votes);
      return context.Votes.find(selector, options).fetch();
    },

  },

  single: {

    name: 'votesSingle',

    resolver(root, {documentId}, context) {
      // log("votesSingleResolver!");
      return context.Votes.findOne(
        {_id: documentId},
        {fields: context.getViewableFields(context.currentUser, context.Votes)}
      );
    },

  },

  total: {

    name: 'votesTotal',

    resolver(root, {terms}, context) {
      // log("votesTotalResolver!");
      const {selector} = context.Votes.getParameters(terms);
      return context.Votes.find(selector).count();
    },

  }
};

export default resolvers;
