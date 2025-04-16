import { postGetPageUrl } from '../lib/collections/posts/helpers'
import akismet from 'akismet-api'
import { isDevelopment } from '../lib/executionEnvironment';
import { akismetKeySetting, akismetURLSetting } from './databaseSettings';
import { getLatestContentsRevision } from '@/server/collections/revisions/helpers';


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

async function constructAkismetReport({document, type="post", context}: {
  document: AnyBecauseTodo
  type: string
  context: ResolverContext
}) {
  const { Users, Posts, LWEvents } = context;
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
    ? (await getLatestContentsRevision(document, context))?.html
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

export async function checkForAkismetSpam({document, type, context}: AnyBecauseTodo) {
  try {
    if (document?.contents?.html?.indexOf("spam-test-string-123") >= 0) {
      // eslint-disable-next-line no-console
      console.log(`${type} contained Akismet spam filter test string; marking as spam.`);
      return true;
    }
    const akismetReport = await constructAkismetReport({document, type, context})
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

export async function maybeSendAkismetReport(newReport: DbReport, oldReport: DbReport, context: ResolverContext) {
  if (newReport.closedAt && !oldReport.closedAt) {
    await akismetReportSpamHam(newReport, context);
  }
}


async function akismetReportSpamHam(report: DbReport, context: ResolverContext) {
  const { Posts, Comments } = context;
  if (report.reportedAsSpam) {
    let comment
    const post = await Posts.findOne(report.postId)
    if (report.commentId) {
      comment = await Comments.findOne(report.commentId)
    }
    if (!report.markedAsSpam) {
      const akismetReportArguments = report.commentId
        ? {document: comment, type: "comment", context}
        : {document: post, type: "post", context};

      const akismetReport = await constructAkismetReport(akismetReportArguments)
      getAkismetClient().submitHam(akismetReport, (err: AnyBecauseTodo) => {
        // eslint-disable-next-line no-console
        if (!err) { console.log("Reported Akismet false positive", akismetReport)}
      })
    }
  }
}


export async function postReportPurgeAsSpam(post: DbPost, context: ResolverContext) {
  const akismetReport = await constructAkismetReport({document: post, type: "post", context})
  getAkismetClient().submitSpam(akismetReport, (err: AnyBecauseTodo) => {
    // eslint-disable-next-line no-console
    if (!err) { console.log("Reported Akismet false negative", akismetReport)}
  })
}

export async function commentReportPurgeAsSpam(comment: DbComment, context: ResolverContext) {
  const akismetReport = await constructAkismetReport({document: comment, type: "comment", context})
  getAkismetClient().submitSpam(akismetReport, (err: AnyBecauseTodo) => {
    // eslint-disable-next-line no-console
    if (!err) { console.log("Reported Akismet false negative", akismetReport)}
  })
}
