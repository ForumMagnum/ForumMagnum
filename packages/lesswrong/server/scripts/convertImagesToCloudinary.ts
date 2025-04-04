import { Images } from '../../server/collections/images/collection';
import { DatabaseServerSetting } from '../databaseSettings';
import { ckEditorUploadUrlSetting, cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { randomId } from '../../lib/random';
import cloudinary, { UploadApiResponse } from 'cloudinary';
import cheerio from 'cheerio';
import { cheerioParse } from '../utils/htmlUtil';
import { URL } from 'url';
import { ckEditorUploadUrlOverrideSetting } from '../../lib/instanceSettings';
import uniq from 'lodash/uniq';
import { loggerConstructor } from '../../lib/utils/logging';
import { Posts } from '../../server/collections/posts/collection';
import { getAtPath, setAtPath } from '../../lib/helpers';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import { forEachDocumentBatchInCollection } from "../manualMigrations/migrationUtils";
import crypto from 'crypto';
import Papa from 'papaparse';
import fs from "node:fs";
import { sleep } from '@/lib/utils/asyncUtils';
import SideCommentCaches from '@/server/collections/sideCommentCaches/collection';
import { createAnonymousContext } from '../vulcan-lib/createContexts';

const cloudinaryApiKey = new DatabaseServerSetting<string>("cloudinaryApiKey", "");
const cloudinaryApiSecret = new DatabaseServerSetting<string>("cloudinaryApiSecret", "");

export type CloudinaryCredentials = {
  cloud_name: string,
  api_key: string,
  api_secret: string,
}

/**
 * Credentials that can be spread into `cloudinary.v2` functions, like so: `cloudinary.v2.url(publicId, { ...credentials })`
 */
const getCloudinaryCredentials = () => {
  const cloudName = cloudinaryCloudNameSetting.get();
  const apiKey = cloudinaryApiKey.get();
  const apiSecret = cloudinaryApiSecret.get();

  if (!cloudName || !apiKey || !apiSecret) {
    // eslint-disable-next-line no-console
    console.error("Cloudinary credentials not configured");
    return null;
  }

  const credentials: CloudinaryCredentials = {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  };
  return credentials;
};

/** If an image has already been re-hosted, return its CDN URL. Otherwise null. */
export async function findAlreadyMovedImage(identifier: string): Promise<string|null> {
  const image = await Images.findOne({identifier});
  return image?.cdnHostedUrl ?? null;
}

/**
 * Re-upload the given image URL to cloudinary, and return the cloudinary URL. If the image has already been uploaded
 * it will return the existing cloudinary URL.
 * Exported to allow use in "yarn repl"
 */
export async function moveImageToCloudinary({oldUrl, originDocumentId}: {oldUrl: string, originDocumentId: string}): Promise<string|null> {
  const upload = async (credentials: CloudinaryCredentials) => {
    // First try mirroring the existing URL. If that fails, try retrieving the
    // image from archive.org. If that still fails, let the exception escape,
    // which (in some contexts) will add it to a list of failed images.
    //
    // Note that loading images from archive.org this way is unreliable, even if
    // when archive.org definitely has the image. We don't auto-retry because
    // the unreliability is in some way rate-limit-related, and we have a pretty
    // conservative sleep in between tries. Once an image is successfully
    // recovered from archive.org it stays recovered (we save it in Cloudinary
    // along with its original URL), so you can keep retrying the overall
    // mirroring process until you've got all the images.
    try {
      return await cloudinary.v2.uploader.upload(
        oldUrl,
        {
          folder: `mirroredImages/${originDocumentId}`,
          ...credentials
        }
      );
    } catch(e1) {
      try {
        const archiveDotOrgUrl = imageUrlToArchiveDotOrgUrl(oldUrl);
        // In order to not risk hitting rate limits, sleep for half a second before each archive.org image
        await sleep(500);
        // eslint-disable-next-line no-console
        console.log(`Failed to upload ${oldUrl}; trying ${archiveDotOrgUrl}`);
        return await cloudinary.v2.uploader.upload(
          archiveDotOrgUrl,
          {
            folder: `mirroredImages/${originDocumentId}`,
            ...credentials
          }
        );
      } catch(e2) {
        throw e1;
      }
    }
  }

  return getOrCreateCloudinaryImage({identifier: oldUrl, identifierType: 'originalUrl', upload})
}

/**
 * Upload the given image buffer to cloudinary, and return the cloudinary URL. If the image has already been uploaded
 * (identified by SHA256 hash) it will return the existing cloudinary URL.
 */
export async function uploadBufferToCloudinary(buffer: Buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const upload = async (credentials: CloudinaryCredentials) => new Promise<UploadApiResponse>((resolve) => {
    cloudinary.v2.uploader
      .upload_stream(
        {
          ...credentials,
          folder: `mirroredImages/${hash}`
        },
        (error, result) => {
          if (error || !result) {
            // eslint-disable-next-line no-console
            console.error("Failed to upload buffer to Cloudinary:", error);
            throw error;
          }
          return resolve(result);
        }
      )
      .end(buffer);
  })

  return getOrCreateCloudinaryImage({identifier: hash, identifierType: 'sha256Hash', upload})
}

/**
 * Returns a cloudinary url of the image corresponding to `identifier`, uploads the image if it doesn't
 * already exist in cloudinary
 */
export async function getOrCreateCloudinaryImage({
  identifier,
  identifierType,
  upload,
}: {
  identifier: string;
  identifierType: string;
  upload: (credentials: CloudinaryCredentials) => Promise<UploadApiResponse>;
}) {
  const logger = loggerConstructor("image-conversion");
  const alreadyRehosted = await findAlreadyMovedImage(identifier);
  if (alreadyRehosted) return alreadyRehosted;

  const credentials = getCloudinaryCredentials();

  if (!credentials) return null;

  const uploadResponse = await upload(credentials);
  logger(`Result of uploading image: ${uploadResponse.secure_url}`);

  // Serve all images with automatic quality and format transformations to save on bandwidth
  const autoQualityFormatUrl = cloudinary.v2.url(uploadResponse.public_id, {
    ...credentials,
    quality: "auto",
    fetch_format: "auto",
    secure: true,
  });

  await Images.rawInsert({
    identifier,
    identifierType,
    cdnHostedUrl: autoQualityFormatUrl,
  });

  return autoQualityFormatUrl;
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
  try {
    const parsedUrl = new URL(url);
    if (getImageUrlWhitelist().indexOf(parsedUrl.hostname) !== -1) {
      return false;
    }
    return filterFn(url);
  } catch (e) {
    return false;
  }
}

// Exported to allow use in "yarn repl"
export async function convertImagesInHTML(
  html: string,
  originDocumentId: string,
  urlFilterFn: (url: string) => boolean = () => true,
  imageUrlsCache?: Record<string,string>
): Promise<{count: number, html: string, failedUrls: string[]}> {
  const parsedHtml = cheerioParse(html);
  const imgTags = parsedHtml("img").toArray();
  const imgUrls: string[] = [];
  const failedUrls: string[] = [];
  
  for (let imgTag of imgTags) {
    const urls = getImageUrlsFromImgTag(cheerio(imgTag));
    for (let url of urls) {
      if (urlNeedsMirroring(url, urlFilterFn)) {
        imgUrls.push(url);
      }
    }
  }

  // Upload all the images to Cloudinary (slow)
  const mirrorUrls: Record<string,string> = imageUrlsCache ?? {};
  // This section was previously parallelized (with a Promise.all), but this
  // would cause it to fail when other servers (notably arcive.org) rejected
  // the concurrent requests for being too fast (which is hard to distinguish
  // from failing for other reasons), so it's no longer parallelized.
  for (const url of imgUrls) {
    // resolve to the url of the image on cloudinary
    try {
      const movedImage = await moveImageToCloudinary({oldUrl: url, originDocumentId})
      if (movedImage) {
        mirrorUrls[url] = movedImage;
      }
    } catch(e) {
      failedUrls.push(url);
    }
  }

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
  
  return {
    count,
    html: parsedHtml.html(),
    failedUrls,
  };
}

function getImageUrlsFromImgTag(tag: any): string[] {
  let imageUrls: string[] = [];
  const src: string = tag.attr("src");
  if (src) {
    imageUrls.push(src);
  }
  const srcset: string = tag.attr("srcset");
  if (srcset) {
    const imageVariants = srcset.split(/,\s/g).map(tok=>tok.trim());
    for (let imageVariant of imageVariants) {
      const [url, _size] = imageVariant.split(" ").map(tok=>tok.trim());
      if (url) imageUrls.push(url);
    }
  }
  
  return uniq(imageUrls);
}

function rewriteSrcset(srcset: string, urlMap: Record<string,string>): string {
  const imageVariants = srcset.split(/,\s/g).map(tok=>tok.trim());
  const rewrittenImageVariants = imageVariants.map(variant => {
    let tokens = variant.split(" ");
    if (tokens[0] in urlMap)
      tokens[0] = urlMap[tokens[0]];
    return tokens.join(" ");
  });
  return rewrittenImageVariants.join(", ");
}

/**
 * Reupload all images in an object (post, tag, user, etc) to Cloudinary, for a
 * specific editable field. Creates a new revision with the updated HTML.
 *
 * @param collectionName - The collection that this object is in
 * @param _id - The object to reupload images for
 * @param fieldName - The content-editable field tos can for images
 * @param urlFilterFn - A function that takes a URL and returns true if it should be mirrored, by default all URLs are mirrored except those in getImageUrlWhitelist()
 * @returns The number of images that were mirrored
 *
 * Exported to allow use in "yarn repl"
 */
export async function convertImagesInObject<N extends CollectionNameString>(
  collectionName: N,
  _id: string,
  context: ResolverContext,
  fieldName = "contents",
  urlFilterFn: (url: string) => boolean = ()=>true
): Promise<{
  numUploaded: number
  failedUrls: string[]
}> {
  const { Revisions } = context;
  const logger = loggerConstructor("image-conversion")
  let totalUploaded = 0;
  try {
    const collection: CollectionBase<CollectionNameString> = context[collectionName];
    const obj = await collection.findOne({_id});

    if (!obj) {
      // eslint-disable-next-line no-console
      console.error(`Cannot convert images in ${collectionName}.${_id}: ID not found`);
      return {numUploaded: 0, failedUrls: []};
    }
    
    const latestRev = await getLatestRev(_id, fieldName, context);
    if (!latestRev) {
      // If this field doesn't have a latest rev, it's empty (common eg for
      // moderation guidelines).
      return {numUploaded: 0, failedUrls: []};
    }
    
    const newVersion = getNextVersion(latestRev, "patch", false);
    const now = new Date();
    // We also manually downcast the document because it's otherwise a union type of all possible DbObjects, and we can't use a random string as an index accessor
    // This is because `collection` is itself a union of all possible collections
    // I tried to make a mutual constraint between `fieldName` and `collectionName` but it was a bit too finnicky to be worth it; this is mostly being (unsafely) called from Globals anyways
    //
    // TODO: For post contents normalization. Below is the old comment - is this a problem?
    // NOTE: we use the post contents rather than the revision contents because we don't
    // create a revision for no-op edits (this is arguably a bug)
    // const oldHtml = (obj as AnyBecauseHard)?.[fieldName]?.html;
    const oldHtml = latestRev.html;
    if (!oldHtml) {
      return {numUploaded: 0, failedUrls: []};
    }
    const {count: uploadCount, html: newHtml, failedUrls} = await convertImagesInHTML(oldHtml, _id, urlFilterFn);
    if (!uploadCount) {
      logger("No images to convert.");
      return {numUploaded: 0, failedUrls: []};
    } else {
      logger(`Converted ${uploadCount} images`)
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
          ...(obj as AnyBecauseHard)[fieldName],
          html: newHtml,
          version: newVersion,
          editedAt: now,
          updateType: "patch",
        },
      }
    });
    totalUploaded += uploadCount;
    
    // HACK: If this is a post's contents, delete any corresponding entry in SideCommentCaches. This is necessary because the cache determines if it's valid based on editedAt, rather than the ID of the latest revision, and we just created a revision without bumping editedAt.
    if (collectionName === "Posts" && fieldName === "contents") {
      await SideCommentCaches.rawRemove({ postId: _id });
    }
    
    return {
      numUploaded: totalUploaded,
      failedUrls,
    };
  } catch (e) {
    // Always catch the error because the obj should mostly load fine without rehosting the images
    // eslint-disable-next-line no-console
    console.error("Error in convertImagesInObject", e)
    return {
      numUploaded: 0,
      failedUrls: [],
    };
  }
}

