import { Comments } from '../../server/collections/comments/collection';
import { commentGetPageUrlFromDB, commentGetRSSUrl } from '../../lib/collections/comments/helpers';
import { Posts } from '../../server/collections/posts/collection';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import Users from '../../server/collections/users/collection';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { faviconUrlSetting, isAF } from '../../lib/instanceSettings';
import { legacyRouteAcronymSetting } from '@/lib/instanceSettings';
import { addStaticRoute } from '../vulcan-lib/staticRoutes';
import { createAnonymousContext } from '../vulcan-lib/createContexts';
import type { ServerResponse } from 'http';

// Some legacy routes have an optional subreddit prefix, which is either
// omitted, is /r/all, /r/discussion, or /r/lesswrong. The is followed by
// /lw/postid possibly followed by a slug, comment ID, filter settings, or other
// things, some of which is supported and some of which isn't.
//
// If a route has this optional prefix, use `subredditPrefixRoute` to represent
// that part. It contains two optional parameters, constrained to be `r` and
// a subreddit name, respectively (the subreddits being lesswrong, discussion,
// and all). Since old-LW made all post IDs non-overlapping, we just ignore
// which subreddit was specified.
//
// (In old LW, the set of possible subreddits may also have included user
// account names, for things in users' draft folders. We don't support getting
// old drafts via legacy routes; I'm not sure whether we support getting them
// through other UI).
const subredditPrefixRoute = "/:section(r)?/:subreddit(all|discussion|lesswrong)?";

async function findPostByLegacyId(legacyId: string) {
  const parsedId = parseInt(legacyId, 36);
  return await Posts.findOne({"legacyId": parsedId.toString()});
}

async function findCommentByLegacyId(legacyId: string) {
  const parsedId = parseInt(legacyId, 36);
  return await Comments.findOne({"legacyId": parsedId.toString()});
}

function makeRedirect(res: ServerResponse, destination: string) {
  res.writeHead(301, {"Location": destination});
  res.end();
}

async function findPostByLegacyAFId(legacyId: number) {
  return await Posts.findOne({"agentFoundationsId": legacyId.toString()})
}

async function findCommentByLegacyAFId(legacyId: number) {
  return await Comments.findOne({"agentFoundationsId": legacyId.toString()})
}


//Route for redirecting LessWrong legacy posts
// addRoute({ name: 'lessWrongLegacy', path: 'lw/:id/:slug/:commentId', componentName: 'LegacyPostRedirect'});

// Route for old post links
// Disabled because this is now properly in the routes table, as Components.LegacyPostRedirect.
/*addStaticRoute(subredditPrefixRoute+`/${legacyRouteAcronym}/:id/:slug?`, async (params, req, res, next) => {
  if(params.id){

    try {
      const post = await findPostByLegacyId(params.id);
      if (post) {
        return makeRedirect(res, postGetPageUrl(post));
      } else {
        // don't redirect if we can't find a post for that link
        //eslint-disable-next-line no-console
        console.log('// Missing legacy post', params);
        res.statusCode = 404
        res.end(`No legacy post found with: id=${params.id} slug=${params.slug}`);
      }
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('// Legacy Post error', error, params)
      res.statusCode = 404
      res.end(`No legacy post found with: id=${params.id} slug=${params.slug}`);
    }
  } else {
    res.statusCode = 404
    res.end("Please provide a URL");
  }
});

// Route for old comment links
addStaticRoute(subredditPrefixRoute+`/${legacyRouteAcronym}/:id/:slug/:commentId`, async (params, req, res, next) => {
  if(params.id){

    try {
      const post = await findPostByLegacyId(params.id);
      const comment = await findCommentByLegacyId(params.commentId);
      if (post && comment) {
        return makeRedirect(res, await commentGetPageUrlFromDB(comment));
      } else if (post) {
        return makeRedirect(res, postGetPageUrl(post));
      } else {
        // don't redirect if we can't find a post for that link
        res.statusCode = 404
        res.end(`No legacy post found with: id=${params.id} slug=${params.slug}`);
      }
    } catch (error) {
      //eslint-disable-next-line no-console
      console.log('// Legacy comment error', error, params)
      res.statusCode = 404
      res.end(`No legacy post found with: id=${params.id} slug=${params.slug}`);
    }
  } else {
    res.statusCode = 404
    res.end(`No legacy post found with: id=${params.id} slug=${params.slug}`);
  }
});*/

