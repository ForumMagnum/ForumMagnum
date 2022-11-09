import { Globals } from '../../lib/vulcan-lib';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/make_editable_callbacks';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { DatabaseServerSetting } from '../databaseSettings';
import { ckEditorUploadUrlSetting, cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { randomId } from '../../lib/random';
import cloudinary from 'cloudinary';
import cheerio from 'cheerio';
import { URL } from 'url';
import { ckEditorUploadUrlOverrideSetting } from '../../lib/instanceSettings';

const cloudinaryApiKey = new DatabaseServerSetting<string>("cloudinaryApiKey", "");
const cloudinaryApiSecret = new DatabaseServerSetting<string>("cloudinaryApiSecret", "");

// Given a URL which (probably) points to an image, download that image,
// re-upload it to cloudinary, and return a cloudinary URL for that image. If
// the URL is already Cloudinary or can't be downloaded, returns null instead.
async function moveImageToCloudinary(oldUrl: string, originDocumentId: string): Promise<string|null> {
  const cloudName = cloudinaryCloudNameSetting.get();
  const apiKey = cloudinaryApiKey.get();
  const apiSecret = cloudinaryApiSecret.get();
  
  if (!cloudName || !apiKey || !apiSecret) {
    // eslint-disable-next-line no-console
    console.error("Cannot upload image to Cloudinary: not configured");
    return null;
  }
  
  const result = await cloudinary.v2.uploader.upload(
    oldUrl,
    {
      folder: `mirroredImages/${originDocumentId}`,
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    }
  );
  // eslint-disable-next-line no-console
  console.log(`Result of moving image: ${result.url}`);
  return result.url;
}

/**
 * Images on domains not in this list will be mirrored on Cloudinary and have
 * their src updated.
 */
function getImageUrlWhitelist() {
  const localUploadUrl = ckEditorUploadUrlOverrideSetting.get() || ckEditorUploadUrlSetting.get()
  return [
    "cloudinary.com",
    "res.cloudinary.com",
    "www.lesswrong.com",
    "www.alignmentforum.org",
  ].concat(localUploadUrl ? [new URL(localUploadUrl).host] : []);
}

function urlNeedsMirroring(url: string, filterFn: (url: string) => boolean) {
  const parsedUrl = new URL(url);
  if (getImageUrlWhitelist().indexOf(parsedUrl.hostname) !== -1) {
    return false;
  }
  return filterFn(url);
}

async function convertImagesInHTML(html: string, originDocumentId: string, urlFilterFn: (url: string) => boolean = () => true): Promise<{count: number, html: string}> {
  // @ts-ignore
  const parsedHtml = cheerio.load(html, null, false);
  const imgTags = parsedHtml("img").toArray();

  // Upload all the images to Cloudinary (slow)
  const mirrorUrls = await Promise.all(imgTags.map(tag => {
    const src = cheerio(tag).attr("src")
    if (!src || !(src && urlNeedsMirroring(src, urlFilterFn))) return null

    // resolve to the url of the image on cloudinary
    return moveImageToCloudinary(src, originDocumentId)
  }));

  // cheerio is not guarantueed to return the same html so explicitly count
  // the number of images that were converted
  let count = 0
  for (let i=0; i<imgTags.length; i++) {
    const mirrorUrl = mirrorUrls[i];
    if (mirrorUrl) {
      count++
      cheerio(imgTags[i]).attr("src", mirrorUrl);
    }
  }
  
  return {count, html: parsedHtml.html()};
}

/**
 * Reupload all images in a post to Cloudinary, and create a new revision with the updated html
 * @param postId - The post to reupload images for
 * @param urlFilterFn - A function that takes a URL and returns true if it should be mirrored, by default all URLs are mirrored except those in getImageUrlWhitelist()
 * @returns The number of images that were mirrored
 */
export async function convertImagesInPost(postId: string, urlFilterFn: (url: string) => boolean = () => true): Promise<number> {
  try {
    const post = await Posts.findOne({_id: postId});
    if (!post) {
      // eslint-disable-next-line no-console
      console.error(`Cannot convert images in post ${postId}: invalid post ID`);
      return 0;
    }
    
    const latestRev = await getLatestRev(postId, "contents");
    if (!latestRev) {
      // eslint-disable-next-line no-console
      console.error(`Could not find a latest-revision for post ID: ${postId}`);
      return 0;
    }
    
    const newVersion = await getNextVersion(postId, "patch", "contents", false);
    const now = new Date();
    // NOTE: we use the post contents rather than the revision contents because we don't
    // create a revision for no-op edits (this is arguably a bug)
    const oldHtml = post.contents.html;
    const {count: uploadCount, html: newHtml} = await convertImagesInHTML(oldHtml, postId, urlFilterFn);
    if (!uploadCount) {
      // eslint-disable-next-line no-console
      console.log("No images to convert.");
      return 0;
    } else {
      // eslint-disable-next-line no-console
      console.log(`Converted ${uploadCount} images`)
    }
    
    const newRevision = {
      ...latestRev,
      _id: randomId(),
      html: newHtml,
      editedAt: now,
      updateType: "patch",
      version: newVersion,
      commitMessage: "Move images to CDN",
      changeMetrics: htmlToChangeMetrics(oldHtml, newHtml),
    };
    const insertedRevisionId: string = await Revisions.rawInsert(newRevision);
    await Posts.rawUpdateOne({_id: postId}, {
      $set: {
        contents_latest: insertedRevisionId,
        contents: {
          ...post.contents,
          html: newHtml,
          version: newVersion,
          editedAt: now,
          updateType: "patch",
        },
      }
    });
    return uploadCount;
  } catch (e) {
    // Always catch the error because the post should mostly load fine without rehosting the images
    // eslint-disable-next-line no-console
    console.error("Error in convertImagesInPost", e)
    return 0
  }
}

Globals.moveImageToCloudinary = moveImageToCloudinary;
Globals.convertImagesInHTML = convertImagesInHTML;
Globals.convertImagesInPost = convertImagesInPost;
