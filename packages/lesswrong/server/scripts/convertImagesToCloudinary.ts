import { Globals } from '../../lib/vulcan-lib';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/make_editable_callbacks';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { DatabaseServerSetting } from '../databaseSettings';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { randomId } from '../../lib/random';
import cloudinary from 'cloudinary';
import cheerio from 'cheerio';
import { URL } from 'url';

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

// Images on domains not in this list will be mirrored on Cloudinary and have
// their lines updated. (If you run the script. This doesn't (yet) auto-apply
// to all posts.)
const imageUrlWhitelist = [
  "cloudinary.com",
  "res.cloudinary.com",
  "www.lesswrong.com",
  "www.alignmentforum.org",
];

function urlNeedsMirroring(url: string) {
  const parsedUrl = new URL(url);
  if (imageUrlWhitelist.indexOf(parsedUrl.hostname) !== -1)
    return false;
  return true;
}

async function convertImagesInHTML(html: string, originDocumentId: string): Promise<string> {
  const parsedHtml = cheerio.load(html);
  const imgTags = parsedHtml("img");
  
  for (let i=0; i<imgTags.length; i++) {
    const src = cheerio(imgTags[i]).attr("src");
    if (src && urlNeedsMirroring(src)) {
      const newUrl = await moveImageToCloudinary(src, originDocumentId);
      if (newUrl) {
        cheerio(imgTags[i]).attr("src", newUrl);
      }
    }
  }
  
  return parsedHtml.html();
}

async function convertImagesInPost(postId: string) {
  const post = await Posts.findOne({_id: postId});
  if (!post) {
    // eslint-disable-next-line no-console
    console.error(`Cannot convert images in post ${postId}: invalid post ID`);
    return;
  }
  
  const latestRev = await getLatestRev(postId, "contents");
  if (!latestRev) {
    // eslint-disable-next-line no-console
    console.error(`Could not find a latest-revision for post ID: ${postId}`);
    return;
  }
  
  const newVersion = await getNextVersion(postId, "patch", "contents", false);
  const now = new Date();
  const oldHtml = latestRev.html;
  const newHtml = await convertImagesInHTML(oldHtml, postId);
  if (newHtml === latestRev.html) {
    // eslint-disable-next-line no-console
    console.log("No images to convert.");
    return;
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
}

Globals.moveImageToCloudinary = moveImageToCloudinary;
Globals.convertImagesInHTML = convertImagesInHTML;
Globals.convertImagesInPost = convertImagesInPost;
