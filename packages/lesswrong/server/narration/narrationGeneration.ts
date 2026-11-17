import { put } from "@vercel/blob";
import { randomId } from "@/lib/random";
import { postGetAuthorName } from "@/lib/collections/posts/helpers";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import type { NarrationScript, NarrationVoiceSettings } from "@/lib/narration/narrationTypes";
import NarrationScripts from "@/server/collections/narrationScripts/collection";
import NarrationSegments from "@/server/collections/narrationSegments/collection";
import NarrationSegmentAudios from "@/server/collections/narrationSegmentAudios/collection";
import { synthesizeSpeechWithTimestamps } from "./elevenLabs";
import { buildNarrationScript, getNarrationSegmentText, NARRATION_PREPROCESSOR_VERSION } from "./narrationScript";
import { buildSegmentTimings } from "./narrationTimings";

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
 * Gets the narration script for the current revision of a post, creating it
 * (and the records of the segments it divides into) if this revision hasn't
 * been narrated before.
 */
export async function getOrCreateNarrationScript(post: DbPost, context: ResolverContext): Promise<DbNarrationScript> {
  const revisionId = post.contents_latest;
  if (!revisionId) {
    throw new Error(`Post ${post._id} has no contents to narrate`);
  }
  const scriptSelector = { revisionId, preprocessorVersion: NARRATION_PREPROCESSOR_VERSION };
  const existingScript = await NarrationScripts.findOne(scriptSelector);
  if (existingScript) {
    return existingScript;
  }

  const revision = await context.Revisions.findOne({ _id: revisionId });
  if (!revision?.html) {
    throw new Error(`Revision ${revisionId} of post ${post._id} has no html`);
  }
  const { script, segments } = await buildNarrationScript(revision.html, {
    title: post.title,
    authorNames: await getPostAuthorNames(post, context),
  });
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
  await NarrationScripts.rawInsert({ _id: narrationScriptId, ...scriptSelector, scriptUrl });

  const narrationScript = await NarrationScripts.findOne({ _id: narrationScriptId });
  if (!narrationScript) {
    throw new Error(`Narration script ${narrationScriptId} is missing after being created`);
  }
  return narrationScript;
}

/**
 * Gets the audio for a segment as spoken with the given settings, generating
 * it if it hasn't been generated with those settings before.
 */
export async function getOrCreateNarrationSegmentAudio(
  segment: DbNarrationSegment,
  settings: NarrationVoiceSettings,
  currentUser: DbUser,
): Promise<DbNarrationSegmentAudio> {
  const audioSelector = { narrationSegmentId: segment._id, ...settings };
  const existingAudio = await NarrationSegmentAudios.findOne(audioSelector);
  if (existingAudio) {
    return existingAudio;
  }

  const narrationScript = await NarrationScripts.findOne({ _id: segment.narrationScriptId });
  if (!narrationScript) {
    throw new Error(`Narration segment ${segment._id} belongs to a script that doesn't exist`);
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
