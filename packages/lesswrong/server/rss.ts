import RSS from 'rss';
import { Comments } from '../lib/collections/comments';
import { commentGetPageUrlFromDB } from '../lib/collections/comments/helpers';
import { Posts } from '../lib/collections/posts';
import { postGetPageUrl } from '../lib/collections/posts/helpers';
import { userGetDisplayNameById } from '../lib/vulcan-users/helpers';
import { forumTitleSetting, siteUrlSetting, taglineSetting } from '../lib/instanceSettings';
import moment from '../lib/moment-timezone';
import { rssTermsToUrl, RSSTerms } from '../lib/rss_urls';
import { addStaticRoute, createAnonymousContext } from './vulcan-lib';
import { accessFilterMultiple } from '../lib/utils/schemaUtils';
import { getCommentParentTitle } from '../lib/notificationTypes';
import { asyncForeachSequential } from '../lib/utils/asyncUtils';
import { getContextFromReqAndRes } from './vulcan-lib/apollo-server/context';
import { viewTermsToQuery } from '../lib/utils/viewUtils';


Posts.addView('rss', Posts.views.new); // default to 'new' view for RSS feed
Comments.addView('rss', Comments.views.recentComments); // default to 'recentComments' view for comments RSS feed

export const getMeta = (url: string) => {
  const siteUrl = siteUrlSetting.get();

  return {
    title: forumTitleSetting.get(),
    description: taglineSetting.get(),
    feed_url: url,
    site_url: siteUrl,
    image_url: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_lncumn.ico"
  };
};

type KarmaThreshold = 2 | 30 | 45 | 75 | 125 | 200;

// LESSWRONG - this was added to handle karmaThresholds
const roundKarmaThreshold = (threshold: number): KarmaThreshold =>
    (threshold < 16 || !threshold) ? 2
  : (threshold < 37) ? 30
  : (threshold < 60) ? 45
  : (threshold < 100) ? 75
  : (threshold < 162) ? 125
  : 200;

const servePostRSS = async (terms: RSSTerms, url?: string) => {
  // LESSWRONG - this was added to handle karmaThresholds
  let karmaThreshold = terms.karmaThreshold = roundKarmaThreshold(parseInt(terms.karmaThreshold, 10));
  url = url || rssTermsToUrl(terms); // Default value is the custom rss feed computed from terms
  const feed = new RSS(getMeta(url));
  const context = createAnonymousContext();
  const parameters = viewTermsToQuery("Posts", terms, undefined, context);
  delete parameters['options']['sort']['sticky'];

  parameters.options.limit = 10;

  const postsCursor = await Posts.find(parameters.selector, parameters.options).fetch();
  const restrictedPosts = await accessFilterMultiple(null, Posts, postsCursor, null) as DbPost[];

  await asyncForeachSequential(restrictedPosts, async (post) => {
    // LESSWRONG - this was added to handle karmaThresholds
    let thresholdDate = (karmaThreshold === 2)  ? post.scoreExceeded2Date
                      : (karmaThreshold === 30) ? post.scoreExceeded30Date
                      : (karmaThreshold === 45) ? post.scoreExceeded45Date
                      : (karmaThreshold === 75) ? post.scoreExceeded75Date
                      : (karmaThreshold === 125) ? post.scoreExceeded125Date
                      : (karmaThreshold === 200) ? post.scoreExceeded200Date
                      : null;
    thresholdDate = thresholdDate || post.postedAt;
    let viewDate = (terms.view === "frontpage-rss") ? post.frontpageDate
                 : (terms.view === "curated-rss")   ? post.curatedDate
                 : (terms.view === "meta-rss")      ? post.metaDate
                 : null;
    viewDate = viewDate || post.postedAt;

    let date = (viewDate > thresholdDate) ? viewDate : thresholdDate;

    const postLink = `<a href="${postGetPageUrl(post, true)}#comments">Discuss</a>`;
    const formattedTime = moment(post.postedAt).tz(moment.tz.guess()).format('LLL z');
    const feedItem: any = {
      title: post.title,
      description: `Published on ${formattedTime}<br/><br/>${(post.contents && post.contents.html) || ""}<br/><br/>${postLink}`,
      // LESSWRONG - changed how author is set for RSS because
      // LessWrong posts don't reliably have post.author defined.
      //author: post.author,
      author: await userGetDisplayNameById(post.userId),
      // LESSWRONG - this was added to handle karmaThresholds
      // date: post.postedAt
      date: date,
      guid: post._id,
      url: postGetPageUrl(post, true)
    };

    feed.item(feedItem);
  });

  return feed.xml();
};

const serveCommentRSS = async (terms: RSSTerms, req: any, res: any, url?: string) => {
  url = url || rssTermsToUrl(terms); // Default value is the custom rss feed computed from terms
  const feed = new RSS(getMeta(url));
  const context = await getContextFromReqAndRes(req, res);

  let parameters = viewTermsToQuery("Comments", terms);
  parameters.options.limit = 50;
  const commentsCursor = await Comments.find(parameters.selector, parameters.options).fetch();
  const restrictedComments = await accessFilterMultiple(null, Comments, commentsCursor, null) as DbComment[];

  await asyncForeachSequential(restrictedComments, async (comment) => {
    const url = await commentGetPageUrlFromDB(comment, context, true);
    const parentTitle = await getCommentParentTitle(comment)
    feed.item({
     title: 'Comment on ' + parentTitle,
     description: `${comment.contents && comment.contents.html}</br></br><a href='${url}'>Discuss</a>`,
     author: comment.author ?? undefined,
     date: comment.postedAt,
     url: url,
     guid: comment._id
    });
  });

  return feed.xml();
};


addStaticRoute('/feed.xml', async function(params, req, res, next) {
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
  if (typeof params.query.view === 'undefined') {
    params.query.view = 'rss';
  }
  if (params.query.filterSettings) {
    params.query.filterSettings = JSON.parse(params.query.filterSettings);
  }
  if (params.query.type && params.query.type === "comments") {
    res.end(await serveCommentRSS(params.query, req, res));
  } else {
    res.end(await servePostRSS(params.query));
  }
});
