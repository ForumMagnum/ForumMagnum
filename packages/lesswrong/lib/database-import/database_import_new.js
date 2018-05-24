/* global Vulcan */
import Users from 'meteor/vulcan:users';
import { Posts, Comments } from 'meteor/example-forum';
import { newMutation, Utils } from 'meteor/vulcan:core';
import moment from 'moment';
import marked from 'marked';
import pgp from 'pg-promise';
import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';
import pick from 'lodash/pick';
import htmlToText from 'html-to-text';

const postgresImportDetails = {
  host: 'localhost',
  port: 5432,
  database: 'reddit',
  user: 'reddit',
  password: '' // Ommitted for obvious reasons
}

Vulcan.postgresImport = async () => {
  // Set up DB connection
  let postgresConnector = pgp({});
  let database = postgresConnector(postgresImportDetails);


  /*
    USER DATA IMPORT
  */
  //eslint-disable-next-line no-console
  console.info("Starting user data import");

  // Query for user data
  const rawUserData = await database.any('SELECT thing_id, key, value from reddit_data_account', [true]);
  const rawUserMetaData = await database.any('SELECT thing_id, deleted, date from reddit_thing_account', [true]);
  // Process user data
  const groupedUserData = groupBy(rawUserData, (row) => row.thing_id);
  const flattenedUserData = mapValues(groupedUserData, keyValueArraytoObject);
  // Process user metadata
  const groupedUserMetaData = groupBy(rawUserMetaData, (row) => row.thing_id);
  const flattenedUserMetaData = mapValues(groupedUserMetaData, (v) => _.pick(v[0], 'deleted', 'date'));
  // Merge data
  const mergedGroupedUserData = deepObjectExtend(flattenedUserData, flattenedUserMetaData)
  // Convert to LW2 user format
  const processedUsers = _.map(mergedGroupedUserData, legacyUserToNewUser);

  // Construct user lookup table to avoid repeated querying
  let legacyIdToUserMap = await new Map(await Users.find().fetch().map((user) => [user.legacyId, user]));

  // Upsert Users
  await upsertProcessedUsers(processedUsers, legacyIdToUserMap);

  // Construct user lookup table to avoid repeated querying
  legacyIdToUserMap = new Map(Users.find().fetch().map((user) => [user.legacyId, user]));

  /*
    POST DATA IMPORT
  */

  //eslint-disable-next-line no-console
  console.log("Starting post data import");

  // Query for post data
  const rawPostData = await database.any('SELECT thing_id, key, value from reddit_data_link', [true]);
  const rawPostMetaData = await database.any('SELECT thing_id, ups, downs, deleted, spam, descendant_karma, date from reddit_thing_link', [true]);
  // Process post data
  const groupedPostData = groupBy(rawPostData, (row) => row.thing_id);
  const flattenedPostData = mapValues(groupedPostData, keyValueArraytoObject);
  // Process post metadata
  const groupedPostMetaData = groupBy(rawPostMetaData, (row) => row.thing_id);
  const flattenedPostMetaData = mapValues(groupedPostMetaData, (v) => _.pick(v[0], 'ups', 'downs', 'deleted', 'spam', 'descendant_karma', 'date'));
  // Merge data
  const mergedGroupedPostData = deepObjectExtend(flattenedPostData, flattenedPostMetaData);
  // Convert to LW2 post format
  const processedPosts = mapValues(mergedGroupedPostData, (post, id) => legacyPostToNewPost(post, id, legacyIdToUserMap.get(post.author_id)));

  // Construct post lookup table to avoid repeated querying
  let legacyIdToPostMap = new Map(Posts.find().fetch().map((post) => [post.legacyId, post]));

  // Upsert Posts
  await upsertProcessedPosts(processedPosts, legacyIdToPostMap);
  // Construct post lookup table to avoid repeated querying
  legacyIdToPostMap = new Map(Posts.find().fetch().map((post) => [post.legacyId, post]));

  /*
    COMMENT DATA IMPORT
  */

  //eslint-disable-next-line no-console
  console.log("Starting the comment data import");

  // Query for comment data
  let rawCommentData = await database.any('SELECT thing_id, key, value from reddit_data_comment', [true]);
  let rawCommentMetadata = await database.any('SELECT thing_id, ups, downs, deleted, spam, date from reddit_thing_comment', [true]);
  // Process comment data
  let commentData = groupBy(rawCommentData, (row) => row.thing_id);
  commentData = mapValues(commentData, keyValueArraytoObject);
  // Process post metadata
  let commentMetaData = groupBy(rawCommentMetadata, (row) => row.thing_id);
  commentMetaData = mapValues(commentMetaData, (v) => pick(v[0], 'ups', 'downs', 'deleted', 'spam', 'date'));
  // Merge data
  commentData = deepObjectExtend(commentData, commentMetaData);
  // Convert to LW2 comment format [Does not yet include parentCommentIds and topLevelCommentIds]
  commentData = mapValues(commentData,
    (comment, id) => legacyCommentToNewComment(comment, id, legacyIdToUserMap.get(comment.author_id), legacyIdToPostMap.get(comment.link_id))
  );

  let legacyIdToCommentMap = new Map(Comments.find().fetch().map((comment) => [comment.legacyId, comment]));

  commentData = _.map(commentData, (comment, id) => addParentCommentId(comment, legacyIdToCommentMap.get(comment.legacyParentId) || commentData[comment.legacyParentId]))

  //eslint-disable-next-line no-console
  console.log("Finished Comment Data Processing", commentData[25], commentData[213]);

  await upsertProcessedComments(commentData, legacyIdToCommentMap);

  //eslint-disable-next-line no-console
  console.log("Finished Upserting comments");

  // construct comment lookup table to avoid repeated querying
  legacyIdToCommentMap = new Map(Comments.find().fetch().map((comment) => [comment.legacyId, comment]));

  //eslint-disable-next-line no-console
  console.log("Finished comment data import");
}