// Route for old user links
addStaticRoute('/user/:slug/:category?/:filter?', async (params, req, res, next) => {
  res.statusCode = 404
  if(params.slug){
    try {
      const user = await Users.findOne({$or: [{slug: params.slug}, {username: params.slug}]});
      if (user) {
        return makeRedirect(res, userGetProfileUrl(user));
      } else {
        //eslint-disable-next-line no-console
        console.log('// Missing legacy user', params);
        res.statusCode = 404
        res.end(`No legacy user found with: ${params.slug}`);
      }
    } catch (error) {
      //eslint-disable-next-line no-console
      console.log('// Legacy User error', error, params);
      res.statusCode = 404
      res.end(`No legacy user found with: ${params.slug}`);
    }
  } else {
    res.statusCode = 404
    res.end(`No legacy user found with: ${params.slug}`);
  }
});

// Route for old comment links

addStaticRoute('/posts/:_id/:slug/:commentId', async (params, req, res, next) => {
  const context = await createAnonymousContext();
  
  if(params.commentId){
    try {
      const comment = await Comments.findOne({_id: params.commentId});
      if (comment) {
        return makeRedirect(res, await commentGetPageUrlFromDB(comment, context, false));
      } else {
        // don't redirect if we can't find a post for that link
        //eslint-disable-next-line no-console
        console.log('// Missing legacy comment', params);
        res.statusCode = 404
        res.end(`No comment found with: ${params.commentId}`);
      }
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('// Legacy Comment error', error, params)
      res.statusCode = 404
      res.end(`No comment found with: ${params.commentId}`);
    }
  } else {
    res.statusCode = 404
    res.end("Please provide a URL");
  }
});

// Route for old images

addStaticRoute('/static/imported/:year/:month/:day/:imageName', (params, req, res, next) => {
  if(params.imageName){
    try {
      return makeRedirect(res,
        `https://raw.githubusercontent.com/tricycle/lesswrong/master/r2/r2/public/static/imported/${params.year}/${params.month}/${params.day}/${params.imageName}`);
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('// Legacy Comment error', error, params)
      res.statusCode = 404;
      res.end("Invalid image url")
    }
  } else {
    res.statusCode = 404;
    res.end("Please provide a URL")
  }
});


// Legacy RSS Routes

// Route for old comment rss feeds
export function addLegacyRssRoutes() {
  // Because the EA Forum was identical except for the change from /lw/ to /ea/
  const legacyRouteAcronym = legacyRouteAcronymSetting.get()

  addStaticRoute(subredditPrefixRoute+`/${legacyRouteAcronym}/:id/:slug/:commentId/.rss`, async (params, req, res, next) => {
    if(params.id){
      try {
        const post = await findPostByLegacyId(params.id);
        const comment = await findCommentByLegacyId(params.commentId);
        if (post && comment) {
          return makeRedirect(res, commentGetRSSUrl(comment));
        } else if (post) {
          return makeRedirect(res, postGetPageUrl(post));
        } else {
          // don't redirect if we can't find a post for that link
          res.statusCode = 404
          res.end(`No legacy post found with: id=${params.id} slug=${params.slug}`);
        }
      } catch (error) {
        //eslint-disable-next-line no-console
        console.log('// Legacy comment error', error, params)
        res.statusCode = 404
        res.end(`No legacy post found with: id=${params.id} slug=${params.slug}`);
      }
    } else {
      res.statusCode = 404
      res.end(`No legacy post found with: id=${params.id} slug=${params.slug}`);
    }
  });
}