const postMetaImageFields: string[][] = [
  ["socialPreview", "imageId"],
  ["eventImageId"],
  ["socialPreviewImageAutoUrl"],
  ["socialPreviewImageId"],
];

// Exported to allow use in "yarn repl"
export const rehostPostMetaImages = async (post: DbPost) => {
  const operations: MongoBulkWriteOperations<DbPost> = [];

  for (const field of postMetaImageFields) {
    const currentUrl = getAtPath<DbPost, string>(post, field);
    if (!currentUrl || !urlNeedsMirroring(currentUrl, () => true)) {
      continue;
    }

    let newUrl: string | null = null;
    try {
      newUrl = await moveImageToCloudinary({oldUrl: currentUrl, originDocumentId: post._id});
    } catch (e) {
      // eslint-disable-next-line
      console.error(`Failed to move image for ${post._id}:`, field, `(error ${e})`);
      continue;
    }
    if (!newUrl) {
      // eslint-disable-next-line
      console.error(`Failed to move image for ${post._id}:`, field);
      continue;
    }

    setAtPath(post, field, newUrl);

    operations.push({
      updateOne: {
        filter: {
          _id: post._id,
        },
        update: {
          $set: {
            [field.join(".")]: newUrl,
          },
        },
      },
    });
  }

  await Posts.rawCollection().bulkWrite(operations);
}

