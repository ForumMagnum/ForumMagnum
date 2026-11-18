import { generateText } from "ai";
import uniqBy from "lodash/uniqBy";
import { z } from "zod";
import { cloudinaryCloudName } from "@/lib/instanceSettings";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import NarrationImageDescriptions from "@/server/collections/narrationImageDescriptions/collection";
import { isImageHostExemptFromMirroring } from "@/server/scripts/convertImagesToCloudinary";
import { NARRATION_READING_MODEL } from "./llmReadings";

/**
 * Descriptions are stored and reused, so this must be increased whenever the
 * description that would be written for an image changes: when the prompt, the
 * lengths that go into it, or the model changes. Scripts that were built with
 * the old descriptions are only replaced if NARRATION_PREPROCESSOR_VERSION is
 * increased as well.
 */
const IMAGE_DESCRIPTION_PROMPT_VERSION = 1;

/** How long a description should be, other than when it's reading out text that's in the image */
const IMAGE_DESCRIPTION_TARGET_WORDS = 60;
/** How long the reading of an image of text can be. Text that doesn't fit is partly summarized. */
const IMAGE_TRANSCRIPTION_MAX_WORDS = 150;

/** Images are scaled down to fit within a square of this many pixels before the model sees them */
const IMAGE_MAX_DIMENSION = 1568;
const CONCURRENT_DESCRIPTIONS = 8;

const CLOUDINARY_UPLOAD_URL_PREFIX = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/`;
/**
 * Scales the image down, takes the first frame if it's animated, and converts
 * formats that the model doesn't accept. (Cloudinary's automatic format is
 * PNG, JPEG or GIF when the request doesn't say that it accepts anything
 * newer. In particular, this is what turns an SVG into a PNG.)
 */
const CLOUDINARY_TRANSFORMATION = `c_limit,w_${IMAGE_MAX_DIMENSION},h_${IMAGE_MAX_DIMENSION},pg_1,f_auto`;

const describableMediaTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

const IMAGE_DESCRIPTION_SYSTEM_PROMPT = `You write what a narrator says about an image when reading a blog post aloud. Listeners can't see the image, so what you write stands in for it.

You'll be given the image, and JSON with:
- "postTitle": the title of the post
- "precedingText": the text just before the image
- "followingText": the text just after the image, which is often its caption
- "altText": the image's alt text, which is often empty

The text before and after the image is read aloud as well, and a caption is heard right after your description, so don't repeat what they say.

Alt text is sometimes a good description written by the post's author. If it matches what you see and suits being read aloud, you can use it, as it is or as a starting point. More often it's a file name, a placeholder such as "image", or something else that's no use to a listener; ignore it then.

First decide what kind of image it is, then write the reading for that kind:

- "text": a screenshot of text, such as a tweet, a chat message, or an excerpt of a document. Say what it is in a few words ("A tweet from Jane Doe:"), then read its text word for word. Leave out interface clutter: like and view counts, timestamps, buttons, handles. The reading can be up to about ${IMAGE_TRANSCRIPTION_MAX_WORDS} words long. If the text doesn't fit in that, read the part that matters most for the post word for word, and say what the rest is in a sentence or two.
- "table": an image of a table. Say what the table shows, then go through it the way a person would read it aloud: in sentences, naming what each value is. If it has more than about eight rows, don't read every cell: say what's being compared and give the entries that matter for the post.
- "chart": a plot of data. Say what kind of chart it is and what the axes and series are, then what it shows: the main trend or comparison, with the key numbers. Prefer numbers that are written on the chart to ones you'd have to estimate from an axis, and don't list every point.
- "diagram": a drawing of how things relate (flowchart, architecture, schematic). Name the parts and say how they connect, in an order a listener can follow.
- "photo": a photograph, illustration or other picture. One or two sentences on what it shows, concentrating on what matters for the post. Don't identify real people from how they look; you can name someone if the surrounding text or visible text does.
- "meme": a meme or comic. Describe the format briefly and read its text so that the joke comes across.
- "decorative": a divider, logo, icon or other image that a listener wouldn't miss. Give an empty reading. Memes, comics and illustrations aren't decorative, even when they're only there for fun: describe them.

Begin the reading with a short label so listeners know this is a description of an image rather than the author's words, such as "Image:", "Chart:", or "A screenshot of a tweet:". Write plain words for speaking: no markdown, no lists, and spell out symbols. Outside of reading text word for word, keep it to about ${IMAGE_DESCRIPTION_TARGET_WORDS} words.

