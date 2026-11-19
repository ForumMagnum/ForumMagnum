import { put } from "@vercel/blob";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { loadByIds } from "@/lib/loaders";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { isCommentNarratable } from "@/lib/narration/narratableComments";
import type { NarrationScript, NarrationVoiceSettings } from "@/lib/narration/narrationTypes";
import NarrationScripts from "@/server/collections/narrationScripts/collection";
import NarrationSegments from "@/server/collections/narrationSegments/collection";
import NarrationSegmentAudios from "@/server/collections/narrationSegmentAudios/collection";
import { synthesizeSpeechWithTimestamps } from "./elevenLabs";
import { getOrGenerate, type ClaimedGeneration } from "./generationClaims";
import {
  buildNarrationScript,
  getCommentIntroduction,
  getNarrationSegmentText,
  getPostIntroduction,
  NARRATION_PREPROCESSOR_VERSION,
  type NarrationDocumentInfo,
} from "./narrationScript";
import { buildSegmentTimings } from "./narrationTimings";
import { getUserNarrationVoiceSettings } from "./narrationVoices";

/** How much of the text before and after a segment the speech model is given as context */
const CONTEXT_CHARACTERS = 1000;
/** What's said in place of the name of an author who isn't shown */
const ANONYMOUS_AUTHOR_NAME = "an anonymous user";
/** Building a script can mean describing dozens of images and reading out hundreds of equations */
const SCRIPT_ABANDONED_AFTER_MS = 5 * 60 * 1000;
const SEGMENT_AUDIO_ABANDONED_AFTER_MS = 2 * 60 * 1000;

export interface FinishedNarrationScript extends DbNarrationScript {
  scriptUrl: string
}

export interface FinishedNarrationSegmentAudio extends DbNarrationSegmentAudio {
  audioUrl: string
  timingsUrl: string
  durationMs: number
}

interface NarrationScriptKey {
  revisionId: string
  documentInfo: NarrationDocumentInfo
  context: ResolverContext
}

interface SegmentAudioKey {
  segment: DbNarrationSegment
  narrationScript: FinishedNarrationScript
  settings: NarrationVoiceSettings
  currentUser: DbUser
}

async function storeNarrationFile(pathname: string, body: string|Buffer, contentType: string): Promise<string> {
  const { url } = await put(pathname, body, { access: "public", contentType, addRandomSuffix: true });
  return url;
}

async function fetchNarrationScript(scriptUrl: string): Promise<NarrationScript> {
  const response = await fetch(scriptUrl);
  if (!response.ok) {
    throw new Error(`Fetching narration script ${scriptUrl} failed with status ${response.status}`);
  }
  const script: NarrationScript = await response.json();
  return script;
}

/**
 * A user's name, if anyone may see whose account it is. (A deleted account's
 * name is hidden from most.) Scripts are shared by everyone who listens, so
 * they only name people that every listener could see named on the page.
 */
async function getPublicUserName(user: DbUser|null, context: ResolverContext): Promise<string|null> {
  const userAsSeenByAnyone = await accessFilterSingle(null, "Users", user, context);
  return (user && userAsSeenByAnyone) ? userGetDisplayName(user, context.forumType) : null;
}

async function getSpokenAuthorName(author: DbUser|null, context: ResolverContext): Promise<string> {
  return await getPublicUserName(author, context) ?? ANONYMOUS_AUTHOR_NAME;
}

/**
 * The names in a post's byline, as its page shows it to anyone (see
 * PostsAuthors): the author, unless the post hides its author or the author's
 * account isn't visible, and then the coauthors whose accounts are visible.
 */
async function getPublicBylineNames(post: DbPost, context: ResolverContext): Promise<string[]> {
  const [author, ...coauthors] = await loadByIds(context, "Users", [post.userId, ...post.coauthorUserIds]);
  const authorName = post.hideAuthor ? ANONYMOUS_AUTHOR_NAME : await getSpokenAuthorName(author, context);
  const coauthorNames = await Promise.all(coauthors.map(coauthor => getPublicUserName(coauthor, context)));
  return [authorName, ...coauthorNames.flatMap(name => name ? [name] : [])];
}

async function getPostDocumentInfo(post: DbPost, context: ResolverContext): Promise<NarrationDocumentInfo> {
  return {
    introduction: getPostIntroduction(post.title, await getPublicBylineNames(post, context)),
    postTitle: post.title,
  };
}

