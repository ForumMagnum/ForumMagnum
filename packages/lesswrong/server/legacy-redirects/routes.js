import { Picker } from 'meteor/meteorhacks:picker';
import { Posts, Comments } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

// All legacy URLs either do not contain /lw/, start with /lw/, or start with
//   /r/[section]/lw/, where section is one of {all,discussion,lesswrong}

function findPostByLegacyId(legacyId) {
  const parsedId = parseInt(legacyId, 36);
  return Posts.findOne({"legacyId": parsedId.toString()});
}

function findCommentByLegacyId(legacyId) {
  const parsedId = parseInt(legacyId, 36);
  return Comments.findOne({"legacyId": parsedId.toString()});
}

function makeRedirect(res, destination) {
  res.writeHead(301, {"Location": destination});
  res.end();
}


//Route for redirecting LessWrong legacy posts
// addRoute({ name: 'lessWrongLegacy', path: 'lw/:id/:slug/:commentId', componentName: 'LegacyPostRedirect'});


// Route for old post links
Picker.route('/:section?/:subreddit?/lw/:id/:slug?', (params, req, res, next) => {
  if(params.id){

    try {
      const post = findPostByLegacyId(params.id);
      if (post) {
        return makeRedirect(res, Posts.getPageUrl(post));
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
Picker.route('/:section?/:subreddit?/lw/:id/:slug/:commentId', (params, req, res, next) => {
  if(params.id){

    try {
      const post = findPostByLegacyId(params.id);
      const comment = findCommentByLegacyId(params.commentId);
      if (post && comment) {
        return makeRedirect(res, Comments.getPageUrl(comment));
      } else if (post) {
        return makeRedirect(res, Posts.getPageUrl(post));
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

// Route for old user links
Picker.route('/user/:slug/:category?/:filter?', (params, req, res, next) => {
  res.statusCode = 404
  if(params.slug){
    try {
      const user = Users.findOne({$or: [{slug: params.slug}, {username: params.slug}]});
      if (user) {
        return makeRedirect(res, Users.getProfileUrl(user));
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

Picker.route('/posts/:_id/:slug/:commentId', (params, req, res, next) => {
  if(params.commentId){
    try {
      const comment = Comments.findOne({_id: params.commentId});
      if (comment) {
        return makeRedirect(res, Comments.getPageUrl(comment));
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

Picker.route('/static/imported/:year/:month/:day/:imageName', (params, req, res, next) => {
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
Picker.route('/:section?/:subreddit?/lw/:id/:slug/:commentId/.rss', (params, req, res, next) => {
  if(params.id){
    try {
      const post = findPostByLegacyId(params.id);
      const comment = findCommentByLegacyId(params.commentId);
      if (post && comment) {
        return makeRedirect(res, Comments.getRSSUrl(comment));
      } else if (post) {
        return makeRedirect(res, Posts.getPageUrl(post));
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

// Route for old general RSS (all posts)
Picker.route('/.rss', (params, req, res, next) => {
  return makeRedirect(res, "/feed.xml");
});

// Route for old general RSS (all comments)
Picker.route('comments/.rss', (params, req, res, next) => {
  return makeRedirect(res, '/feed.xml?type=comments');
});

Picker.route('/rss/comments.xml', (params, req, res, next) => {
  return makeRedirect(res, '/feed.xml?type=comments');
});

// Route for old general RSS (all posts)
Picker.route('/:section?/:subreddit?/:new?/.rss', (params, req, res, next) => {
  return makeRedirect(res, '/feed.xml');
});

// Route for old promoted RSS (promoted posts)
Picker.route('/promoted/.rss', (params, req, res, next) => {
  return makeRedirect(res, '/feed.xml?view=curated-rss');
});
