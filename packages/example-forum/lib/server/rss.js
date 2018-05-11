import RSS from 'rss';
import { Posts } from '../modules/posts/index.js';
import { rssTermsToUrl } from '../modules/rss_urls.js';
import { Comments } from '../modules/comments/index.js';
import { Utils, getSetting, registerSetting } from 'meteor/vulcan:core';
import { Picker } from 'meteor/meteorhacks:picker';

// LESSWRONG - this import wasn't needed until fixing author below.
import Users from 'meteor/vulcan:users';

registerSetting('forum.RSSLinksPointTo', 'link', 'Where to point RSS links to');

Posts.addView('rss', Posts.views.new); // default to 'new' view for RSS feed
Comments.addView('rss', Comments.views.recentComments); // default to 'recentComments' view for comments RSS feed

const getMeta = (url) => {
  const siteUrl = getSetting('siteUrl', Meteor.absoluteUrl());

  return {
    title: getSetting('title'),
    description: getSetting('tagline'),
    feed_url: siteUrl+url,
    site_url: siteUrl,
    image_url: siteUrl+'img/favicon.png'
  };
};

export const servePostRSS = (terms, url) => {
  url = url || rssTermsToUrl(terms); // Default value is the custom rss feed computed from terms
  const feed = new RSS(getMeta(url));
  let parameters = Posts.getParameters(terms);
  delete parameters['options']['sort']['sticky'];

  parameters.options.limit = 50;

  const postsCursor = Posts.find(parameters.selector, parameters.options);

  postsCursor.forEach((post) => {
    const postLink = `<a href="${Posts.getPageUrl(post, true)}">Discuss</a>`;
    const feedItem = {
      title: post.title,
      description: `${post.htmlBody || ""}<br/><br/>${postLink}`,
      // LESSWRONG - changed how author is set for RSS because
      // LessWrong posts don't reliably have post.author defined.
      //author: post.author,
      author: `${Users.getUserNameById(post.userId)}`,
      date: post.postedAt,
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
  const commentsCursor = Comments.find(parameters.selector, parameters.options);

  commentsCursor.forEach(function(comment) {
    const post = Posts.findOne(comment.postId);

    feed.item({
     title: 'Comment on ' + post.title,
     description: `${comment.body}</br></br><a href='${Comments.getPageUrl(comment, true)}'>Discuss</a>`,
     author: comment.author,
     date: comment.postedAt,
     url: Comments.getPageUrl(comment, true),
     guid: comment._id
    });
  });

  return feed.xml();
};


Picker.route('/feed.xml', function(params, req, res, next) {
  if (typeof params.query.view === 'undefined') {
    params.query.view = 'rss';
  }
  if (params.query.type && params.query.type === "comments") {
    res.end(serveCommentRSS(params.query));
  } else {
    res.end(servePostRSS(params.query));
  }
});
