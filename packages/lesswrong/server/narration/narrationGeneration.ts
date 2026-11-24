import { put } from "@vercel/blob";
import { loadByIds } from "@/lib/loaders";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { isCommentNarratable } from "@/lib/narration/narratableComments";
import type { NarrationScript, NarrationVoiceSettings } from "@/lib/narration/narrationTypes";
import NarrationScripts from "@/server/collections/narrationScripts/collection";
import NarrationSegments from "@/server/collections/narrationSegments/collection";
import NarrationSegmentAudios from "@/server/collections/narrationSegmentAudios/collection";
import { NARRATION_AUDIO_CONTENT_TYPE, synthesizeSpeechWithTimestamps } from "./elevenLabs";
import { getOrGenerate, type ClaimedGeneration } from "./generationClaims";
import { getSpokenUserName } from "./namePronunciation";
import {
  buildNarrationScript,
  getCommentIntroduction,
  getNarrationSegmentText,
  getPostIntroduction,
  NARRATION_PREPROCESSOR_VERSION,
  type NarrationDocumentInfo,
} from "./narrationScript";
import { buildSegmentTimings } from "./narrationTimings";
import { getDefaultListenerVoiceId, getUserNarrationVoiceId } from "./narrationVoices";

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
  /** Whose request this is. Null if they aren't logged in. */
  currentUser: DbUser|null
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
 * A user, if anyone may see whose account it is. (A deleted account is hidden
 * from most.) Narration is shared by everyone who listens, so it only gives
 * away who someone is, by their name or by their voice, if every listener
 * could see that on the page.
 */
async function getPubliclyVisibleUser(user: DbUser|null, context: ResolverContext): Promise<DbUser|null> {
  const userAsSeenByAnyone = await accessFilterSingle(null, "Users", user, context);
  return userAsSeenByAnyone ? user : null;
}

/**
 * The author that the page says a post or a comment is by (see PostsAuthors
 * and CommentUserName). Null if it hides its author, or the author's account
 * isn't visible.
 */
async function getShownAuthor(document: Pick<DbPost|DbComment, "userId"|"hideAuthor">, context: ResolverContext): Promise<DbUser|null> {
  const author = document.hideAuthor ? null : await context.loaders.Users.load(document.userId);
  return await getPubliclyVisibleUser(author, context);
}

/** What a script calls an author: their name, or if the page doesn't show who they are (`shownAuthor` is null), nobody in particular */
function getSpokenAuthorName(shownAuthor: DbUser|null, context: ResolverContext): string {
  return shownAuthor ? getSpokenUserName(shownAuthor, context.forumType) : ANONYMOUS_AUTHOR_NAME;
}

/**
 * The names in a post's byline, as its page shows it to anyone: the author,
 * and then the coauthors whose accounts are visible.
 */
async function getPublicBylineNames(post: DbPost, context: ResolverContext): Promise<string[]> {
  const coauthors = await loadByIds(context, "Users", post.coauthorUserIds);
  const shownCoauthors = await Promise.all(coauthors.map(coauthor => getPubliclyVisibleUser(coauthor, context)));
  return [
    getSpokenAuthorName(await getShownAuthor(post, context), context),
    ...shownCoauthors.flatMap(coauthor => coauthor ? [getSpokenUserName(coauthor, context.forumType)] : []),
  ];
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
      getSpokenAuthorName(await getPubliclyVisibleUser(author, context), context),
      parentAuthor ? getSpokenAuthorName(await getPubliclyVisibleUser(parentAuthor, context), context) : null,
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

/** What a script is of: a post, or a comment */
export type NarratedDocument =
  | { collectionName: "Posts", post: DbPost }
  | { collectionName: "Comments", comment: DbComment };

export async function getNarratedDocument(narrationScript: DbNarrationScript, context: ResolverContext): Promise<NarratedDocument> {
  const revision = await context.loaders.Revisions.load(narrationScript.revisionId);
  const documentId = revision?.documentId;
  const post = (documentId && revision.collectionName === "Posts") ? await context.loaders.Posts.load(documentId) : null;
  const comment = (documentId && revision.collectionName === "Comments") ? await context.loaders.Comments.load(documentId) : null;
  if (post) {
    return { collectionName: "Posts", post };
  }
  if (comment) {
    return { collectionName: "Comments", comment };
  }
  throw new Error(`The post or comment that narration script ${narrationScript._id} is of wasn't found`);
}

/**
 * The voice to read a post or a comment in, for a listener who asked to hear
 * things in their authors' voices. A user's voice says who they are as surely
 * as their name does, so if the page doesn't show who the author is, this is
 * the default voice instead.
 */
export async function getAuthorVoiceId(narrated: NarratedDocument, context: ResolverContext): Promise<string> {
  const document = narrated.collectionName === "Posts" ? narrated.post : narrated.comment;
  const shownAuthor = await getShownAuthor(document, context);
  return shownAuthor ? await getUserNarrationVoiceId(shownAuthor) : getDefaultListenerVoiceId();
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
    userId: key.currentUser?._id ?? null,
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
    storeNarrationFile(`${filePrefix}.mp3`, speech.audio, NARRATION_AUDIO_CONTENT_TYPE),
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
  currentUser: DbUser|null,
): Promise<FinishedNarrationSegmentAudio> {
  return getOrGenerate(segmentAudioGeneration, { segment, narrationScript, settings, currentUser });
}
