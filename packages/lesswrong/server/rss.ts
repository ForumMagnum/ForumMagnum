import RSS from 'rss';
import { Comments } from '../server/collections/comments/collection';
import { commentGetPageUrlFromDB } from '../lib/collections/comments/helpers';
import { Posts } from '../server/collections/posts/collection';
import { postGetPageUrl } from '../lib/collections/posts/helpers';
import { userGetDisplayNameById } from '../lib/vulcan-users/helpers';
import { forumTitleSetting, siteUrlSetting, taglineSetting } from '../lib/instanceSettings';
import moment from '../lib/moment-timezone';
import { rssTermsToUrl, RSSTerms } from '../lib/rss_urls';
import { accessFilterMultiple } from '../lib/utils/schemaUtils';
import { getCommentParentTitle } from '../lib/notificationTypes';
import { asyncForeachSequential } from '../lib/utils/asyncUtils';
import { getContextFromReqAndRes } from './vulcan-lib/apollo-server/context';
import { viewTermsToQuery } from '../lib/utils/viewUtils';
import { fetchFragment } from './fetchFragment';
import { addStaticRoute } from "./vulcan-lib/staticRoutes";
import { createAnonymousContext } from "./vulcan-lib/createContexts";
import { PostsViews } from '@/lib/collections/posts/views';
import { CommentsViews } from '@/lib/collections/comments/views';

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
  const parameters = viewTermsToQuery(PostsViews, terms, undefined, context);
  delete parameters['options']['sort']['sticky'];

  parameters.options.limit = 10;

  const postsCursor = await fetchFragment({
    collectionName: "Posts",
    fragmentDoc: "PostsRSSFeed",
    currentUser: null,
    selector: parameters.selector,
    options: parameters.options,
  });

  await asyncForeachSequential(postsCursor, async (post) => {
    // LESSWRONG - this was added to handle karmaThresholds
    let thresholdDate = (karmaThreshold === 2)  ? post.scoreExceeded2Date
                      : (karmaThreshold === 30) ? post.scoreExceeded30Date
                      : (karmaThreshold === 45) ? post.scoreExceeded45Date
                      : (karmaThreshold === 75) ? post.scoreExceeded75Date
                      : (karmaThreshold === 125) ? post.scoreExceeded125Date
                      : (karmaThreshold === 200) ? post.scoreExceeded200Date
                      : null;
    thresholdDate = thresholdDate || post.postedAt;
    let viewDate = (terms.view === "frontpageRss") ? post.frontpageDate
                 : (terms.view === "curatedRss")   ? post.curatedDate
                 : (terms.view === "metaRss")      ? post.metaDate
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
      author: await userGetDisplayNameById(post.userId, context),
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
  const context = await getContextFromReqAndRes({req, res, isSSR: false});

  let parameters = viewTermsToQuery(CommentsViews, terms);
  parameters.options.limit = 50;
  const commentsCursor = await Comments.find(parameters.selector, parameters.options).fetch();
  const restrictedComments = await accessFilterMultiple(null, 'Comments', commentsCursor, context) as DbComment[];

  await asyncForeachSequential(restrictedComments, async (comment) => {
    const url = await commentGetPageUrlFromDB(comment, context, true);
    const parentTitle = await getCommentParentTitle(comment, context)
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


addStaticRoute('/feed.xml', async function(params, req, res, _next) {
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
