import RSS from 'rss';
import { Posts } from '../lib/collections/posts';
import { rssTermsToUrl } from '../lib/modules/rss_urls.js';
import { Comments } from '../lib/collections/comments';
import { Utils, getSetting } from 'meteor/vulcan:core';
import { addStaticRoute } from 'meteor/vulcan:lib';
import { accessFilterMultiple } from '../lib/modules/utils/schemaUtils.js';
import moment from 'moment-timezone';

// LESSWRONG - this import wasn't needed until fixing author below.
import Users from 'meteor/vulcan:users';

Posts.addView('rss', Posts.views.new); // default to 'new' view for RSS feed
Comments.addView('rss', Comments.views.recentComments); // default to 'recentComments' view for comments RSS feed

export const getMeta = (url) => {
  const siteUrl = getSetting('siteUrl', Meteor.absoluteUrl());

  return {
    title: getSetting('title'),
    description: getSetting('tagline'),
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

export const servePostRSS = (terms, url) => {
  // LESSWRONG - this was added to handle karmaThresholds
  let karmaThreshold = terms.karmaThreshold = roundKarmaThreshold(parseInt(terms.karmaThreshold, 10));
  url = url || rssTermsToUrl(terms); // Default value is the custom rss feed computed from terms
  const feed = new RSS(getMeta(url));
  let parameters = Posts.getParameters(terms);
  delete parameters['options']['sort']['sticky'];

  parameters.options.limit = 10;

  const postsCursor = Posts.find(parameters.selector, parameters.options).fetch();
  const restrictedPosts = accessFilterMultiple(null, Posts, postsCursor);

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
    const feedItem = {
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

    if (post.thumbnailUrl) {
      const url = Utils.addHttp(post.thumbnailUrl);
      feedItem.custom_elements = [{'imageUrl':url}, {'content': url}];
    }

    feed.item(feedItem);
  });

  return feed.xml();
};

export const serveCommentRSS = (terms, url) => {
  url = url || rssTermsToUrl(terms); // Default value is the custom rss feed computed from terms
  const feed = new RSS(getMeta(url));

  let parameters = Comments.getParameters(terms);
  parameters.options.limit = 50;
  const commentsCursor = Comments.find(parameters.selector, parameters.options).fetch();
  const restrictedComments = accessFilterMultiple(null, Comments, commentsCursor);

  restrictedComments.forEach(function(comment) {
    const post = Posts.findOne(comment.postId);

    feed.item({
     title: 'Comment on ' + post.title,
     description: `${comment.contents && comment.contents.html}</br></br><a href='${Comments.getPageUrl(comment, true)}'>Discuss</a>`,
     author: comment.author,
     date: comment.postedAt,
     url: Comments.getPageUrl(comment, true),
     guid: comment._id
    });
  });

  return feed.xml();
};


addStaticRoute('/feed.xml', function(params, req, res, next) {
  if (typeof params.query.view === 'undefined') {
    params.query.view = 'rss';
  }
  if (params.query.type && params.query.type === "comments") {
    res.end(serveCommentRSS(params.query));
  } else {
    res.end(servePostRSS(params.query));
  }
});
