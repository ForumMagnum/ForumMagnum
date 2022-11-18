import { Globals } from '../../lib/vulcan-lib/config';
import { editableCollectionsFields } from '../../lib/editor/make_editable';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/make_editable_callbacks';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Images } from '../../lib/collections/images/collection';
import { DatabaseServerSetting } from '../databaseSettings';
import { ckEditorUploadUrlSetting, cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { randomId } from '../../lib/random';
import cloudinary from 'cloudinary';
import cheerio from 'cheerio';
import { URL } from 'url';
import { ckEditorUploadUrlOverrideSetting } from '../../lib/instanceSettings';
import { getCollection } from '../../lib/vulcan-lib/getCollection';
import uniq from 'lodash/uniq';

const cloudinaryApiKey = new DatabaseServerSetting<string>("cloudinaryApiKey", "");
const cloudinaryApiSecret = new DatabaseServerSetting<string>("cloudinaryApiSecret", "");

// Given a URL which (probably) points to an image, download that image,
// re-upload it to cloudinary, and return a cloudinary URL for that image. If
// the URL is already Cloudinary or can't be downloaded, returns null instead.
async function moveImageToCloudinary(oldUrl: string, originDocumentId: string): Promise<string|null> {
  const alreadyRehosted = await findAlreadyMovedImage(oldUrl);
  if (alreadyRehosted) return alreadyRehosted;
  
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
  
  await Images.rawInsert({
    originalUrl: oldUrl,
    cdnHostedUrl: result.url,
  });
  
  return result.url;
}

/// If an image has already been re-hosted, return its CDN URL. Otherwise null.
async function findAlreadyMovedImage(url: string): Promise<string|null> {
  const image = await Images.findOne({originalUrl: url});
  return image?.cdnHostedUrl ?? null;
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
  const imgUrls: string[] = [];
  
  for (let imgTag of imgTags) {
    const urls = getImageUrlsFromImgTag(cheerio(imgTag));
    for (let url of urls) {
      if (urlNeedsMirroring(url, urlFilterFn)) {
        imgUrls.push(url);
      }
    }
  }

  // Upload all the images to Cloudinary (slow)
  const mirrorUrls: Record<string,string> = {};
  await Promise.all(imgUrls.map(async (url) => {
    // resolve to the url of the image on cloudinary
    const movedImage = await moveImageToCloudinary(url, originDocumentId)
    if (movedImage) {
      mirrorUrls[url] = movedImage;
    }
  }));

  // cheerio is not guarantueed to return the same html so explicitly count
  // the number of images that were converted
  let count = 0
  
  for (let i=0; i<imgTags.length; i++) {
    const imgTag = cheerio(imgTags[i]);
    const src: string|undefined = imgTag.attr("src");
    if (src) {
      const replacement = mirrorUrls[src];
      if (replacement) {
        imgTag.attr("src", replacement);
        count++;
      }
    }
    
    const srcset: string|undefined = imgTag.attr("srcset");
    if (srcset) {
      const replacement = rewriteSrcset(srcset, mirrorUrls);
      if (replacement) {
        imgTag.attr("srcset", replacement);
        count++;
      }
    }
  }
  
  return {count, html: parsedHtml.html()};
}

function getImageUrlsFromImgTag(tag: any): string[] {
  let imageUrls: string[] = [];
  const src: string = tag.attr("src");
  if (src) {
    imageUrls.push(src);
  }
  const srcset: string = tag.attr("srcset");
  if (srcset) {
    const imageVariants = srcset.split(",").map(tok=>tok.trim());
    for (let imageVariant of imageVariants) {
      const [url,size] = imageVariant.split(" ").map(tok=>tok.trim());
      if (url) imageUrls.push(url);
    }
  }
  
  return uniq(imageUrls);
}

function rewriteSrcset(srcset: string, urlMap: Record<string,string>): string {
  const imageVariants = srcset.split(",").map(tok=>tok.trim());
  const rewrittenImageVariants = imageVariants.map(variant => {
    let tokens = variant.split(" ");
    if (tokens[0] in urlMap)
      tokens[0] = urlMap[tokens[0]];
    return tokens.join(" ");
  });
  return rewrittenImageVariants.join(", ");
}

/**
 * Reupload all images in an object (post, tag, user, etc) to Cloudinary. For each editable
 * field which had an image that needed reuploading, creates a new revision with the updated
 * HTML.
 *
 * @param collectionName The collection that this object is in
 * @param _id - The object to reupload images for
 * @param urlFilterFn - A function that takes a URL and returns true if it should be mirrored, by default all URLs are mirrored except those in getImageUrlWhitelist()
 * @returns The number of images that were mirrored
 */
export async function convertImagesInObject(
  collectionName: CollectionNameString,
  _id: string,
  urlFilterFn: (url: string)=>boolean = ()=>true
): Promise<number> {
  let totalUploaded = 0;
  try {
    const collection = getCollection(collectionName);
    const obj = await collection.findOne({_id});
    
    for (let fieldName of editableCollectionsFields[collectionName]) {
      if (!obj) {
        // eslint-disable-next-line no-console
        console.error(`Cannot convert images in ${collectionName}.${_id}: ID not found`);
        return 0;
      }
      
      const latestRev = await getLatestRev(_id, fieldName);
      if (!latestRev) {
        // eslint-disable-next-line no-console
        console.error(`Could not find a latest-revision for ${collectionName} ID: ${_id}`);
        return 0;
      }
      
      const newVersion = await getNextVersion(_id, "patch", fieldName, false);
      const now = new Date();
      // NOTE: we use the post contents rather than the revision contents because we don't
      // create a revision for no-op edits (this is arguably a bug)
      const oldHtml = obj[fieldName].html;
      const {count: uploadCount, html: newHtml} = await convertImagesInHTML(oldHtml, _id, urlFilterFn);
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
      await collection.rawUpdateOne({_id}, {
        $set: {
          [`${fieldName}_latest`]: insertedRevisionId,
          [fieldName]: {
            ...obj[fieldName],
            html: newHtml,
            version: newVersion,
            editedAt: now,
            updateType: "patch",
          },
        }
      });
      totalUploaded += uploadCount;
    }
    return totalUploaded;
  } catch (e) {
    // Always catch the error because the obj should mostly load fine without rehosting the images
    // eslint-disable-next-line no-console
    console.error("Error in convertImagesInObject", e)
    return 0
  }
}

Globals.moveImageToCloudinary = moveImageToCloudinary;
Globals.convertImagesInHTML = convertImagesInHTML;
Globals.convertImagesInObject = convertImagesInObject;
