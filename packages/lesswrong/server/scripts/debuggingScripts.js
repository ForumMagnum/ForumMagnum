/* global Vulcan */
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { createDummyMessage, createDummyConversation, createDummyPost, createDummyComment } from '../../testing/utils.js';
import { performSubscriptionAction } from '../../lib/subscriptions/mutations.js';

Vulcan.populateNotifications = async ({username,
  messageNotifications = 3,
  postNotifications = 3,
  commentNotifications = 3,
  replyNotifications = 3 }) =>
{
  const user = Users.findOne({username});
  const randomUser = Users.findOne({_id: {$ne: user._id}});
  if (messageNotifications > 0) {
    //eslint-disable-next-line no-console
    console.log("generating new messages...")
    const conversation = await createDummyConversation(randomUser, {participantIds: [randomUser._id, user._id]});
    _.times(messageNotifications, () => createDummyMessage(randomUser, {conversationId: conversation._id}))
  }
  if (postNotifications > 0) {
    //eslint-disable-next-line no-console
    console.log("generating new posts...")
    try {
      performSubscriptionAction('subscribe', Users, randomUser._id, user)
    } catch(err) {
      //eslint-disable-next-line no-console
      console.log("User already subscribed, continuing");
    }
    _.times(postNotifications, () => createDummyPost(randomUser))
  }
  if (commentNotifications > 0) {
    const post = Posts.findOne(); // Grab random post
    //eslint-disable-next-line no-console
    console.log("generating new comments...")
    try {
      performSubscriptionAction('subscribe', Posts, post._id, user)
    } catch(err) {
      //eslint-disable-next-line no-console
      console.log("User already subscribed, continuing");
    }
    _.times(commentNotifications, () => createDummyComment(randomUser, {postId: post._id}));

  }
  if (replyNotifications > 0) {
    const post = Posts.findOne();
    //eslint-disable-next-line no-console
    console.log("generating new replies...")
    try {
      performSubscriptionAction('subscribe', Users, randomUser._id, user);
    } catch(err) {
      //eslint-disable-next-line no-console
      console.log("User already subscribed, continuing");
    }
    const comment = createDummyComment(user, {postId: post._id});
    _.times(replyNotifications, () => createDummyComment(randomUser, {postId: post._id, parentCommentId: comment._id}));
  }
}

let loremIpsumTokens = [ "lorem", "ipsum", "dolor", "sit", "amet",
  "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor",
  "incididunt", "ut", "labore", "et" ];

function getLoremIpsumToken() {
  let index = Math.floor(Math.random() * loremIpsumTokens.length);
  return loremIpsumTokens[index];
}

// Generate a given number of characters of lorem ipsum.
function makeLoremIpsum(length) {
  let result = [];
  let lengthSoFar = 0;

  result.push("Lorem ");
  lengthSoFar = "Lorem ".length;

  while(lengthSoFar < length) {
    let token = getLoremIpsumToken()+" ";
    lengthSoFar += token.length;
    result.push(token)
  }

  return result.join("").substr(0,length);
}

// Create a given number of paragraphs of a given length (in characters)
// of lorem ipsum, formatted like:
//   <p>Lorem ipsum dolor sit ame</p>
// This is strictly for making big/slow posts for test purposes.
function makeLoremIpsumBody(numParagraphs, paragraphLength) {
  let result = [];

  for(var ii=0; ii<numParagraphs; ii++) {
    result.push('<p>');
    result.push(makeLoremIpsum(paragraphLength));
    result.push('</p>');
  }
  return result.join("");
}

function makeStyledBody() {
  let result = [];

  result.push('<h1>Post Title</h1>')

  result.push('<p><a>Test Link</a> ');
  result.push(makeLoremIpsum(500));
  result.push('</p>');
  result.push('<p>');
  result.push(makeLoremIpsum(200));
  result.push('</p>');

  result.push('<ul><li>Option 1</li><li>Option 2</li><li>Option 3</li></ul>');

  result.push('<p>');
  result.push(makeLoremIpsum(200));
  result.push('</p>');

  result.push('<blockquote><a>Test Link</a> ');
  result.push(makeLoremIpsum(300));
  result.push('</blockquote>');
  result.push('<blockquote>');
  result.push(makeLoremIpsum(100));
  result.push('</blockquote>');

  result.push('<pre><code><a>Test Link</a> ');
  result.push(makeLoremIpsum(100));
  result.push('</code></pre>');

  result.push('<p>');
  result.push(makeLoremIpsum(250));
  result.push('</p>');

  result.push('<blockquote><a>Test Link</a> ');
  result.push(makeLoremIpsum(300));
  result.push('</blockquote>');

  result.push('<p>');
  result.push(makeLoremIpsum(250));
  result.push('</p>');

  result.push('<pre><code><a>Test Link</a> ');
  result.push(makeLoremIpsum(100));
  result.push('</code></pre>');

  result.push('<h2>Post Title</h2>')
  result.push('<p>');
  result.push(makeLoremIpsum(200));
  result.push('</p>');

  return result.join("");
}

