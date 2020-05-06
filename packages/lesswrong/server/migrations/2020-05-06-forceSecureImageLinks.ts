import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Posts from '../../lib/collections/posts/collection';
import cheerio from 'cheerio'

function getFixedHTML (html: string): string {
  console.log(html)
  const $ = cheerio.load(html)
  $('img').each(function () {
    const el = $(this)
    const src = el.attr('src')
    if (/^http:\/\//) {
      el.attr('src', src.replace(/^http:/, 'https:'))
    }
  })
  return $.html()
}

registerMigration({
  name: "forceSecureImageLinks",
  dateWritten: "2020-05-06",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Posts,
      callback: async (posts) => {
        let changes: Array<any> = [];
        for (const post of posts) {
          console.log(post)
          const fixedHTML = getFixedHTML(post.html)
          if (post.html !== fixedHTML) {
            console.log(post._id, post.title)
          }
            // changes.push({
            //   updateOne: {
            //     filter: { _id: post._id },
            //     update: {
            //       $set: { html: fixInsecureImageLinks(post) }
            //     },
            //   },
            // });
          }
        }
        // if (changes.length > 0) {
        //   console.log(`Updating image links for ${changes.length} posts`); // eslint-disable-line
        //   await Posts.rawCollection().bulkWrite(changes, { ordered: false });
        // }
      }
    });
    console.log("Finished updating legacy user join dates"); // eslint-disable-line
  },
});
