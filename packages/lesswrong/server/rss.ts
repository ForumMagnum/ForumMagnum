import RSS from 'rss';
import { taglineSetting } from '../components/common/HeadTags';
import { Comments } from '../lib/collections/comments';
import { Posts } from '../lib/collections/posts';
import Users from '../lib/collections/users/collection';
import { forumTitleSetting, siteUrlSetting } from '../lib/instanceSettings';
import moment from '../lib/moment-timezone';
import { rssTermsToUrl } from '../lib/rss_urls';
import { addStaticRoute } from './vulcan-lib';
import { accessFilterMultiple } from '../lib/utils/schemaUtils';


Posts.addView('rss', Posts.views.new); // default to 'new' view for RSS feed
Comments.addView('rss', Comments.views.recentComments); // default to 'recentComments' view for comments RSS feed

export const getMeta = (url) => {
  const siteUrl = siteUrlSetting.get();

  return {
    title: forumTitleSetting.get(),
    description: taglineSetting.get(),
    feed_url: url,
    site_url: siteUrl,
    image_url: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_lncumn.ico"
  };
};

// LESSWRONG - this was added to handle karmaThresholds
const roundKarmaThreshold = threshold => (threshold < 16 || !threshold) ? 2
                                       : (threshold < 37) ? 30
                                       : (threshold < 60) ? 45
                                       : 75;

export const servePostRSS = async (terms, url?: string) => {
  // LESSWRONG - this was added to handle karmaThresholds
  let karmaThreshold = terms.karmaThreshold = roundKarmaThreshold(parseInt(terms.karmaThreshold, 10));
  url = url || rssTermsToUrl(terms); // Default value is the custom rss feed computed from terms
  const feed = new RSS(getMeta(url));
  let parameters = Posts.getParameters(terms);
  delete parameters['options']['sort']['sticky'];

  parameters.options.limit = 10;

  const postsCursor = Posts.find(parameters.selector, parameters.options).fetch();
  const restrictedPosts = await accessFilterMultiple(null, Posts, postsCursor, null);

  restrictedPosts.forEach((post) => {
    // LESSWRONG - this was added to handle karmaThresholds
    let thresholdDate = (karmaThreshold === 2)  ? post.scoreExceeded2Date
                      : (karmaThreshold === 30) ? post.scoreExceeded30Date
                      : (karmaThreshold === 45) ? post.scoreExceeded45Date
                      : (karmaThreshold === 75) ? post.scoreExceeded75Date
                      : null;
    thresholdDate = thresholdDate || post.postedAt;
    let viewDate = (terms.view === "frontpage-rss") ? post.frontpageDate
                 : (terms.view === "curated-rss")   ? post.curatedDate
                 : (terms.view === "meta-rss")      ? post.metaDate
                 : null;
    viewDate = viewDate || post.postedAt;

    let date = (viewDate > thresholdDate) ? viewDate : thresholdDate;

    const postLink = `<a href="${Posts.getPageUrl(post, true)}#comments">Discuss</a>`;
    const formattedTime = moment(post.postedAt).tz(moment.tz.guess()).format('LLL z');
    const feedItem: any = {
      title: post.title,
      description: `Published on ${formattedTime}<br/><br/>${(post.contents && post.contents.html) || ""}<br/><br/>${postLink}`,
      // LESSWRONG - changed how author is set for RSS because
      // LessWrong posts don't reliably have post.author defined.
      //author: post.author,
      author: Users.getDisplayNameById(post.userId),
      // LESSWRONG - this was added to handle karmaThresholds
      // date: post.postedAt
      date: date,
      guid: post._id,
      url: Posts.getPageUrl(post, true)
    };

    feed.item(feedItem);
  });

  return feed.xml();
};

export const serveCommentRSS = async (terms, url?: string) => {
  url = url || rssTermsToUrl(terms); // Default value is the custom rss feed computed from terms
  const feed = new RSS(getMeta(url));

  let parameters = Comments.getParameters(terms);
  parameters.options.limit = 50;
  const commentsCursor = Comments.find(parameters.selector, parameters.options).fetch();
  const restrictedComments = await accessFilterMultiple(null, Comments, commentsCursor, null);

  restrictedComments.forEach(function(comment) {
    const post = Posts.findOne(comment.postId);
    // eslint-disable-next-line no-console
    if (!post) console.warn(`Can't find post for comments in RSS feed: ${comment._id}`)
    feed.item({
     title: 'Comment on ' + post?.title,
     description: `${comment.contents && comment.contents.html}</br></br><a href='${Comments.getPageUrl(comment, true)}'>Discuss</a>`,
     author: comment.author,
     date: comment.postedAt,
     url: Comments.getPageUrl(comment, true),
     guid: comment._id
    });
  });

  return feed.xml();
};


addStaticRoute('/feed.xml', async function(params, req, res, next) {
  if (typeof params.query.view === 'undefined') {
    params.query.view = 'rss';
  }
  if (params.query.type && params.query.type === "comments") {
    res.end(await serveCommentRSS(params.query));
  } else {
    res.end(await servePostRSS(params.query));
  }
});
