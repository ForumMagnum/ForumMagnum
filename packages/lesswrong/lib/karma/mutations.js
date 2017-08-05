import { newMutation, editMutation, removeMutation, Utils } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';

const performCheck = (mutation, user, document) => {
  if(!Meteor.isDevelopment){
    if (!mutation.check(user, document)) {
       throw new Error(Utils.encodeIntlError({id: `app.mutation_not_allowed`, value: `"${mutation.name}" on _id "${document._id}"`}));
    }
  }
}

const mutations = {

  new: {

    name: 'votesNew',

    check(user) {
      if (!user) return false;
      return Users.canDo(user, 'votes.new');
    },

    mutation(root, {vote}, context) {

      performCheck(this, context.currentUser, vote);

      return newMutation({
        collection: context.Votes,
        document: vote,
        currentUser: context.currentUser,
        validate: true,
        context,
      });
    },

  },

  edit: {

    name: 'votesEdit',

    check(user, vote) {
      if (!user || !vote) return false;
      return Users.owns(user, vote) ?
      Users.canDo(user, 'votes.edit.own') :
      Users.canDo(user, `votes.edit.all`);
    },

    mutation(root, {voteId, set, unset}, context) {

      const vote = context.Votes.findOne(voteId);
      performCheck(this, context.currentUser, vote);

      return editMutation({
        collection: context.Votes,
        documentId: voteId,
        set: set,
        unset: unset,
        currentUser: context.currentUser,
        validate: true,
        context,
      });
    },

  },

  remove: {

    name: 'votesRemove',

    check(user, vote) {
      if (!user || !vote) return false;
      return Users.owns(user, vote) ?
      Users.canDo(user, 'votes.remove.own') :
      Users.canDo(user, `votes.remove.all`);
    },

    mutation(root, {voteId}, context) {

      const vote = context.Votes.findOne(voteId);

      performCheck(this, context.currentUser, vote);

      return removeMutation({
        collection: context.Votes,
        documentId: voteId,
        currentUser: context.currentUser,
        validate: true,
        context,
      });
    },

  }

};

export default mutations;
