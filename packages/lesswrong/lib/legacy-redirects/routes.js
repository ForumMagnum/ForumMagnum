import { Picker } from 'meteor/meteorhacks:picker';
import { Posts, Comments } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

//Route for redirecting LessWrong legacy posts
// addRoute({ name: 'lessWrongLegacy', path: 'lw/:id/:slug/:commentId', componentName: 'LegacyPostRedirect'});


// Route for old post links
Picker.route('/lw/:id/:slug', (params, req, res, next) => {
  if(params.id){

    try {
      const post = Posts.findOne({"legacyData.url": {$regex: "\/lw\/"+params.id+"\/.*"}});

      if (post) {
        res.writeHead(301, {'Location': Posts.getPageUrl(post)});
        res.end();
      } else {
        // don't redirect if we can't find a post for that link
        res.end(`No legacy post found with: ${params}`);
      }
    } catch (error) {
      console.log('// Legacy Post error')
      console.log(error)
      console.log(params)
    }
  } else {
    res.end("Please provide a URL");
  }
});

// Route for old comment links
Picker.route('/lw/:id/:slug/:commentId', (params, req, res, next) => {
  if(params.id){

    try {
      const post = Posts.findOne({"legacyData.url": {$regex: "\/lw\/"+params.id+"\/.*"}});
      const comment = Comments.findOne({"legacyId": parseInt(params.commentId, 36).toString()});
      if (post && comment) {
        res.writeHead(301, {'Location': Posts.getPageUrl(post)+"#"+comment._id});
        res.end();
      } else if (post) {
        res.writeHead(301, {'Location': Posts.getPageUrl(post)});
        res.end();
      } else {
        // don't redirect if we can't find a post for that link
        res.end(`No legacy post found with: ${params}`);
      }
    } catch (error) {
      console.log('// Legacy Post error')
      console.log(error)
      console.log(params)
    }
  } else {
    res.end("Please provide a URL");
  }
});

// Route for old user links
Picker.route('/user/:slug', (params, req, res, next) => {
  if(params.slug){
    try {
      const user = Users.findOne({$or: [{slug: params.slug}, {username: params.slug}]});
      if (user) {
        res.writeHead(301, {'Location': Users.getProfileUrl(user)});
        res.end();
      } else {
        // don't redirect if we can't find a post for that link
        res.end(`No legacy user found with: ${params.slug}`);
      }
    } catch (error) {
      console.log('// Legacy User error')
      console.log(error)
      console.log(params)
    }
  } else {
    res.end("Please provide a URL");
  }
});

// Route for old comment links

Picker.route('/posts/:_id/:slug/:commentId', (params, req, res, next) => {
  if(params.commentId){
    try {
      const comment = Comments.findOne({_id: params.commentId});
      if (comment) {
        res.writeHead(301, {'Location': Comments.getPageUrl(comment, true)});
        res.end();
      } else {
        // don't redirect if we can't find a post for that link
        res.end(`No comment found with: ${params.commentId}`);
      }
    } catch (error) {
      console.log('// Legacy Comment error')
      console.log(error)
      console.log(params)
    }
  } else {
    res.end("Please provide a URL");
  }
});