async function getCommentDocumentInfo(comment: DbComment, context: ResolverContext): Promise<NarrationDocumentInfo> {
  const [author, parentComment, post] = await Promise.all([
    context.loaders.Users.load(comment.userId),
    comment.parentCommentId ? context.loaders.Comments.load(comment.parentCommentId) : null,
    comment.postId ? context.loaders.Posts.load(comment.postId) : null,
  ]);
  if (!author) {
    throw new Error(`Comment ${comment._id} has no author`);
  }
  const parentAuthor = (parentComment && isCommentNarratable(parentComment))
    ? await context.loaders.Users.load(parentComment.userId)
    : null;
  return {
    introduction: getCommentIntroduction(
      comment,
      await getSpokenAuthorName(author, context),
      parentAuthor ? await getSpokenAuthorName(parentAuthor, context) : null,
    ),
    postTitle: post?.title ?? "",
  };
}

function getScriptSelector({ revisionId, documentInfo }: NarrationScriptKey) {
  return {
    revisionId,
    preprocessorVersion: NARRATION_PREPROCESSOR_VERSION,
    introduction: documentInfo.introduction,
  };
}

export function isFinishedNarrationScript(narrationScript: DbNarrationScript): narrationScript is FinishedNarrationScript {
  return narrationScript.scriptUrl !== null;
}

async function claimScript(key: NarrationScriptKey): Promise<DbNarrationScript> {
  const narrationScriptId = await NarrationScripts.rawInsert({ ...getScriptSelector(key), scriptUrl: null }, { quiet: true });
  const claimedScript = await NarrationScripts.findOne({ _id: narrationScriptId });
  if (!claimedScript) {
    throw new Error(`Narration script ${narrationScriptId} is missing after being created`);
  }
  return claimedScript;
}

async function buildAndStoreScript(
  claimedScript: DbNarrationScript,
  { revisionId, documentInfo, context }: NarrationScriptKey,
): Promise<FinishedNarrationScript|null> {
  const revision = await context.Revisions.findOne({ _id: revisionId });
  if (!revision?.html) {
    throw new Error(`Revision ${revisionId} has no html`);
  }
  const { script, segments } = await buildNarrationScript(revision.html, documentInfo);
  const scriptUrl = await storeNarrationFile(
    `narration/${revisionId}/script-v${NARRATION_PREPROCESSOR_VERSION}.json`,
    JSON.stringify(script),
    "application/json",
  );
  await NarrationSegments.rawInsertMany(segments.map((segment, segmentIndex) => ({
    narrationScriptId: claimedScript._id,
    segmentIndex,
    ...segment,
  })));

  // Setting the URL is what finishes the script, and it's done last, so that
  // a finished script always has all of its segments.
  const stillClaimed = await NarrationScripts.rawUpdateOne({ _id: claimedScript._id, scriptUrl: null }, { $set: { scriptUrl } });
  if (!stillClaimed) {
    await NarrationSegments.rawRemove({ narrationScriptId: claimedScript._id });
    return null;
  }
  return { ...claimedScript, scriptUrl };
}

async function abandonScript(narrationScript: DbNarrationScript) {
  await NarrationScripts.rawRemove({ _id: narrationScript._id, scriptUrl: null });
  const finishedInTheMeantime = await NarrationScripts.findOne({ _id: narrationScript._id });
  if (!finishedInTheMeantime) {
    await NarrationSegments.rawRemove({ narrationScriptId: narrationScript._id });
  }
}

const scriptGeneration: ClaimedGeneration<NarrationScriptKey, DbNarrationScript, FinishedNarrationScript> = {
  findEntry: key => NarrationScripts.findOne(getScriptSelector(key)),
  isFinished: isFinishedNarrationScript,
  claimEntry: claimScript,
  finishEntry: buildAndStoreScript,
  abandonEntry: abandonScript,
  abandonedAfterMs: SCRIPT_ABANDONED_AFTER_MS,
};

/**
 * Gets the narration script for the current revision of a post, creating it
 * (and the records of the segments it divides into) if there isn't one. A
 * script is for one revision and one introduction, so a post gets a new one
 * when its text changes, and also when its title or byline does.
 */
export async function getOrCreatePostNarrationScript(post: DbPost, context: ResolverContext): Promise<FinishedNarrationScript> {
  const revisionId = post.contents_latest;
  if (!revisionId) {
    throw new Error(`Post ${post._id} has no contents to narrate`);
  }
  return await getOrGenerate(scriptGeneration, { revisionId, documentInfo: await getPostDocumentInfo(post, context), context });
}

/** The same, for a comment. A comment's script begins by saying whose comment it is. */
export async function getOrCreateCommentNarrationScript(comment: DbComment, context: ResolverContext): Promise<FinishedNarrationScript> {
  const revisionId = comment.contents_latest;
  if (!revisionId || !isCommentNarratable(comment)) {
    throw new Error(`Comment ${comment._id} can't be narrated`);
  }
  return await getOrGenerate(scriptGeneration, { revisionId, documentInfo: await getCommentDocumentInfo(comment, context), context });
}

/**
 * A comment is always read in its author's voice. Returns that voice if the
 * script is a comment's, and null if it's a post's, which is read in whatever
 * voice the listener chooses.
 */
