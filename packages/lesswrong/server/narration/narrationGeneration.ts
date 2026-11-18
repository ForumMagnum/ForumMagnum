import { put } from "@vercel/blob";
import { randomId } from "@/lib/random";
import { postGetAuthorName } from "@/lib/collections/posts/helpers";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { isCommentNarratable } from "@/lib/narration/narratableComments";
import type { NarrationScript, NarrationVoiceSettings } from "@/lib/narration/narrationTypes";
import NarrationScripts from "@/server/collections/narrationScripts/collection";
import NarrationSegments from "@/server/collections/narrationSegments/collection";
import NarrationSegmentAudios from "@/server/collections/narrationSegmentAudios/collection";
import { synthesizeSpeechWithTimestamps } from "./elevenLabs";
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

async function getPostAuthorNames(post: DbPost, context: ResolverContext): Promise<string[]> {
  const coauthorUserIds = post.coauthorUserIds ?? [];
  const coauthors = await context.Users.find({ _id: { $in: coauthorUserIds } }).fetch();
  const coauthorNames = coauthorUserIds.flatMap(userId => {
    const coauthor = coauthors.find(user => user._id === userId);
    return coauthor ? [userGetDisplayName(coauthor, context.forumType)] : [];
  });
  return [await postGetAuthorName(post, context), ...coauthorNames];
}

/**
 * A script is shared by everyone who listens, so it only names a user whose
 * account anyone can see. (A deleted account's name is hidden from most.)
 */
async function getSpokenUserName(user: DbUser, context: ResolverContext): Promise<string> {
  const userAsSeenByAnyone = await accessFilterSingle(null, "Users", user, context);
  return userAsSeenByAnyone ? userGetDisplayName(user, context.forumType) : "an anonymous user";
}

async function getCommentIntroductionFor(comment: DbComment, context: ResolverContext): Promise<string> {
  const author = await context.loaders.Users.load(comment.userId);
  if (!author) {
    throw new Error(`Comment ${comment._id} has no author`);
  }
  const parentComment = comment.parentCommentId ? await context.loaders.Comments.load(comment.parentCommentId) : null;
  const parentAuthor = (parentComment && isCommentNarratable(parentComment))
    ? await context.loaders.Users.load(parentComment.userId)
    : null;
  return getCommentIntroduction(
    await getSpokenUserName(author, context),
    !!comment.parentCommentId,
    parentAuthor ? await getSpokenUserName(parentAuthor, context) : null,
  );
}

async function getCommentDocumentInfo(comment: DbComment, context: ResolverContext): Promise<NarrationDocumentInfo> {
  const post = comment.postId ? await context.loaders.Posts.load(comment.postId) : null;
  return {
    introduction: await getCommentIntroductionFor(comment, context),
    postTitle: post?.title ?? "",
  };
}

async function getPostDocumentInfo(post: DbPost, context: ResolverContext): Promise<NarrationDocumentInfo> {
  return {
    introduction: getPostIntroduction(post.title, await getPostAuthorNames(post, context)),
    postTitle: post.title,
  };
}

function findNarrationScript(revisionId: string): Promise<DbNarrationScript|null> {
  return NarrationScripts.findOne({ revisionId, preprocessorVersion: NARRATION_PREPROCESSOR_VERSION });
}

async function createNarrationScript(revisionId: string, documentInfo: NarrationDocumentInfo, context: ResolverContext): Promise<DbNarrationScript> {
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

  // The script's own record is written last, so that a script that can be
  // found always has all of its segments.
  const narrationScriptId = randomId();
  await NarrationSegments.rawInsertMany(segments.map((segment, segmentIndex) => ({
    narrationScriptId,
    segmentIndex,
    ...segment,
  })));
  await NarrationScripts.rawInsert({ _id: narrationScriptId, revisionId, preprocessorVersion: NARRATION_PREPROCESSOR_VERSION, scriptUrl });

  const narrationScript = await NarrationScripts.findOne({ _id: narrationScriptId });
  if (!narrationScript) {
    throw new Error(`Narration script ${narrationScriptId} is missing after being created`);
  }
  return narrationScript;
}

/**
 * Gets the narration script for the current revision of a post, creating it
 * (and the records of the segments it divides into) if this revision hasn't
 * been narrated before.
 */
export async function getOrCreatePostNarrationScript(post: DbPost, context: ResolverContext): Promise<DbNarrationScript> {
  const revisionId = post.contents_latest;
  if (!revisionId) {
    throw new Error(`Post ${post._id} has no contents to narrate`);
  }
  return await findNarrationScript(revisionId)
    ?? await createNarrationScript(revisionId, await getPostDocumentInfo(post, context), context);
}

/** The same, for a comment. A comment's script begins by saying whose comment it is. */
export async function getOrCreateCommentNarrationScript(comment: DbComment, context: ResolverContext): Promise<DbNarrationScript> {
  const revisionId = comment.contents_latest;
  if (!revisionId || !isCommentNarratable(comment)) {
    throw new Error(`Comment ${comment._id} can't be narrated`);
  }
  return await findNarrationScript(revisionId)
    ?? await createNarrationScript(revisionId, await getCommentDocumentInfo(comment, context), context);
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

/**
 * Gets the audio for a segment as spoken with the given settings, generating
 * it if it hasn't been generated with those settings before.
 */
export async function getOrCreateNarrationSegmentAudio(
  segment: DbNarrationSegment,
  narrationScript: DbNarrationScript,
  settings: NarrationVoiceSettings,
  currentUser: DbUser,
): Promise<DbNarrationSegmentAudio> {
  const audioSelector = { narrationSegmentId: segment._id, ...settings };
  const existingAudio = await NarrationSegmentAudios.findOne(audioSelector);
  if (existingAudio) {
    return existingAudio;
  }

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

  const audioId = await NarrationSegmentAudios.rawInsert({
    ...audioSelector,
    userId: currentUser._id,
    audioUrl,
    timingsUrl,
    durationMs,
    billedCharacters: speech.billedCharacters,
    elevenLabsRequestId: speech.requestId,
  });
  const audio = await NarrationSegmentAudios.findOne({ _id: audioId });
  if (!audio) {
    throw new Error(`Narration segment audio ${audioId} is missing after being created`);
  }
  return audio;
}
