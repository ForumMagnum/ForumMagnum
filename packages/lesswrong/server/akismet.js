import LWEvents from '../lib/collections/lwevents/collection'
import Reports from '../lib/collections/reports/collection.js'
import { Posts } from '../lib/collections/posts/collection.js'
import { Comments } from '../lib/collections/comments/collection.js'
import { newMutation, editMutation, getSetting, addCallback, runCallbacksAsync } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import akismet from 'akismet-api'

const SPAM_KARMA_THRESHOLD = 10 //Threshold after which you are no longer affected by spam detection

async function constructAkismetReport({document, type = "post"}) {
    const author = await Users.findOne(document.userId)

    const link = (type === "post") ?
      Posts.getPageUrl(document, true) :
      (document.postId && Comments.getPageUrl(document, true)) // Don't get link if we create a comment without a post
    const events = await LWEvents.find({userId: author._id, name: 'login'}, {sort: {createdAt: -1}, limit: 1}).fetch()
    const ip = events && events[0] && events[0].properties && events[0].properties.ip
    const userAgent = events && events[0] && events[0].properties && events[0].properties.userAgent
    const referrer = events && events[0] && events[0].properties && events[0].properties.referrer
    return {
      user_ip : ip,              // Required!
      user_agent : userAgent,    // Required!
      referrer : referrer || "",          // Required!
      permalink : link,
      comment_type : (type === "post") ? 'blog-post' : 'comment',
      comment_author : author.displayName,
      comment_author_email : author.email,
      comment_content : document.htmlBody,
      is_test: Meteor.isDevelopment
    }
}

async function checkForAkismetSpam({document, type = "post"}) {
    const akismetReport = constructAkismetReport({document, type})
    const spam = await client.checkSpam(akismetReport)
    // eslint-disable-next-line no-console
    console.log("Checked document for spam: ", akismetReport, "result: ", spam)
    return spam
}

// Akismet API integration
const akismetKey = getSetting('akismet.apiKey', false)
const akismetURL = getSetting('akismet.url', false)
const client = akismet.client({
  key  : akismetKey,
  blog : akismetURL
});

client.verifyKey()
.then(function(valid) {
  //eslint-disable-next-line no-console
  if (valid) console.log('Valid Akismet key!');
  //eslint-disable-next-line no-console
  else console.log('Invalid Akismet key. Please provide a key to activate spam detection.', akismetKey);
})
.catch(function(err) {
  //eslint-disable-next-line no-console
  console.log('Akismet key check failed: ' + err.message);
});

async function checkPostForSpamWithAkismet(post, currentUser) {
  if (akismetKey) {
    const spam = await checkForAkismetSpam({document: post,type: "post"})
    if (spam) {
      //eslint-disable-next-line no-console
      console.log("Spam post detected, creating new Report", currentUser)
      newMutation({
        collection: Reports,
        document: {
          userId: currentUser._id,
          postId: post._id,
          link: Posts.getPageUrl(post),
          description: "Akismet reported this as spam",
          reportedAsSpam: true,
        },
        validate: false,
      })
      if ((currentUser.karma || 0) < SPAM_KARMA_THRESHOLD) {
        // eslint-disable-next-line no-console
        console.log("Deleting post from user below spam threshold", post)
        editMutation({
          collection: Posts,
          documentId: post._id,
          set: {status: 4}, // Sets status to spam
          unset: {}
        })
      }
    } else {
      //eslint-disable-next-line no-console
      console.log('Post marked as not spam', post._id);
    }
  }
  return post
}

addCallback('posts.new.after', checkPostForSpamWithAkismet);

async function checkCommentForSpamWithAkismet(comment, currentUser) {
    if (akismetKey) {
      const spam = await checkForAkismetSpam({content: comment.body, author: currentUser, link: (comment.postId && Comments.getPageUrl(comment, true))})
      if (spam) {
        //eslint-disable-next-line no-console
        console.log("Spam comment detected, creating new Report", currentUser)
        newMutation({
          collection: Reports,
          document: {
            userId: currentUser._id,
            postId: comment.postId,
            commentId: comment._id,
            link: comment.postId && Comments.getPageUrl(comment),
            description: "Akismet reported this as spam",
            reportedAsSpam: true
          },
          validate: false,
        })
        if ((currentUser.karma || 0) < SPAM_KARMA_THRESHOLD) {
          // eslint-disable-next-line no-console
          console.log("Deleting comment from user below spam threshold", comment)
          editMutation({
            collection: Comments, 
            documentId: comment._id,
            set: {
              deleted: true,
              deletedDate: new Date(),
              deletedReason: "Akismet spam detection"
            }
          })
        }
      } else {
        //eslint-disable-next-line no-console
        console.log('Comment marked as not spam', comment._id);
      }
    }
    return comment
  }

addCallback('comments.new.after', checkCommentForSpamWithAkismet);
