import LWEvents from '../lib/collections/lwevents/collection'
import { Posts } from '../lib/collections/posts/collection'
import { postGetPageUrl } from '../lib/collections/posts/helpers'
import { Comments } from '../lib/collections/comments/collection'
import { updateMutator } from './vulcan-lib';
import Users from '../lib/collections/users/collection';
import akismet from 'akismet-api'
import { isDevelopment } from '../lib/executionEnvironment';
import { DatabaseServerSetting } from './databaseSettings';
import { getCollectionHooks } from './mutationCallbacks';

const SPAM_KARMA_THRESHOLD = 10 //Threshold after which you are no longer affected by spam detection

// Akismet API integration
const akismetKeySetting = new DatabaseServerSetting<string | null>('akismet.apiKey', null)
const akismetURLSetting = new DatabaseServerSetting<string | null>('akismet.url', null)
const client = akismet.client({
  key  : akismetKeySetting.get(),                   
  blog : akismetURLSetting.get()       
});

async function constructAkismetReport({document, type = "post"}) {
    const author = await Users.findOne(document.userId)
    if (!author) throw Error("Couldn't find author for Akismet report")
    let post = document
    if (type !== "post") {
      post = await Posts.findOne(document.postId)
    }
    const link = (post && postGetPageUrl(post)) || ""  // Don't get link if we create a comment without a post
    const events = await LWEvents.find({userId: author._id, name: 'login'}, {sort: {createdAt: -1}, limit: 1}).fetch()
    const ip = events && events[0] && events[0].properties && events[0].properties.ip
    const userAgent = events && events[0] && events[0].properties && events[0].properties.userAgent
    const referrer = events && events[0] && events[0].properties && events[0].properties.referrer
    return {
      user_ip : ip,              // Required!
      user_agent : userAgent,    // Required!
      referer: referrer,
      permalink : akismetURLSetting.get() + link,
      comment_type : (type === "post") ? 'blog-post' : 'comment',
      comment_author : author.displayName,
      comment_author_email : author.email,
      comment_content : document.contents && document.contents.html, 
      is_test: isDevelopment
    }
}

async function checkForAkismetSpam({document, type = "post"}) {
  try {
    const akismetReport = await constructAkismetReport({document, type})
    const spam = await client.checkSpam(akismetReport)
    // eslint-disable-next-line no-console
    console.log("Checked document for spam: ", akismetReport, "result: ", spam)
    return spam
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Akismet spam checker crashed. Classifying as not spam.", e)
    return false
  }

}

client.verifyKey()
  .then(function(valid) {
    //eslint-disable-next-line no-console
    if (valid) console.log('Valid Akismet key!');
    //eslint-disable-next-line no-console
    else console.log('Invalid Akismet key. Please provide a key to activate spam detection.', akismetKeySetting.get());
  })
  .catch(function(err) {
    //eslint-disable-next-line no-console
    console.log('Akismet key check failed: ' + err.message);
  });

getCollectionHooks("Posts").newAfter.add(async function checkPostForSpamWithAkismet(post: DbPost, currentUser: DbUser|null) {
  if (!currentUser) throw new Error("Submitted post has no associated user");
  
  if (akismetKeySetting.get()) {
    const spam = await checkForAkismetSpam({document: post,type: "post"})
    if (spam) {
      if (((currentUser.karma || 0) < SPAM_KARMA_THRESHOLD) && !currentUser.reviewedByUserId) {
        // eslint-disable-next-line no-console
        console.log("Deleting post from user below spam threshold", post)
        await updateMutator({
          collection: Posts,
          documentId: post._id,
          set: {status: 4},
          validate: false,
        });
      }
    } else {
      //eslint-disable-next-line no-console
      console.log('Post marked as not spam', post._id);
    }
  }
  return post
});

getCollectionHooks("Comments").newAfter.add(async function checkCommentForSpamWithAkismet(comment: DbComment, currentUser: DbUser|null) {
    if (!currentUser) throw new Error("Submitted comment has no associated user");
    
    if (akismetKeySetting.get()) {
      const spam = await checkForAkismetSpam({document: comment, type: "comment"})
      if (spam) {
        if (((currentUser.karma || 0) < SPAM_KARMA_THRESHOLD) && !currentUser.reviewedByUserId) {
          // eslint-disable-next-line no-console
          console.log("Deleting comment from user below spam threshold", comment)
          await updateMutator({
            collection: Comments,
            documentId: comment._id,
            set: {
              deleted: true,
              deletedDate: new Date(), 
              deletedReason: "Your comment has been marked as spam by the Akismet spam integration. We will review your comment in the coming hours and restore it if we determine that it isn't spam"
            },
            validate: false,
          });
        }
      } else {
        //eslint-disable-next-line no-console
        console.log('Comment marked as not spam', comment._id);
      }
    }
    return comment
});

getCollectionHooks("Reports").editAsync.add(
  async function runReportCloseCallbacks(newReport: DbReport, oldReport: DbReport) {
    if (newReport.closedAt && !oldReport.closedAt) {
      await akismetReportSpamHam(newReport);
    }
  }
);


async function akismetReportSpamHam(report: DbReport) {
  if (report.reportedAsSpam) {
    let comment
    const post = await Posts.findOne(report.postId)
    if (report.commentId) {
      comment = Comments.findOne(report.commentId)
    }
    if (!report.markedAsSpam) {
      const akismetReportArguments = report.commentId ? {document: comment, type: "comment"} : {document: post, type: "post"}
      const akismetReport = await constructAkismetReport(akismetReportArguments)
      client.submitHam(akismetReport, (err) => {
        // eslint-disable-next-line no-console
        if (!err) { console.log("Reported Akismet false positive", akismetReport)}
      })
    }
  }
}


export async function postReportPurgeAsSpam(post: DbPost) {
  const akismetReport = await constructAkismetReport({document: post, type: "post"})
  client.submitSpam(akismetReport, (err) => {
    // eslint-disable-next-line no-console
    if (!err) { console.log("Reported Akismet false negative", akismetReport)}
  })
}

export async function commentReportPurgeAsSpam(comment: DbComment) {
  const akismetReport = await constructAkismetReport({document: comment, type: "comment"})
  client.submitSpam(akismetReport, (err) => {
    // eslint-disable-next-line no-console
    if (!err) { console.log("Reported Akismet false negative", akismetReport)}
  })
}