export async function getCommentAuthorVoiceSettings(narrationScript: DbNarrationScript, context: ResolverContext): Promise<NarrationVoiceSettings|null> {
  const revision = await context.loaders.Revisions.load(narrationScript.revisionId);
  if (revision?.collectionName !== "Comments" || !revision.documentId) {
    return null;
  }
  const comment = await context.loaders.Comments.load(revision.documentId);
  const author = comment ? await context.loaders.Users.load(comment.userId) : null;
  if (!comment || !author || !isCommentNarratable(comment)) {
    throw new Error(`Comment ${revision.documentId} can't be narrated`);
  }
  return await getUserNarrationVoiceSettings(author);
}

function getSegmentAudioSelector({ segment, settings }: SegmentAudioKey) {
  return { narrationSegmentId: segment._id, ...settings };
}

export function isFinishedNarrationSegmentAudio(audio: DbNarrationSegmentAudio): audio is FinishedNarrationSegmentAudio {
  return audio.audioUrl !== null && audio.timingsUrl !== null && audio.durationMs !== null;
}

async function claimSegmentAudio(key: SegmentAudioKey): Promise<DbNarrationSegmentAudio> {
  const audioId = await NarrationSegmentAudios.rawInsert({
    ...getSegmentAudioSelector(key),
    userId: key.currentUser._id,
    audioUrl: null,
    timingsUrl: null,
    durationMs: null,
    billedCharacters: null,
    elevenLabsRequestId: null,
  }, { quiet: true });
  const claimedAudio = await NarrationSegmentAudios.findOne({ _id: audioId });
  if (!claimedAudio) {
    throw new Error(`Narration segment audio ${audioId} is missing after being created`);
  }
  return claimedAudio;
}

async function synthesizeAndStoreSegmentAudio(
  claimedAudio: DbNarrationSegmentAudio,
  { segment, narrationScript, settings }: SegmentAudioKey,
): Promise<FinishedNarrationSegmentAudio|null> {
  const { blocks } = await fetchNarrationScript(narrationScript.scriptUrl);
  const segmentBlocks = blocks.slice(segment.startBlockIndex, segment.endBlockIndex);
  const segmentText = getNarrationSegmentText(segmentBlocks);

  const speech = await synthesizeSpeechWithTimestamps({
    text: segmentText,
    previousText: getNarrationSegmentText(blocks.slice(0, segment.startBlockIndex)).slice(-CONTEXT_CHARACTERS) || null,
    nextText: getNarrationSegmentText(blocks.slice(segment.endBlockIndex)).slice(0, CONTEXT_CHARACTERS) || null,
    settings,
  });
  const { timings, durationMs } = buildSegmentTimings(segmentBlocks, segment.startBlockIndex, segmentText, speech.alignment);

  const filePrefix = `narration/${narrationScript.revisionId}/segment-${segment.segmentIndex}`;
  const [audioUrl, timingsUrl] = await Promise.all([
    storeNarrationFile(`${filePrefix}.mp3`, speech.audio, "audio/mpeg"),
    storeNarrationFile(`${filePrefix}-timings.json`, JSON.stringify(timings), "application/json"),
  ]);

  const results = {
    audioUrl,
    timingsUrl,
    durationMs,
    billedCharacters: speech.billedCharacters,
    elevenLabsRequestId: speech.requestId,
  };
  const stillClaimed = await NarrationSegmentAudios.rawUpdateOne({ _id: claimedAudio._id, audioUrl: null }, { $set: results });
  return stillClaimed ? { ...claimedAudio, ...results } : null;
}

async function abandonSegmentAudio(audio: DbNarrationSegmentAudio) {
  await NarrationSegmentAudios.rawRemove({ _id: audio._id, audioUrl: null });
}

const segmentAudioGeneration: ClaimedGeneration<SegmentAudioKey, DbNarrationSegmentAudio, FinishedNarrationSegmentAudio> = {
  findEntry: key => NarrationSegmentAudios.findOne(getSegmentAudioSelector(key)),
  isFinished: isFinishedNarrationSegmentAudio,
  claimEntry: claimSegmentAudio,
  finishEntry: synthesizeAndStoreSegmentAudio,
  abandonEntry: abandonSegmentAudio,
  abandonedAfterMs: SEGMENT_AUDIO_ABANDONED_AFTER_MS,
};

/**
 * Gets the audio for a segment as spoken with the given settings, generating
 * it if it hasn't been generated with those settings before.
 */
export function getOrCreateNarrationSegmentAudio(
  segment: DbNarrationSegment,
  narrationScript: FinishedNarrationScript,
  settings: NarrationVoiceSettings,
  currentUser: DbUser,
): Promise<FinishedNarrationSegmentAudio> {
  return getOrGenerate(segmentAudioGeneration, { segment, narrationScript, settings, currentUser });
}