const addParentCommentId = (comment, parentComment) => {
  if (parentComment) {
    return {...comment, parentCommentId: parentComment._id, topLevelCommentId: parentComment._id};
  } else {
    return comment;
  }
}

Vulcan.syncUserPostCount = async () => {
  const postCounters = await Posts.rawCollection().aggregate([
    {"$group" : {_id:"$userId", count:{$sum:1}}}
  ])
  //eslint-disable-next-line no-console
  console.log("Started updating post counts:", postCounters);
  const postCounterArray = await postCounters.toArray();
  const userUpdates = postCounterArray.map((counter) => ({
    updateOne :
    {
      filter : {_id: counter.userId},
      update : {$set: {'postCount' : counter.count}}
    }
  }))
  const userUpdateCursor = await Users.rawCollection().bulkWrite(userUpdates, {ordered: false})
  //eslint-disable-next-line no-console
  console.log("Finished updating users:", userUpdateCursor);
}

const deepObjectExtend = (target, source) => {
    for (var prop in source)
        if (prop in target)
            deepObjectExtend(target[prop], source[prop]);
        else
            target[prop] = source[prop];
    return target;
}

const upsertProcessedPosts = async (posts, postMap) => {
  const postUpdates = _.map(posts, (post) => {
    const existingPost = postMap.get(post.legacyId);
    if (existingPost) {
      let set = {legacyData: post.legacyData};
      if (post.deleted || post.spam) {
        set.status = 3;
      }
      return {
        updateOne :
        {
          filter : {_id: existingPost._id},
          update : {$set: set},
          upsert : false
        }
      }
    } else {
      return {
        insertOne : { document : post}
      }
    }
  })
  await Posts.rawCollection().bulkWrite(postUpdates, {ordered: false});
  // console.log("Upserted posts: ", postUpdateCursor);
}

const upsertProcessedUsers = async (users, userMap) => {
  let userCounter = 0;
  // We first find all the users for which we already have an existing user in the DB
  const usersToUpdate = _.filter(users, (user) => userMap.get(user.legacyId))
  //eslint-disable-next-line no-console
  console.log("Updating N users: ", _.size(usersToUpdate), usersToUpdate[22], typeof usersToUpdate);
  const usersToInsert = _.filter(users, (user) => !userMap.get(user.legacyId))
  //eslint-disable-next-line no-console
  console.log("Inserting N users: ", _.size(usersToInsert), usersToInsert[22], typeof usersToInsert);
  if (usersToUpdate && _.size(usersToUpdate)) {await bulkUpdateUsers(usersToUpdate, userMap);}
  if (usersToInsert && _.size(usersToInsert)) {
    for(let key in usersToInsert) {
      await insertUser(usersToInsert[key]);
      userCounter++;
      if(userCounter % 1000 == 0){
        //eslint-disable-next-line no-console
        console.log("UserCounter: " + userCounter);
      }
    }
  }
}

const bulkUpdateUsers = async (users, userMap) => {
  const userUpdates = users.map((newUser) => {
    const oldUser = userMap.get(newUser.legacyId);
    let set = {legacyData: newUser.legacyData, deleted: newUser.deleted, username: newUser.username};
    if (newUser.legacyData.email !== oldUser.legacyData.email && oldUser.email === oldUser.legacyData.email) {
      //eslint-disable-next-line no-console
      console.log("Found email change", newUser.username, newUser.legacyData.email, oldUser.email);
      set.email = newUser.legacyData.email;
      set.emails = [{address: newUser.legacyData.email, verified: true}]
    }
    return {
      updateOne :
      {
        filter : {_id: oldUser._id},
        update : {$set: set},
        upsert : false
      }
    }
  })
  const userUpdateCursor = await Users.rawCollection().bulkWrite(userUpdates, {ordered: false});
  //eslint-disable-next-line no-console
  console.log("userUpdateCursor: ", userUpdateCursor);
}