// Route for old general RSS (all posts)
addStaticRoute('/.rss', (params, req, res, next) => {
  return makeRedirect(res, "/feed.xml");
});

// Route for old general RSS (all comments)
addStaticRoute('comments/.rss', (params, req, res, next) => {
  return makeRedirect(res, '/feed.xml?type=comments');
});

addStaticRoute('/rss/comments.xml', (params, req, res, next) => {
  return makeRedirect(res, '/feed.xml?type=comments');
});

addStaticRoute('/daily', (params, req, res, next) => {
  return makeRedirect(res, '/allPosts');
});

// Route for old general RSS (all posts)
addStaticRoute('/:section?/:subreddit?/:new?/.rss', (params, req, res, next) => {
  return makeRedirect(res, '/feed.xml');
});

addStaticRoute('/promoted', (params, req, res, next) => {
  return makeRedirect(res, '/allPosts?filter=curated&sortedBy=new&timeframe=allTime');
});

// Route for old promoted RSS (promoted posts)
addStaticRoute('/promoted/.rss', (params, req, res, next) => {
  return makeRedirect(res, '/feed.xml?view=curatedRss');
});


// Route for old agent-foundations post and commentlinks
addStaticRoute('/item', async (params, req, res, next) => {
  const context = await createAnonymousContext();
  
  if(params.query.id){
    const id = parseInt(params.query.id)
    try {
      const post = await findPostByLegacyAFId(id);

      if (post) {
        return makeRedirect(res, postGetPageUrl(post));
      } else {
        const comment = await findCommentByLegacyAFId(id);
        if (comment) {
          return makeRedirect(res, await commentGetPageUrlFromDB(comment, context, false))
        } else {
          // don't redirect if we can't find a post for that link
          //eslint-disable-next-line no-console
          console.log('// Missing legacy af item', params);
          res.statusCode = 404
          res.end(`No af legacy item found with: id=${params.query.id}`);
        }

      }
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('// Legacy item error', error, params)
      res.statusCode = 404
      res.end(`No legacy item found with: params=${params}`);
    }
  } else {
    res.statusCode = 404
    res.end("Please provide a URL");
  }
});

// Secondary way of specifying favicon for browser or RSS readers that don't
// support using a meta tag (the preferred approach).
addStaticRoute('/favicon.ico', (params, req, res, next) => {
  return makeRedirect(res, faviconUrlSetting.get());
});

addStaticRoute('/featured', (params, req, res, next) => {
  return makeRedirect(res, '/allPosts?filter=curated&view=new&timeframe=allTime')
})

addStaticRoute('/recentComments', (params, req, res, next) => {
  return makeRedirect(res, '/allComments');
})

if (isAF) {
  addStaticRoute('/newcomments', (params, req, res, next) => {
    return makeRedirect(res, '/allComments');
  })
  
  addStaticRoute('/how-to-contribute', (params, req, res, next) => {
    return makeRedirect(res, '/posts/FoiiRDC3EhjHx7ayY/introducing-the-ai-alignment-forum-faq');
  })
  
  addStaticRoute('/submitted', (params, req, res, next) => {
    return makeRedirect(res, `/users/${params.query?.id}`);
  })
  
  addStaticRoute('/threads', (params, req, res, next) => {
    return makeRedirect(res, `/users/${params.query?.id}`);
  })
  
  addStaticRoute('/user', (params, req, res, next) => {
    return makeRedirect(res, `/users/${params.query?.id}`);
  })
  
  addStaticRoute('/submit', (params, req, res, next) => {
    return makeRedirect(res, `/newPost`);
  })
  
  addStaticRoute('/rss', (params, req, res, next) => {
    return makeRedirect(res, `/feed.xml`);
  })
  
  addStaticRoute('/saved', (params, req, res, next) => {
    return makeRedirect(res, `/account`);
  })
}

