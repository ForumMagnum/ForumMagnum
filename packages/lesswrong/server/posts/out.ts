import { addStaticRoute } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { ensureIndex } from '../../lib/collectionIndexUtils';
import { createClient } from '../vulcan-lib/apollo-ssr/apolloClient';
import { getGraphQLQueryFromOptions } from '../../lib/crud/withSingle';
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
  const {url, foreignId} = query;
  if (url) {
    try {
      if (foreignId) {
        const client = await createClient(null, true);
        const result = await client.query({
          query: getGraphQLQueryFromOptions({
            collection: Posts,
            fragmentName: "PostsBase",
            fragment: undefined,
            extraVariables: undefined,
          }),
          variables: {
            input: {
              selector: {
                documentId: foreignId,
              },
            },
          },
        });
        const foundUrl = result?.data?.post?.result?.url;
        if (foundUrl === url) {
          const post = await Posts.findOne(
            {"fmCrosspost.foreignPostId": foreignId},
            {sort: {postedAt: -1, createdAt: -1}},
          );
          redirect(res, url, post);
        } else {
          redirect(res, url, null);
        }
      } else {
        const post = await Posts.findOne({url}, {sort: {postedAt: -1, createdAt: -1}});
        redirect(res, url, post);
      }
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

ensureIndex(Posts, {url:1, postedAt:-1});
ensureIndex(Posts, {"fmCrosspost.foreignPostId":1, postedAt:-1});
