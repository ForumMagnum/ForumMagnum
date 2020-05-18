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
      console.log('found insecure image:', src)
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
      if (!(await urlIsBroken(secureImageSource))) {
        console.log('found 1', src)
        shouldUpdate = true
        return [src, secureImageSource]
      }
      //eslint-disable-next-line no-console
      console.log(
        `No secure version of image found for post ${post._id}/${post.slug}, image: ${src}}`
      )
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
    if (imageUpdates[src]) {
      el.attr('src', imageUpdates[src])
    }
  })
}

async function getFixedHTML (post: PostsBase): Promise<{shouldUpdate: boolean, fixedHtml?: string}> {
  const html = post.contents?.html
  if (!html || !html.length) {
    console.warn('No html for this post')
    return {shouldUpdate: false}
  }

  const $ = cheerio.load(html)
  const insecureImageSources = findInsecureImages($)
  if (!insecureImageSources) return {shouldUpdate: false}
  const {shouldUpdate, imageUpdates} = await testSecureImages(insecureImageSources, post)
  if (!shouldUpdate) {
    console.log('No update')
    return {shouldUpdate}
  }

  console.log('Updating')
  updateHtmlWithSecureImages($, imageUpdates)
  return {shouldUpdate, fixedHtml: $.html()}
}

registerMigration({
  name: "forceSecureImageLinks",
  dateWritten: "2020-05-06",
  idempotent: true,
  action: async () => {
    let n = 0
    await forEachDocumentBatchInCollection({
      collection: Posts,
      filter: {
        status: 2,
        draft: {$ne: true},
      },
      callback: async (posts) => {
        let changes: Array<any> = [];
        for (const post of posts) {
          if (n > 3) {
            return
          }
          // console.log('post:', post.title)
          const {shouldUpdate, fixedHtml} = await getFixedHTML(post)
          if (shouldUpdate) {
            console.log(' =.= found one', post._id, post.title)
            n++
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
        // if (changes.length > 0) {
        //   console.log(`Updating image links for ${changes.length} posts`); // eslint-disable-line
        //   await Posts.rawCollection().bulkWrite(changes, { ordered: false });
        // }
      }
    });
    console.log("Finished updating legacy user join dates"); // eslint-disable-line
  },
});
