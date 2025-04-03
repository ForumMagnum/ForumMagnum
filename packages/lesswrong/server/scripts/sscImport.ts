import feedparser from 'feedparser-promised';
import Users from '../../server/collections/users/collection';
import { Posts } from '../../server/collections/posts/collection';
import { updateMutator } from '../vulcan-lib/mutators';
import RSSFeeds from '../../server/collections/rssfeeds/collection';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import * as _ from 'underscore';
import { createRSSFeed } from '../collections/rssfeeds/mutations';
import { createAnonymousContext } from '../vulcan-lib/createContexts';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { createPost } from '../collections/posts/mutations';

async function rssImport(userId: string, rssURL: string, pages = 100, overwrite = false, feedName = "", feedLink = "") {
  try {
    let rssPageImports: Array<any> = [];
    let maybeRSSFeed = await RSSFeeds.findOne({nickname: feedName});
    if (!maybeRSSFeed) {
      maybeRSSFeed = await createRSSFeed({ data: {userId, ownedByUser: true, displayFullContent: true, nickname: feedName, url: feedLink} }, createAnonymousContext());
    }
    if (!maybeRSSFeed) throw Error("Failed to create new rssFeed for rssImport")
    const rssFeed = maybeRSSFeed
    //eslint-disable-next-line no-console
    console.log(rssFeed);
    for (let i of _.range(1,pages)) {
      const newPosts = await feedparser.parse(rssURL+i)
      //eslint-disable-next-line no-console
      console.log("Importing RSS posts page " + i);
      rssPageImports.push(i);
      //eslint-disable-next-line no-console
      console.log("RSS Pages Imported So far: ", rssPageImports.sort());
      await asyncForeachSequential(newPosts, async function (newPost: any) {
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
          contents: {
            originalContents: {
              data: body,
              type: "html"
            }
          },
        };

        const lwUser = await Users.findOne({_id: userId});
        const oldPost = await Posts.findOne({title: post.title, userId: userId});

        const userContext = await computeContextFromUser({ user: lwUser, isSSR: false });

        if (!oldPost){
          void createPost({ data: post }, userContext, true);
        } else {
          if(overwrite) {
            void updateMutator({
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
  void rssImport(zviId, zviRSS, 10, true);
}

let katjaRSS = "https://meteuphoric.wordpress.com/feed/?paged="
let katjaId = "jRRYAy2mQAHy2Mq3f"
let katjaImport = false;

if (katjaImport) {
  void rssImport(katjaId, katjaRSS, 40, true);
}

let putanumonitRSS = "https://putanumonit.com/feed/?paged=";
let putanumonitId = "tzER8b2F9ofG5wq5p";
let putanumonitImport = false;

if (putanumonitImport) {
  void rssImport(putanumonitId, putanumonitRSS, 4, false, "putanumonit", "https://putanumonit.com/feed/");
}
