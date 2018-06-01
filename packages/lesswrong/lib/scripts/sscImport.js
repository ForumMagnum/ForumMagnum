import feedparser from 'feedparser-promised';
import Users from 'meteor/vulcan:users';
import { Posts } from 'meteor/example-forum';
import { newMutation, editMutation } from 'meteor/vulcan:core';
import RSSFeeds from '../collections/rssfeeds/collection.js';

async function rssImport(userId, rssURL, pages = 100, overwrite = false, feedName = "", feedLink = "") {
  try {
    let rssPageImports = [];
    let rssFeed = RSSFeeds.findOne({nickname: feedName});
    if (!rssFeed) {
      rssFeed = newMutation({
        collection: RSSFeeds,
        document: {userId, ownedByUser: true, displayFullContent: true, nickname: feedName, url: feedLink}
      })
    }
    //eslint-disable-next-line no-console
    console.log(rssFeed);
    for (let i of _.range(1,pages)) {
      const newPosts = await feedparser.parse(rssURL+i)
      //eslint-disable-next-line no-console
      console.log("Importing RSS posts page " + i);
      rssPageImports.push(i);
      //eslint-disable-next-line no-console
      console.log("RSS Pages Imported So far: ", rssPageImports.sort());
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
          postedAt: newPost.pubdate,
          feedId: rssFeed._id,
          feedLink: newPost.link,
          draft: false,
          legacy: true,
          userId: userId,
          htmlBody: body,
        };

        const lwUser = Users.findOne({_id: userId});
        const oldPost = Posts.findOne({title: post.title, userId: userId});

        if (!oldPost){
          newMutation({
            collection: Posts,
            document: post,
            currentUser: lwUser,
            validate: false,
          })
        } else {
          if(overwrite) {
            editMutation({
              collection: Posts,
              documentId: oldPost._id,
              set: {...post},
              unset: {},
              currentUser: lwUser,
              validate: false,
            })
          }
          //eslint-disable-next-line no-console
          console.warn("Post already imported: ", oldPost.title);
        }
      })
    }
  } catch (e) {
    //eslint-disable-next-line no-console
    console.error(e)
  }
}

let zviRSS = "https://thezvi.wordpress.com/feed/?paged="
let zviId = "N9zj5qpTfqmbn9dro"
let zviImport = false;

if (zviImport) {
  rssImport(zviId, zviRSS, 10, true);
}

let katjaRSS = "https://meteuphoric.wordpress.com/feed/?paged="
let katjaId = "jRRYAy2mQAHy2Mq3f"
let katjaImport = false;

if (katjaImport) {
  rssImport(katjaId, katjaRSS, 40, true);
}

let putanumonitRSS = "https://putanumonit.com/feed/?paged=";
let putanumonitId = "tzER8b2F9ofG5wq5p";
let putanumonitImport = false;

if (putanumonitImport) {
  rssImport(putanumonitId, putanumonitRSS, 4, false, "putanumonit", "https://putanumonit.com/feed/");
}
