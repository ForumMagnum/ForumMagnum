/*
 * Turn insecure image links into secure ones if the secure image exists. We
 * only edit the html (not the original content), so it's possible someone will
 * edit their post and the update will be reverted.
 */

import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { urlIsBroken } from '../scripts/utils'
import { Posts } from '../../lib/collections/posts/collection';
import { PostsBase } from '../../lib/generated/fragmentTypes'
import cheerio from 'cheerio'

function findInsecureImages ($: any): Array<string> {
  let insecureImageSources: Array<string> = []
  $('img').each(function () {
    // TODO;
    // tslint:disable-next-line
    const el = $(this)
    const src = el.attr('src') as string
    // TODO; duplicate for each image?
    const testResult = /^http:\/\//.test(src)
    // console.log('testResult', testResult)
    if (testResult) {
      // console.log('found insecure image:', src)
      insecureImageSources.push(src)
    }
  })
  return insecureImageSources
}

async function testSecureImages
  (insecureImageSources: Array<string>, post: PostsBase):
  Promise<{shouldUpdate: boolean, imageUpdates: Map<string, string>}>
{
  let shouldUpdate = false
  const imageUpdates = new Map((await Promise.all(
    insecureImageSources.map(async (src): Promise<[string, string | boolean]> => {
      const secureImageSource = src.replace(/^http:/, 'https:')
      // console.log('Testing image:', secureImageSource)
      if (!(await urlIsBroken(secureImageSource))) {
        // console.log('found 1', src)
        shouldUpdate = true
        return [src, secureImageSource]
      }
      // console.log(
      //   `No secure version of image found for post ${post._id}/${post.slug}, image: ${src}}`
      // )
      return [src, false]
    })
  )).filter(tuple => tuple[1])) as Map<string, string>
  return {shouldUpdate, imageUpdates}
}

function updateHtmlWithSecureImages($: any, imageUpdates: Map<string, string>): void {
  $('img').each(function () {
    // TODO;
    // tslint:disable-next-line
    const el = $(this)
    const src = el.attr('src') as string
    const update = imageUpdates.get(src)
    // console.log('update', update)
    if (update) {
      // console.log('Updating image:', src)
      // console.log('Old el', el)
      el.attr('src', update)
      // console.log('updated el', el)
      return
    }
    // console.log('Image not found in updates:', src)
  })
}

async function getFixedHTML (post: PostsBase): Promise<{shouldUpdate: boolean, fixedHtml?: string}> {
  const html = post.contents?.html
  if (!html || !html.length) {
    // console.warn('No html for this post')
    return {shouldUpdate: false}
  }

  const $ = cheerio.load(html)
  const insecureImageSources = findInsecureImages($)
  if (!insecureImageSources.length) {
    // console.log('No insecure images found')
    return {shouldUpdate: false}
  }
  const {shouldUpdate, imageUpdates} = await testSecureImages(insecureImageSources, post)
  if (!shouldUpdate) {
    // console.log('Insecure images found but no update')
    return {shouldUpdate}
  }
  // console.log('imageUpdates', imageUpdates)

  // console.log('Updating')
  updateHtmlWithSecureImages($, imageUpdates)
 
  // const confirmNoInsecureImages = findInsecureImages($)
  // console.log('confirmNoInsecureImages', confirmNoInsecureImages)

  return {shouldUpdate, fixedHtml: $.html()}
}

registerMigration({
  name: "forceSecureImageLinks",
  dateWritten: "2020-05-06",
  idempotent: true,
  action: async () => {
    // let n = 0
    await forEachDocumentBatchInCollection({
      collection: Posts,
      filter: {
        status: 2,
        draft: {$ne: true},
      },
      callback: async (posts: Array<PostsBase>): Promise<void> => {
        let changes: Array<any> = [];
        for (const post of posts) {
          // if (n > 3) {
          //   continue
          // }
          // console.log('post:', post.title)
          const {shouldUpdate, fixedHtml} = await getFixedHTML(post)
          if (shouldUpdate) {
            // console.log('Updating', post._id, post.title)
            changes.push({
              updateOne: {
                filter: { _id: post._id },
                update: {
                  $set: { 'contents.html': fixedHtml }
                },
              },
            });
            // n++
          }
        }
        if (changes.length > 0) {
          console.log(`Updating image links for ${changes.length} posts`); // eslint-disable-line
          await Posts.rawCollection().bulkWrite(changes, { ordered: false });
        }
      }
    });
    console.log("Finished updating image links"); // eslint-disable-line
  },
});
