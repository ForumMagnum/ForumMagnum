import LWEvents from '../lib/collections/lwevents/collection'
import Reports from '../lib/collections/reports/collection.js'
import { Posts } from '../lib/collections/posts/collection.js'
import { Comments } from '../lib/collections/comments/collection.js'
import { newMutation, getSetting, addCallback } from 'meteor/vulcan:core';
import akismet from 'akismet-api'

async function checkForAkismetSpam({content, author, link}) {
    const events = await LWEvents.find({userId: author._id, name: 'login'}, {sort: {createdAt: -1}, limit: 1}).fetch()
    const ip = events && events[0] && events[0].properties && events[0].properties.ip
    const userAgent = events && events[0] && events[0].properties && events[0].properties.userAgent
    const referrer = events && events[0] && events[0].properties && events[0].properties.referrer
    const spam = await client.checkSpam({
      user_ip : ip,              // Required!
      user_agent : userAgent,    // Required!
      referrer : referrer || "",          // Required!
      permalink : link,
      comment_type : 'post',
      comment_author : author.displayName,
      comment_author_email : author.email,
      comment_content : content,
      is_test : true // Default value is false
    })
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
    const spam = await checkForAkismetSpam({content: post.body, author: currentUser, link: Posts.getPageUrl(post, true)})
    if (spam) {
      //eslint-disable-next-line no-console
      console.log("Spam post detected, creating new Report")
      newMutation({
        collection: Reports,
        document: {
          userId: currentUser._id,
          postId: post._id,
          link: Posts.getPageUrl(post),
          description: "Akismet reported this as spam"
        },
        validate: false,
      })
    } else {
      //eslint-disable-next-line no-console
      console.log('Post marked as not spam');
    }
  }
  return post
}

addCallback('posts.new.after', checkPostForSpamWithAkismet);

async function checkCommentForSpamWithAkismet(comment, currentUser) {
    if (akismetKey) {
      const spam = await checkForAkismetSpam({content: comment.body, author: currentUser, link: Comments.getPageUrl(comment, true)})
      if (spam) {
        //eslint-disable-next-line no-console
        console.log("Spam comment detected, creating new Report")
        newMutation({
          collection: Reports,
          document: {
            userId: currentUser._id,
            postId: comment.postId,
            commentId: comment._id,
            link: Comments.getPageUrl(comment),
            description: "Akismet reported this as spam"
          },
          validate: false,
        })
      } else {
        //eslint-disable-next-line no-console
        console.log('Comment marked as not spam');
      }
    }
    return comment
  }
  
addCallback('comments.new.after', checkCommentForSpamWithAkismet);
  