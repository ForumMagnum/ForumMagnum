import { addCronJob } from '../cronUtil';
import RSSFeeds from '../../lib/collections/rssfeeds/collection';
import { newMutation, editMutation } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import Users from '../../lib/collections/users/collection';

addCronJob({
  name: 'addNewRSSPosts',
  schedule(parser) {
    return parser.text('every 10 minutes');
  },
  job() {
    const feedparser = require('feedparser-promised');

    RSSFeeds.find({status: {$ne: 'inactive'}}).fetch().forEach(feed => {
      // create array of all posts in current rawFeed object
      let previousPosts = feed.rawFeed || [];

      // check the feed for new posts
      const url = feed.url;
      feedparser.parse(url).then( currentPosts => {
        let newPosts = currentPosts.filter(function (post) {
          return !previousPosts.some(prevPost => {
            return post.guid === prevPost.guid
          })
        })

        // update feed object with new feed data (mutation)
        var set: any = {};
        set.rawFeed = currentPosts;

        editMutation({
          collection: RSSFeeds,
          documentId: feed._id,
          set: set,
          validate: false,
        })

        newPosts.forEach(function (newPost) {
          var body;

          if (newPost['content:encoded'] && newPost.displayFullContent) {
            body = newPost['content:encoded'];
          } else if (newPost.description) {
            body = newPost.description;
          } else if (newPost.summary) {
            body = newPost.summary;
          } else {
            body = "";
          }

          var post = {
            title: newPost.title,
            userId: feed.userId,
            canonicalSource: feed.setCanonicalUrl ? newPost.link : undefined,
            contents: {
              originalContents: {
                type: "html",
                data: body
              }
            },
            feedId: feed._id,
            feedLink: newPost.link
          };

          let lwUser = Users.findOne({_id: feed.userId});

          newMutation({
            collection: Posts,
            document: post,
            currentUser: lwUser,
            validate: false,
          })
        })

      }).catch( (error) => {
        // console.log(feed);
        //eslint-disable-next-line no-console
        console.error('RSS error: ', error);
      });
    })
  }
});
