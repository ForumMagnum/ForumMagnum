import LWEvents from '../lib/collections/lwevents/collection'
import { Posts } from '../lib/collections/posts/collection'
import { postGetPageUrl } from '../lib/collections/posts/helpers'
import { Comments } from '../lib/collections/comments/collection'
import { updateMutator } from './vulcan-lib/mutators';
import Users from '../lib/collections/users/collection';
import akismet from 'akismet-api'
import { isDevelopment } from '../lib/executionEnvironment';
import { DatabaseServerSetting } from './databaseSettings';
import { getCollectionHooks } from './mutationCallbacks';
import { captureEvent } from '../lib/analyticsEvents';
import { getLatestContentsRevision } from '@/lib/collections/revisions/helpers';

const SPAM_KARMA_THRESHOLD = 10 //Threshold after which you are no longer affected by spam detection

// Akismet API integration
const akismetKeySetting = new DatabaseServerSetting<string | null>('akismet.apiKey', null)
const akismetURLSetting = new DatabaseServerSetting<string | null>('akismet.url', null)

let akismetClient: any = null;
const getAkismetClient = () => {
  if (!akismetClient) {
    akismetClient = akismet.client({
      key  : akismetKeySetting.get(),
      blog : akismetURLSetting.get()
    });
    akismetClient.verifyKey()
      .then(function(valid: AnyBecauseTodo) {
        //eslint-disable-next-line no-console
        if (valid) console.log('Valid Akismet key!');
        //eslint-disable-next-line no-console
        else console.log('Invalid Akismet key. Please provide a key to activate spam detection.', akismetKeySetting.get());
      })
      .catch(function(err: AnyBecauseTodo) {
        //eslint-disable-next-line no-console
        console.log('Akismet key check failed: ' + err.message);
      });
  }
  return akismetClient;
}

async function constructAkismetReport({document, type="post"}: {
  document: AnyBecauseTodo
  type: string
}) {
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

  const content = type === "post"
    ? (await getLatestContentsRevision(document))?.html
    : document.contents?.html

  return {
    user_ip : ip,              // Required!
    user_agent : userAgent,    // Required!
    referer: referrer,
    permalink : akismetURLSetting.get() + link,
    comment_type : (type === "post") ? 'blog-post' : 'comment',
    comment_author : author.displayName,
    comment_author_email : author.email,
    comment_content : content,
    is_test: isDevelopment
  }
}

async function checkForAkismetSpam({document, type}: AnyBecauseTodo) {
  try {
    if (document?.contents?.html?.indexOf("spam-test-string-123") >= 0) {
      // eslint-disable-next-line no-console
      console.log(`${type} contained Akismet spam filter test string; marking as spam.`);
      return true;
    }
    const akismetReport = await constructAkismetReport({document, type})
    const spam = await getAkismetClient().checkSpam(akismetReport)
    // eslint-disable-next-line no-console
    console.log("Checked document for spam: ", akismetReport, "result is spam: ", spam)
    return spam
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Akismet spam checker crashed. Classifying as not spam.", e)
    return false
  }
}

getCollectionHooks("Comments").newAfter.add(async function checkCommentForSpamWithAkismet(comment: DbComment, currentUser: DbUser|null) {
    if (!currentUser) throw new Error("Submitted comment has no associated user");
    
    // Don't spam-check imported comments
    if (comment.legacyData?.arbitalPageId) {
      return comment;
    }

    const unreviewedUser = !currentUser.reviewedByUserId;
    
    if (unreviewedUser && akismetKeySetting.get()) {
      const start = Date.now();

      const spam = await checkForAkismetSpam({document: comment, type: "comment"})

      const timeElapsed = Date.now() - start;
      captureEvent('checkForAkismetSpamCompleted', {
        commentId: comment._id,
        timeElapsed
      }, true);

      if (spam) {
        if (((currentUser.karma || 0) < SPAM_KARMA_THRESHOLD) && !currentUser.reviewedByUserId) {
          // eslint-disable-next-line no-console
          console.log("Deleting comment from user below spam threshold", comment)
          await updateMutator({
            collection: Comments,
            documentId: comment._id,
            // NOTE: This mutation has no user attached. This interacts with commentsDeleteSendPMAsync so that the PM notification of a deleted comment appears to come from themself.
            set: {
              deleted: true,
              deletedDate: new Date(),
              deletedReason: "This comment has been marked as spam by the Akismet spam integration. We've sent the poster a PM with the content. If this deletion seems wrong to you, please send us a message on Intercom (the icon in the bottom-right of the page)."
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
      comment = await Comments.findOne(report.commentId)
    }
    if (!report.markedAsSpam) {
      const akismetReportArguments = report.commentId ? {document: comment, type: "comment"} : {document: post, type: "post"}
      const akismetReport = await constructAkismetReport(akismetReportArguments)
      getAkismetClient().submitHam(akismetReport, (err: AnyBecauseTodo) => {
        // eslint-disable-next-line no-console
        if (!err) { console.log("Reported Akismet false positive", akismetReport)}
      })
    }
  }
}


export async function postReportPurgeAsSpam(post: DbPost) {
  const akismetReport = await constructAkismetReport({document: post, type: "post"})
  getAkismetClient().submitSpam(akismetReport, (err: AnyBecauseTodo) => {
    // eslint-disable-next-line no-console
    if (!err) { console.log("Reported Akismet false negative", akismetReport)}
  })
}

export async function commentReportPurgeAsSpam(comment: DbComment) {
  const akismetReport = await constructAkismetReport({document: comment, type: "comment"})
  getAkismetClient().submitSpam(akismetReport, (err: AnyBecauseTodo) => {
    // eslint-disable-next-line no-console
    if (!err) { console.log("Reported Akismet false negative", akismetReport)}
  })
}
