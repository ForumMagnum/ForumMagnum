import { newMutation, editMutation } from 'meteor/nova:core';
import moment from 'moment';
import Posts from "meteor/nova:posts";
import Comments from "meteor/nova:comments";
import Users from 'meteor/nova:users';
import Events from "meteor/nova:events";
import shortid from "shortid";
import _ from "underscore";

const num_users = 2000;
const num_posts = 30000;
const max_upvotes_per_post = 20;
const max_comments_per_user = 500;

const dummy_comment = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
const dummy_post = "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?";
const dummy_title = "Lorem ipsum";

var toTitleCase = function (str) {
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var choice = function(arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
};

var randint = function(bound) {
  return Math.floor(Math.random() * bound) || 1;
};

var createPost = function (postedAt, username, thumbnail, numVotes) {

  const user = Users.findOne({username: username});
  const postId = shortid.generate();

  var post = {
    postedAt: postedAt,
    body: dummy_post,
    title: dummy_title,
    isDummy: true,
    userId: user._id,
    upvotes: numVotes || 0,
    _id: postId
  };

  if (typeof thumbnail !== "undefined")
    post.thumbnailUrl = "/packages/nova_getting-started/content/images/" + thumbnail;

  newMutation({
    collection: Posts,
    document: post,
    currentUser: user,
    validate: false
  });

  return postId;
};

var createComment = function (postId, username, body) {

  const user = Users.findOne({username: username});

  var comment = {
    postId: postId,
    userId: user._id,
    body: body,
    isDummy: true,
    disableNotifications: true
  };

  newMutation({
    collection: Comments,
    document: comment,
    currentUser: user,
    validate: false
  });
};

var createUser = function (username) {
  Accounts.createUser({
    username: username,
    email: username + '@telescopeapp.org',
    profile: {
      isDummy: true
    }
  });
};

var createDummyPosts = function (users) {

  const postIds = _.range(num_posts).map(i => {
    const user = choice(users);
    const numVotes = randint(max_upvotes_per_post);

    const postId = createPost(
      moment().toDate(),
      user,
      "telescope.png",
      numVotes
    );

    return postId;
  });

  return postIds;
};

var createDummyComments = function (users, postIds) {

  users.forEach(user => {
    const numComments = randint(max_comments_per_user);
    _.range(numComments).forEach(i => {
      const postId = choice(postIds);
      createComment(
        postId,
        user,
        dummy_comment
      );
    });
  });
};

var createDummyContent = function() {
  console.log('createDummyContent');
  const users = _.range(num_users).map(i => shortid.generate());
  users.forEach(user => createUser(user));
  const postIds = createDummyPosts(users);
  createDummyComments(users, postIds);
  console.log('done');
};

Meteor.methods({
  addGettingStartedContent: function () {
    if (Users.isAdmin(Meteor.user())) {
      createDummyContent();
    }
  },
  removeGettingStartedContent: function () {
    if (Users.isAdmin(Meteor.user()))
      deleteDummyContent();
  }
});

Meteor.startup(function () {
  // insert dummy content only if createDummyContent hasn't happened and there aren't any posts in the db
  if (!Users.find().count() && !Events.findOne({name: 'createDummyContent'}) && !Posts.find().count()) {
    createDummyContent();
    Events.log({name: 'createDummyContent', unique: true, important: true});
  }
});