// Exported to allow use in "yarn repl"
export const rehostPostMetaImagesById = async (postId: string) => {
  const post = await Posts.findOne({_id: postId});
  if (!post) {
    throw new Error("Post not found");
  }
  await rehostPostMetaImages(post);
}

// Exported to allow use in "yarn repl"
export const rehostAllPostMetaImages = async () => {
  const projection: Partial<Record<keyof DbPost, 1>> = {_id: 1};
  for (const field of postMetaImageFields) {
    projection[field[0] as keyof DbPost] = 1;
  }
  const posts = await Posts.find({
    $or: postMetaImageFields.map((field) => ({[field[0]]: {$exists: true}})),
  }, {projection}).fetch();
  for (const post of posts) {
    await rehostPostMetaImages(post);
  }
}

type ImageUploadStats = {
  documentCount: number
  uploadedImageCount: number
  failedUrls: Array<{originDocumentId: string, url: string}>
}

function getEmptyImageUploadStats(): ImageUploadStats {
  return {
    documentCount: 0,
    uploadedImageCount: 0,
    failedUrls: [],
  }
}

/**
 * When saving content with <img> tags in it, we download the image, mirror
 * it in on our own CDN, and save a mapping form the original URL to our
 * mirror in the Images collection. This is to protect against old image links
 * disappearing, or having rate-limits affecting cross-site loading, etc.
 *
 * When importing content, eg from Arbital, some image links may have *already*
 * disappeared, in which case we can't download them for mirroring. Those
 * images might be manually recoverable from sources like archive.org, but
 * after downloading them we have to get them into the Images collection.
 *
 * This script takes a CSV file where the first column is image URLs (that are
 * presumably no longer accessible), and the second column is local file paths
 * for the corresponding images. For each pair, it uploads the image to our
 * CDN and records that in the Images collection. Any images that are already
 * present in the Images collection will be skipped.
 */
