import { addStaticRoute } from '../vulcan-lib/staticRoutes';
import { Posts } from '../../server/collections/posts/collection';
import type { ServerResponse } from 'http';

const redirect = (res: ServerResponse, url: string, post: DbPost | null) => {
  if (post) {
    void Posts.rawUpdateOne({_id: post._id}, { $inc: { clickCount: 1 } });
    res.writeHead(301, {'Location': url});
    res.end();
  } else {
    // Don't redirect if we can't find a post for that link
    res.end(`Invalid URL: ${url}`);
  }
}

// Click-tracking redirector for outgoing links in linkposts
addStaticRoute('/out', async ({ query }, _req, res, _next) => {
  const {url} = query;
  if (url) {
    try {
      const post = await Posts.findOne({url}, {sort: {postedAt: -1, createdAt: -1}});
      redirect(res, url, post);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('// /out error');
      // eslint-disable-next-line no-console
      console.error(error);
      // eslint-disable-next-line no-console
      console.error(query);
      res.end(error.message);
    }
  } else {
    res.end("Please provide a URL");
  }
});
