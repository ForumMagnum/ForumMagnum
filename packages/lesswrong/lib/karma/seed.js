import { newMutation } from 'meteor/vulcan:core';
import moment from 'moment';
import Posts from 'meteor/vulcan:posts';
import Users from 'meteor/vulcan:users';
import Votes from './collection.js';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { log } from './helpers.js'


const createVote = function (documentId, documentType, userId, voteType, weight) {
  const vote = {
    votedAt: new Date(),
    documentId,
    documentType,
    userId,
    voteType,
    weight
  };

  log("createVote<", "vote", vote, ">");

  newMutation({
    collection: Votes,
    document: vote,
    validate: false
  });
}

var createDummyVotes = function () {
  log('// inserting dummy votes…');
  const user = Users.findOne();
  const document = Posts.findOne();
  createVote(document._id, "Post", user._id, "upvote", 1);
};

const createDummyUser = function (username, email, password) {
  options = {
    username,
    email,
    password
  };
  Accounts.createUser(options);
}

Meteor.startup(function () {
  if (Meteor.isDevelopment) {
    // insert dummy content only if createDummyContent hasn't happened and there aren't any posts or users in the db
    if (!Votes.find().count()) {
      createDummyVotes();
      createDummyVotes();
      createDummyVotes();
      createDummyVotes();
      createDummyVotes();
    }
    if (!Users.find({username: "admin"}).count()) {
      createDummyUser("admin", "admin@admin.com", "password");
    }
  }
});
