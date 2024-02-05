import { Globals } from "../vulcan-lib";
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Posts } from "../../lib/collections/posts";
import Images from "../../lib/collections/images/collection";

const accessToken = 'ACCESS_TOKEN_FROM_PLAYGROUND';
const fileId = '1TmTAmTGflxxTnNHPRIW1Nie_rpWN6R0vyh-dLeh7Wl8';

const oauth2Client = new OAuth2Client();
oauth2Client.setCredentials({ access_token: accessToken });

async function getGoogleDocAsHtml(accessToken: string, fileId: string): Promise<string> {
  // Initialize the Google Drive API client
  const drive = google.drive({
      version: 'v3',
      auth: oauth2Client  // Assuming accessToken is already obtained
  });

  try {
      // Make a request to get the file in HTML format
      const response = await drive.files.export({
          fileId: fileId,
          mimeType: 'text/html'
      }, { responseType: 'text' });

      return response.data as string; // The HTML content of the Google Doc
  } catch (error) {
      console.error('Error fetching Google Doc:', error);
      throw error;
  }
}

const testGoogleDocImport = async () => {
  const html = await getGoogleDocAsHtml(accessToken, fileId)

  console.log(html)
}

async function estimateGoogleDocsProportion() {
  const allPosts = await Posts.find(
    { draft: false, baseScore: { $gte: 10 } },
    { sort: { postedAt: -1 }, limit: 500 }
  ).fetch();
  let countGoogleDocsImages = 0;
  let countNonGoogleDocsImages = 0;
  let countNoImages = 0;

  for (const post of allPosts) {
    const postHtml = post.contents?.html;
    if (!postHtml) continue;

    const imageUrls = postHtml.match(/https:\/\/res\.cloudinary\.com\/cea\/image\/upload\/[^\s"]+/g) || [];
    let foundGoogleDocsImage = false;

    for (const cdnUrl of imageUrls) {
      const image = await Images.findOne({ cdnHostedUrl: cdnUrl });
      if (image && image.originalUrl.includes("googleusercontent")) {
        foundGoogleDocsImage = true;
        break; // Found a Google Docs image, no need to check further
      }
    }

    if (foundGoogleDocsImage) {
      countGoogleDocsImages++;
    } else if (imageUrls.length > 0) {
      countNonGoogleDocsImages++;
    } else {
      countNoImages++;
    }
  }

  console.log(`Count of posts with Google Docs images: ${countGoogleDocsImages}`);
  console.log(`Count of posts with images not from Google Docs: ${countNonGoogleDocsImages}`);
  console.log(`Count of posts without images: ${countNoImages}`);
  console.log(`Total posts analyzed: ${allPosts.length}`);
}

Globals.testGoogleDocImport = testGoogleDocImport;
Globals.estimateGoogleDocsProportion = estimateGoogleDocsProportion;
