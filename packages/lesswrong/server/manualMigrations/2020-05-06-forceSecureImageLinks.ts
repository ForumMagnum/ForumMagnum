/*
 * Turn insecure image links into secure ones if the secure image exists. We
 * only edit the html (not the original content), so it's possible someone will
 * edit their post and the update will be reverted.
 */

import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { urlIsBroken } from '../scripts/utils'
import { Posts } from '../../lib/collections/posts/collection';
import { postStatuses } from '../../lib/collections/posts/constants';
import cheerio from 'cheerio'

function findInsecureImages ($: any): Array<string> {
  let insecureImageSources: Array<string> = []
  $('img').each(function (this: any) {
    const el = $(this)
    const src = el.attr('src') as string
    const testResult = /^http:\/\//.test(src)
    if (testResult) {
      insecureImageSources.push(src)
    }
  })
  return insecureImageSources
}

// For an array of insecure image urls, test whether the secure version exists.
// If so for any image, return shouldUpdate: true, and a map of insecure to
// secure version
async function testSecureImages
  (insecureImageSources: Array<string>):
  Promise<{shouldUpdate: boolean, imageUpdates: Map<string, string>}>
{
  let shouldUpdate = false
  const imageUpdatesArr = (await Promise.all(
    insecureImageSources.map(async (src): Promise<[string, string | boolean]> => {
      const secureImageSource = src.replace(/^http:/, 'https:')
      if (!(await urlIsBroken(secureImageSource))) {
        shouldUpdate = true
        return [src, secureImageSource]
      }
      return [src, false]
    })
  // Filter out images that didn't have secure versions available
  )).filter(tuple => tuple[1])
  // The array was easy to make from the previous array's map function, but we
  // want a nice hashmap that will allow us to quickly check if the insecure
  // image exists in our updates
  const imageUpdates = new Map(imageUpdatesArr) as Map<string, string>
  return {shouldUpdate, imageUpdates}
}

// Mutate the cheerio `$` object with the given updates to the images
function updateHtmlWithSecureImages($: any, imageUpdates: Map<string, string>): void {
  // This is the second
  $('img').each(function (this: any) {
    const el = $(this)
    const src = el.attr('src') as string
    const update = imageUpdates.get(src)
    if (update) {
      el.attr('src', update)
      return
    }
  })
}

async function getFixedHTML (post: DbPost): Promise<{shouldUpdate: boolean, fixedHtml?: string}> {
  const html = post.contents?.html
  if (!html || !html.length) {
    return {shouldUpdate: false}
  }

  const $ = cheerio.load(html)
  const insecureImageSources = findInsecureImages($)
  if (!insecureImageSources.length) {
    return {shouldUpdate: false}
  }
  const {shouldUpdate, imageUpdates} = await testSecureImages(insecureImageSources)
  if (!shouldUpdate) {
    return {shouldUpdate}
  }

  updateHtmlWithSecureImages($, imageUpdates)
  return {shouldUpdate, fixedHtml: $.html()}
}

registerMigration({
  name: "forceSecureImageLinks",
  dateWritten: "2020-05-06",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 500,
      filter: {
        status: postStatuses.STATUS_APPROVED,
        draft: {$ne: true},
      },
      callback: async (posts: Array<DbPost>): Promise<void> => {
        let changes: Array<any> = [];
        for (const post of posts) {
          const {shouldUpdate, fixedHtml} = await getFixedHTML(post)
          if (shouldUpdate) {
            changes.push({
              updateOne: {
                filter: { _id: post._id },
                update: {
                  $set: { 'contents.html': fixedHtml }
                },
              },
            });
          }
        }
        if (changes.length > 0) {
          // eslint-disable-next-line no-console
          console.log(`Updating image links for ${changes.length} posts`); // eslint-disable-line
          await Posts.rawCollection().bulkWrite(changes, { ordered: false });
        }
      }
    });
    // eslint-disable-next-line no-console
    console.log("Finished updating image links"); // eslint-disable-line
  },
});
