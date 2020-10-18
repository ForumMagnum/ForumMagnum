import { runCallbacksAsync, addStaticRoute } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { ensureIndex } from '../../lib/collectionUtils';

// Click-tracking redirector for outgoing links in linkposts
addStaticRoute('/out', ({ query}, req, res, next) => {
  if(query.url) {
    try {
      const post = Posts.findOne({url: query.url}, {sort: {postedAt: -1, createdAt: -1}});

      if (post) {
        const ip = (req.headers && req.headers['x-forwarded-for']) || req.connection.remoteAddress;

        runCallbacksAsync('posts.click.async', post, ip);

        res.writeHead(301, {'Location': query.url});
        res.end();
      } else {
        // don't redirect if we can't find a post for that link
        res.end(`Invalid URL: ${query.url}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('// /out error');
      // eslint-disable-next-line no-console
      console.log(error);
      // eslint-disable-next-line no-console
      console.log(query);
    }
  } else {
    res.end("Please provide a URL");
  }
});

ensureIndex(Posts, {url:1, postedAt:-1});