Reply with the kind on a line by itself, then the reading on the lines after it, and nothing else. For a decorative image, reply with only the word decorative.`;

const imageKindSchema = z.enum(["text", "table", "chart", "diagram", "photo", "meme", "decorative"]);

export interface ImageToDescribe {
  /** The image's `src` in the post's HTML */
  imageUrl: string
  altText: string
  precedingText: string
  followingText: string
}

interface DownloadedImage {
  bytes: Uint8Array
  mediaType: string
}

interface ImageDescription {
  kind: z.infer<typeof imageKindSchema>
  reading: string
}

/**
 * Descriptions are stored by image URL, so an image is only described once
 * its URL is the one it will keep. An image that a post refers to on someone
 * else's server gets mirrored to ours after the post is saved, which rewrites
 * the post (as a new revision) to use the mirror's URL. Until that has
 * happened the image has no description; the script that gets built for the
 * rewritten revision is the one that describes it.
 */
function hasPermanentUrl(imageUrl: string): boolean {
  return URL.canParse(imageUrl) && isImageHostExemptFromMirroring(new URL(imageUrl).hostname);
}

function getDownloadUrl(imageUrl: string): string {
  if (!imageUrl.startsWith(CLOUDINARY_UPLOAD_URL_PREFIX)) {
    return imageUrl;
  }
  return `${CLOUDINARY_UPLOAD_URL_PREFIX}${CLOUDINARY_TRANSFORMATION}/${imageUrl.slice(CLOUDINARY_UPLOAD_URL_PREFIX.length)}`;
}

/**
 * Returns null for an image that doesn't exist. Readers of the post don't see
 * that image either, so it's left out of the narration rather than treated as
 * a failure.
 */
async function downloadImage(imageUrl: string): Promise<DownloadedImage|null> {
  const response = await fetch(getDownloadUrl(imageUrl));
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Fetching image ${imageUrl} failed with status ${response.status}`);
  }
  const mediaType = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
  if (!describableMediaTypes.has(mediaType)) {
    throw new Error(`Image ${imageUrl} has media type "${mediaType}", which can't be described`);
  }
  return { bytes: new Uint8Array(await response.arrayBuffer()), mediaType };
}

/**
 * The reply is plain text rather than JSON because a description is one long
 * string, and when the model wrote that as the last value in a JSON object,
 * about one description in thirty ended with a stray quote mark or brace.
 */
function parseDescriptionReply(reply: string, imageUrl: string): ImageDescription {
  const [firstLine, ...readingLines] = reply.trim().split("\n");
  const kind = imageKindSchema.safeParse(firstLine.trim());
  if (!kind.success) {
    throw new Error(`The description of image ${imageUrl} doesn't start with a kind of image: ${reply.slice(0, 500)}`);
  }
  return { kind: kind.data, reading: readingLines.join("\n").trim() };
}

async function describeAndStoreImage(image: ImageToDescribe, postTitle: string): Promise<string> {
  const { imageUrl, altText, precedingText, followingText } = image;
  const downloadedImage = await downloadImage(imageUrl);
  if (!downloadedImage) {
    return "";
  }

  const result = await generateText({
    model: NARRATION_READING_MODEL,
    system: IMAGE_DESCRIPTION_SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: JSON.stringify({ postTitle, precedingText, followingText, altText }) },
        { type: "image", image: downloadedImage.bytes, mediaType: downloadedImage.mediaType },
      ],
    }],
    maxOutputTokens: 4000,
  });
  const { kind, reading } = parseDescriptionReply(result.text, imageUrl);

  // An upsert, because the same image can be described by two requests at once
  await NarrationImageDescriptions.rawUpdateOne(
    { imageUrl, promptVersion: IMAGE_DESCRIPTION_PROMPT_VERSION },
    { $set: { kind, reading } },
    { upsert: true },
  );
  return reading;
}

/**
 * Gets what a narrator should say for each of the images in a post, writing
 * descriptions for the ones that haven't been described before. A reading is
 * empty if the image shouldn't be narrated: because it's decorative, because
 * it doesn't exist, or because it doesn't have its permanent URL yet.
 */
export async function describeImages(images: ImageToDescribe[], postTitle: string): Promise<string[]> {
  const describableImages = uniqBy(images.filter(image => hasPermanentUrl(image.imageUrl)), image => image.imageUrl);
  const storedDescriptions = await NarrationImageDescriptions.find({
    imageUrl: { $in: describableImages.map(image => image.imageUrl) },
    promptVersion: IMAGE_DESCRIPTION_PROMPT_VERSION,
  }).fetch();
  const storedReadingsByUrl = new Map(storedDescriptions.map(description => [description.imageUrl, description.reading]));

  const newImages = describableImages.filter(image => !storedReadingsByUrl.has(image.imageUrl));
  const newReadings = await executePromiseQueue(
    newImages.map(image => () => describeAndStoreImage(image, postTitle)),
    CONCURRENT_DESCRIPTIONS,
  );
  const newReadingsByUrl = new Map(newImages.map((image, i) => [image.imageUrl, newReadings[i]]));

  return images.map(image => storedReadingsByUrl.get(image.imageUrl) ?? newReadingsByUrl.get(image.imageUrl) ?? "");
}