export async function importImageMirrors(csvFilename: string) {
  const csvStr = fs.readFileSync(csvFilename, 'utf-8');
  const parsedCsv = Papa.parse(csvStr, {
    delimiter: ',',
    skipEmptyLines: true,
  });
  if (parsedCsv.errors?.length > 0) {
    for (const error of parsedCsv.errors) {
      // eslint-disable-next-line no-console
      console.error(`${error.row}: ${error.message}`);
    }
    throw new Error("Error parsing CSV");
  }
  
  let alreadyMovedCount = 0;
  let skippedCount = 0;
  let uploadedCount = 0;
  let failedCount = 0;
  
  for (const row of parsedCsv.data) {
    const [originDocumentId, originalUrl, altUrlOrPath] = (row as any);
    
    const alreadyMovedImage = await findAlreadyMovedImage(originalUrl);
    if (alreadyMovedImage) {
      alreadyMovedCount++;
    } else if (!altUrlOrPath || altUrlOrPath.length===0) {
      // No alternate source provided for this image
      skippedCount++;
      continue;
    } else {
      // An alternate source is provided which looks like a URL
      const upload = async (credentials: CloudinaryCredentials) => await cloudinary.v2.uploader.upload(
        altUrlOrPath,
        {
          folder: `mirroredImages/${originDocumentId}`,
          ...credentials
        }
      );
    
      try {
        await getOrCreateCloudinaryImage({identifier: originalUrl, identifierType: 'originalUrl', upload})
        uploadedCount++;
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error(e);
        failedCount++;
      }
    }
  }
  
  // eslint-disable-next-line no-console
  console.log(`Finished processing images. Already moved: ${alreadyMovedCount}, skipped: ${skippedCount}, uploaded: ${uploadedCount}, failed: ${failedCount}`);
}