const insertUser = async (user) => {
  // console.log("insertUser", user);
  try {
    await newMutation({
      collection: Users,
      document: user,
      validate: false
    })
  } catch(err) {
    if (err.code == 11000) {
      const newUser = {...user, username: user.username + "_duplicate" + Math.random().toString(), emails: []}
      try {
        newMutation({
          collection: Users,
          document: newUser,
          validate: false
        })
      } catch(err) {
        //eslint-disable-next-line no-console
        console.error("User Import failed", err, user);
      }
    } else {
      //eslint-disable-next-line no-console
      console.error("User Import failed", err, user);
    }
  }
}

const upsertProcessedComments = async (comments, commentMap) => {
  let postUpdates = [];
  let userUpdates = [];
  let commentUpdates = [];
  _.map(comments, (comment) => {
    const existingComment = commentMap.get(comment.legacyId);
    if (existingComment) {
      let set = {legacyData: comment.legacyData, parentCommentId: comment.parentCommentId, topLevelCommentId: comment.topLevelCommentId};
      if (comment.retracted) {
        set.retracted = true;
      }
      commentUpdates.push({
        updateOne :
        {
          filter : {_id: existingComment._id},
          update : {$set: set},
          upsert : false
        }
      })
    } else {
      commentUpdates.push({
        insertOne : { document : comment }
      })
      postUpdates.push({
        updateOne :
        {
          filter : {_id: comment.postId},
          update : {
            $inc:       {commentCount: 1},
            $max:       {lastCommentedAt: comment.postedAt},
            $addToSet:  {commenters: comment.userId}
          },
          upsert : false,
        }
      })
      userUpdates.push({
        updateOne :
        {
          filter : {_id: comment.userId},
          update : {$inc: {commentCount: 1}},
          upsert : false
        }
      })
    }
  })
  if (postUpdates && _.size(postUpdates)) {
    const postUpdateCursor = await Posts.rawCollection().bulkWrite(postUpdates, {ordered: false});
    //eslint-disable-next-line no-console
    console.log("postUpdateCursor", postUpdateCursor);
  }
  if (userUpdates && _.size(userUpdates)) {
    const userUpdateCursor = await Users.rawCollection().bulkWrite(userUpdates, {ordered: false});
    //eslint-disable-next-line no-console
    console.log("userUpdateCursor", userUpdateCursor);
  }
  if (commentUpdates && _.size(commentUpdates)) {
    const commentUpdateCursor = await Comments.rawCollection().bulkWrite(commentUpdates, {ordered: false});
    //eslint-disable-next-line no-console
    console.log("commentUpdateCursor", commentUpdateCursor);
  }
}

const keyValueArraytoObject = (keyValueArray) => {
  return keyValueArray.reduce(
    (prev,curr) => {
      prev[curr.key]=curr.value;
      return prev;
    },
    {} // Initial Value
  )
}

const legacyUserToNewUser = (user, legacyId) => {
  return {
    legacy: true,
    legacyId: legacyId,
    legacyData: user,
    username: user.name,
    email: user.email,
    deleted: user.deleted,
    createdAt: moment(user.date).toDate(),
    services: {},
    emails: user.email ? [{address: user.email, verified: true}] : null,
  }
}

const legacyPostToNewPost = (post, legacyId, user) => {
  const body = htmlToText.fromString(post.article);
  const isPublished = post.sr_id === "2" || post.sr_id === "3" || post.sr_id === "3391" || post.sr_id === "4";
  return {
    _id: Random.id(),
    legacy: true,
    legacyId: legacyId,
    legacyData: post,
    title: post.title,
    userId: user && user._id,
    htmlBody: post.article,
    userIP: post.ip,
    status: post.deleted || post.spam ? 3 : 2,
    legacySpam: post.spam,
    baseScore: post.ups - post.downs,
    url: absoluteURLRegex.test(post.url) ? post.url : null,
    createdAt: moment(post.date).toDate(),
    postedAt: moment(post.date).toDate(),
    slug: Utils.slugify(post.title),
    body: body,
    excerpt: body.slice(0,600),
    draft: !isPublished,
  };
}

const legacyCommentToNewComment = (comment, legacyId, author, parentPost) => {
  //eslint-disable-next-line no-console
  if (!author) {console.warn("Missing author for comment:", comment)}
  //eslint-disable-next-line no-console
  if (!parentPost) {console.warn("Missing parent post for comment: ", comment)}
  return {
    _id: Random.id(),
    legacy: true,
    legacyId: legacyId,
    legacyParentId: comment.parent_id,
    legacyData: comment,
    postId: parentPost && parentPost._id,
    userId: author && author._id,
    baseScore: comment.ups - comment.downs,
    body: comment.body,
    retracted: comment.retracted,
    deleted: comment.deleted,
    isDeleted: comment.isDeleted,
    createdAt: moment(comment.date).toDate(),
    postedAt: moment(comment.date).toDate(),
    htmlBody: comment.body && Utils.sanitize(marked(comment.body)),
  };
}

const absoluteURLRegex = new RegExp('^(?:[a-z]+:)?//', 'i');