Vulcan.createStyledPost = async () => {
  const user = Users.findOne();
  // Create a post

  const post = await createDummyPost(user, {
    title: "Styled Post",
    slug: "styled-post",
    body: makeStyledBody(),
    af: true,
    frontpageDate: new Date(),
  })

  await createDummyComment(user, {
    postId: post._id,
    body: makeStyledBody()
  })
}

// Create a set of bulky test posts, used for checking for load time
// problems. This is meant to be invoked from 'meteor shell'. It is
// slow.

Vulcan.createTestPostSet = async () =>
{
  //eslint-disable-next-line no-console
  console.log("Creating a set of bulky posts to test for load-time problems. This may take awhile...");
  await Vulcan.createStyledPost()

  await Vulcan.createBulkyTestPost({
    postTitle: "Test post with 100 flat comments",
    numRootComments: 100
  });
  await Vulcan.createBulkyTestPost({
    postTitle: "Test post with 1000 flat comments",
    numRootComments: 1000
  });
  await Vulcan.createBulkyTestPost({
    postTitle: "Test post with 50-deep comments",
    numRootComments: 1,
    commentDepth: 50
  });
  await Vulcan.createBulkyTestPost({
    postTitle: "Test post with 1000-deep comments",
    numRootComments: 1,
    commentDepth: 1000
  });
  await Vulcan.createBulkyTestPost({
    postTitle: "Test post with a 500-paragraph long post body",
    postParagraphCount: 500,
    numRootComments: 1,
  });
  await Vulcan.createBulkyTestPost({
    postTitle: "Test post with a 500-paragraph long comment body",
    commentParagraphCount: 500,
    numRootComments: 1,
  });
  await Vulcan.createBulkyTestPost({
    postTitle: "Test post with a 100kb-long single paragraph body",
    postParagraphCount: 1,
    postParagraphLength: 100000,
    numRootComments: 1,
  });
  await Vulcan.createBulkyTestPost({
    postTitle: "Test post with a 100kb-long single comment body",
    commentParagraphCount: 1,
    commentParagraphLength: 100000,
    numRootComments: 1,
  });
  //eslint-disable-next-line no-console
  console.log("Finished creating bulky test posts.");
}


// Create a single test post, which is bulky in one or more of a
// number of different ways, controlled by arguments. Used for testing
// for loading time problems. Vulcan.createTestPostSet() will invoke
// this in different ways with pretty good coverage of the problems
// it's capable uncovering.
Vulcan.createBulkyTestPost = async ({
  username = null,
  postTitle = "Test Post With Many Comments",
  postParagraphCount = 3,
  postParagraphLength = 1000,
  commentParagraphCount = 2,
  commentParagraphLength = 800,
  numRootComments = 100,
  commentDepth = 1 }) =>
{
  var user;
  if(username)
    user = Users.findOne({username});
  else
    user = Users.findOne();

  // Create a post
  const body = "<p>This is a programmatically generated test post.</p>" +
    makeLoremIpsumBody(postParagraphCount, postParagraphLength);

  const post = await createDummyPost(user, {
    title: postTitle,
    body: body
  })

  // Create some comments
  for(var ii=0; ii<numRootComments; ii++)
  {
    //eslint-disable-next-line no-await-in-loop
    var rootComment = await createDummyComment(user, {
      postId: post._id,
      body: makeLoremIpsumBody(commentParagraphCount, commentParagraphLength)
    })

    // If commentDepth>1, create a series of replies-to-replies under the top-level replies
    var parentCommentId = rootComment._id
    for(var jj=0; jj<commentDepth-1; jj++) {
      var childComment = await createDummyComment(user, {
        postId: post._id,
        parentCommentId: parentCommentId,
        body: makeLoremIpsumBody(commentParagraphCount, commentParagraphLength)
      });
      parentCommentId = childComment._id
    }
  }
}