// Exported to allow use in "yarn repl"
export async function rehostImagesInAllPosts(postFilter: MongoSelector<DbPost>, urlFilter = (url: string) => true) {
  let stats = getEmptyImageUploadStats();
  const context = createAnonymousContext();

  await forEachDocumentBatchInCollection({
    collection: Posts,
    batchSize: 100,
    filter: postFilter,
    callback: async (posts) => {
      const uploadResults = await Promise.all(
        posts.map(async (post) => {
          const {numUploaded, failedUrls} = await convertImagesInObject("Posts", post._id, context, "contents", urlFilter)
          stats.documentCount++;
          stats.uploadedImageCount += numUploaded;
          for (const failedUrl of failedUrls) {
            stats.failedUrls.push({originDocumentId: post._id, url: failedUrl});
          }
          return {numUploaded, failedUrls, originDocumentId: post._id};
        })
      );
    }
  });

  saveImageUploadResults(stats);
}

// Exported to allow use in "yarn repl"
export async function rehostImagesInPost(_id: string) {
  let stats = getEmptyImageUploadStats();
  const context = createAnonymousContext();
  const {numUploaded, failedUrls} = await convertImagesInObject("Posts", _id, context, "contents")
  stats.documentCount++;
  stats.uploadedImageCount += numUploaded;
  for (const failedUrl of failedUrls) {
    stats.failedUrls.push({originDocumentId: _id, url: failedUrl});
  }
  saveImageUploadResults(stats);
}

function saveImageUploadResults(stats: ImageUploadStats) {
  // eslint-disable-next-line no-console
  console.log(`Converted ${stats.uploadedImageCount} images in ${stats.documentCount} documents`);

  if (stats.failedUrls.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`Failed to upload ${stats.failedUrls.length} images. Failed images written to failed_image_uploads.csv. To restore broken images, fill in the third column with other URLs or local filenames and run \`importImageMirrors("failed_image_uploads.csv")\``);
    fs.writeFileSync("failed_image_uploads.csv", Papa.unparse(
      stats.failedUrls.map(({originDocumentId, url}) => [originDocumentId, url, ""]))
    );
  }
}

function imageUrlToArchiveDotOrgUrl(imageUrl: string): string {
  // In archive.org URLs, /web/<date>if_/<url> is the version of that URL on or
  // after the given date (it will redirect to replace the given date with the
  // actual date of the snapshot).
  return `https://web.archive.org/web/19000101000000id_/${imageUrl}`;
}
