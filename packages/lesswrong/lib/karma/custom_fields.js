import Users from 'meteor/vulcan:users';
import Posts from 'meteor/vulcan:posts';
import Comments from 'meteor/vulcan:comments';

// Add votes to users
Users.addField([
  /**
    The votes this user has cast on comments.
  */
  {
    fieldName: 'commentVotes',
    fieldSchema: {
      type: Array,
      optional: true,
      viewableBy: ['guests'],
      resolveAs: 'commentVotes: [Vote]',
    }
  },
  {
    fieldName: 'commentVotes.$',
    fieldSchema: {
      type: 'Vote',
      optional: true
    }
  },
  /**
    The votes this user has cast on posts.
  */
  {
    fieldName: 'postVotes',
    fieldSchema: {
      type: Array,
      optional: true,
      viewableBy: ['guests'],
      resolveAs: 'postVotes: [Vote]',
    }
  },
  {
    fieldName: 'postVotes.$',
    fieldSchema: {
      type: 'Vote',
      optional: true
    }
  },
  /**
    The voting power of this user.
  */
  {
    fieldName: "karmaScore",
    fieldSchema: {
      type: Number,
      optional: true,
      defaultValue: 1,
      viewableBy: ['guests'],
    }
  },
  /**
    Whether this user is allowed to vote.
  */
  {
    fieldName: "enfranchised",
    fieldSchema: {
      type: Boolean,
      optional: true,
      defaultValue: true,
      viewableBy: ['guests'],
    }
  },
]);

// Add votes to posts
Posts.addField([
  /**
    The votes cast on this post.
  */
  {
    fieldName: 'votes',
    fieldSchema: {
      type: Array,
      optional: true,
      viewableBy: ['guests'],
      resolveAs: 'votes: [Vote]',
    }
  },
  {
    fieldName: 'votes.$',
    fieldSchema: {
      type: 'Vote',
      optional: true
    }
  },
]);

// Add votes to comments
Comments.addField([
  /**
    The votes cast on this comment.
  */
  {
    fieldName: 'votes',
    fieldSchema: {
      type: Array,
      optional: true,
      viewableBy: ['guests'],
      resolveAs: 'votes: [Vote]',
    }
  },
  {
    fieldName: 'votes.$',
    fieldSchema: {
      type: 'Vote',
      optional: true
    }
  },
]);
