import gql from "graphql-tag";
import { z } from "zod";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { accessFilterMultiple, accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanListenToNarration } from "@/lib/collections/posts/helpers";
import { userCanEditNarrationSettings } from "@/lib/collections/users/helpers";
import { isCommentNarratable } from "@/lib/narration/narratableComments";
import {
  AUTHOR_NARRATION_VOICE,
  DEFAULT_NARRATION_MODEL_ID,
  narrationVoiceTuning,
  type NarrationVoiceChoice,
  type NarrationVoiceSettings,
} from "@/lib/narration/narrationTypes";
import { listElevenLabsSpeechModels, NARRATION_AUDIO_CONTENT_TYPE } from "@/server/narration/elevenLabs";
import { synthesizeNamePronunciationPreview } from "@/server/narration/namePronunciation";
import {
  getAuthorVoiceId,
  getNarratedDocument,
  getOrCreateCommentNarrationScript,
  getOrCreateNarrationSegmentAudio,
  getOrCreatePostNarrationScript,
  isFinishedNarrationScript,
  isFinishedNarrationSegmentAudio,
  type NarratedDocument,
} from "@/server/narration/narrationGeneration";
import {
  listAdminListenerVoices,
  listListenerVoices,
  listUserSelectableVoices,
  userCanListenInVoice,
} from "@/server/narration/narrationVoices";

const voiceChoiceSchema = z.object({
  voiceId: z.string().min(1),
  modelId: z.string().min(1),
});

/**
 * The users who have narration (see userHasNarration) can listen to the posts
 * whose pages have the audio button without a podcast episode behind it, and
 * to the comments on those posts. This returns the post if the current user
 * can have it narrated and can read it, and throws otherwise.
 */
async function requireNarratablePost(postId: string|null, context: ResolverContext): Promise<DbPost> {
  const post = postId ? await context.loaders.Posts.load(postId) : null;
  const canReadPost = !!(await accessFilterSingle(context.currentUser, "Posts", post, context));
  if (!post || !canReadPost || !userCanListenToNarration(context.currentUser, post, context.forumType)) {
    throw new Error(`Post ${postId} isn't one that can be narrated`);
  }
  return post;
}

async function requireNarratableComment(commentId: string, context: ResolverContext): Promise<DbComment> {
  const comment = await context.loaders.Comments.load(commentId);
  const canReadComment = !!(await accessFilterSingle(context.currentUser, "Comments", comment, context));
  if (!comment || !canReadComment || !isCommentNarratable(comment)) {
    throw new Error(`Comment ${commentId} isn't one that can be narrated`);
  }
  await requireNarratablePost(comment.postId, context);
  return comment;
}

/**
 * What a script is of, if that's still something that the current user can
 * have narrated. It may not be, although it was when the script was made: a
 * post can be moved back to drafts, and a comment can be deleted.
 */
async function requireNarratableDocument(narrationScript: DbNarrationScript, context: ResolverContext): Promise<NarratedDocument> {
  const narrated = await getNarratedDocument(narrationScript, context);
  if (narrated.collectionName === "Posts") {
    await requireNarratablePost(narrated.post._id, context);
  } else {
    await requireNarratableComment(narrated.comment._id, context);
  }
  return narrated;
}

/** The choices that only admins are offered: the rest of the voices, and the speech model */
async function getAdminNarrationOptions(currentUser: DbUser|null) {
  if (!userIsAdmin(currentUser)) {
    return null;
  }
  return { voices: listAdminListenerVoices(), models: await listElevenLabsSpeechModels() };
}

async function narrationOptionsResolver(_root: void, _args: {}, context: ResolverContext) {
  return { voices: listListenerVoices(), adminOptions: await getAdminNarrationOptions(context.currentUser) };
}

function narrationSelectableVoicesResolver() {
  return listUserSelectableVoices();
}

/**
 * The settings to generate audio with, given what the listener asked to hear
 * a post or a comment read in. Throws if they asked for something that they
 * aren't allowed: only admins can listen in any voice, or choose the model.
 */
async function getVoiceSettings(
  narrated: NarratedDocument,
  requestedVoice: NarrationVoiceChoice,
  context: ResolverContext,
): Promise<NarrationVoiceSettings> {
  const { currentUser } = context;
  const { voiceId: requestedVoiceId, modelId } = voiceChoiceSchema.parse(requestedVoice);
  if (modelId !== DEFAULT_NARRATION_MODEL_ID && !userIsAdmin(currentUser)) {
    throw new Error("Only admins can choose the speech model");
  }
  if (requestedVoiceId === AUTHOR_NARRATION_VOICE) {
    return { voiceId: await getAuthorVoiceId(narrated, context), modelId, ...narrationVoiceTuning };
  }
  if (!userCanListenInVoice(currentUser, requestedVoiceId)) {
    throw new Error(`Voice ${requestedVoiceId} isn't one that you can listen in`);
  }
  return { voiceId: requestedVoiceId, modelId, ...narrationVoiceTuning };
}

async function narrationSegmentAudiosResolver(
  _root: void,
  { narrationScriptId, voice }: { narrationScriptId: string, voice: NarrationVoiceChoice },
  context: ResolverContext,
) {
  const narrationScript = await context.NarrationScripts.findOne({ _id: narrationScriptId });
  if (!narrationScript) {
    throw new Error(`Narration script ${narrationScriptId} not found`);
  }
  const narrated = await requireNarratableDocument(narrationScript, context);
  const segments = await context.NarrationSegments.find({ narrationScriptId }, {}, { _id: 1 }).fetch();
  const audios = await context.NarrationSegmentAudios.find({
    narrationSegmentId: { $in: segments.map(segment => segment._id) },
    ...await getVoiceSettings(narrated, voice, context),
  }).fetch();
  return await accessFilterMultiple(context.currentUser, "NarrationSegmentAudios", audios.filter(isFinishedNarrationSegmentAudio), context);
}

async function prepareNarrationResolver(_root: void, { postId }: { postId: string }, context: ResolverContext) {
  const post = await requireNarratablePost(postId, context);
  const narrationScript = await getOrCreatePostNarrationScript(post, context);
  return await accessFilterSingle(context.currentUser, "NarrationScripts", narrationScript, context);
}

async function prepareCommentNarrationResolver(_root: void, { commentId }: { commentId: string }, context: ResolverContext) {
  const comment = await requireNarratableComment(commentId, context);
  const narrationScript = await getOrCreateCommentNarrationScript(comment, context);
  return await accessFilterSingle(context.currentUser, "NarrationScripts", narrationScript, context);
}

async function generateNarrationSegmentAudioResolver(
  _root: void,
  { narrationSegmentId, voice }: { narrationSegmentId: string, voice: NarrationVoiceChoice },
  context: ResolverContext,
) {
  const segment = await context.NarrationSegments.findOne({ _id: narrationSegmentId });
  const narrationScript = segment ? await context.NarrationScripts.findOne({ _id: segment.narrationScriptId }) : null;
  if (!segment || !narrationScript || !isFinishedNarrationScript(narrationScript)) {
    throw new Error(`Narration segment ${narrationSegmentId} not found`);
  }
  const narrated = await requireNarratableDocument(narrationScript, context);
  const voiceSettings = await getVoiceSettings(narrated, voice, context);
  const audio = await getOrCreateNarrationSegmentAudio(segment, narrationScript, voiceSettings, context.currentUser);
  return await accessFilterSingle(context.currentUser, "NarrationSegmentAudios", audio, context);
}

/**
 * Lets whoever is setting how a user's name is pronounced hear what they've
 * entered before they save it. The audio comes back as a data: URL.
 */
async function previewNarrationNamePronunciationResolver(
  _root: void,
  { userId, pronunciation }: { userId: string, pronunciation: string },
  context: ResolverContext,
) {
  const user = await context.loaders.Users.load(userId);
  if (!user || !userCanEditNarrationSettings(context.currentUser, user)) {
    throw new Error(`You can't set how user ${userId}'s name is pronounced`);
  }
  const audio = await synthesizeNamePronunciationPreview(user, pronunciation, context.forumType);
  return `data:${NARRATION_AUDIO_CONTENT_TYPE};base64,${audio.toString("base64")}`;
}

export const narrationGraphQLTypeDefs = gql`
  type NarrationVoice {
    voiceId: String!
    name: String!
    description: String!
    previewUrl: String!
  }

  type NarrationModel {
    modelId: String!
    name: String!
    description: String
  }

  type NarrationAdminOptions {
    voices: [NarrationVoice!]!
    models: [NarrationModel!]!
  }

  type NarrationOptions {
    voices: [NarrationVoice!]!
    adminOptions: NarrationAdminOptions
  }

  input NarrationVoiceChoiceInput {
    voiceId: String!
    modelId: String!
  }

  extend type Query {
    narrationOptions: NarrationOptions!
    narrationSelectableVoices: [NarrationVoice!]!
    narrationSegmentAudios(narrationScriptId: String!, voice: NarrationVoiceChoiceInput!): [NarrationSegmentAudio!]!
  }

  extend type Mutation {
    prepareNarration(postId: String!): NarrationScript!
    prepareCommentNarration(commentId: String!): NarrationScript!
    generateNarrationSegmentAudio(narrationSegmentId: String!, voice: NarrationVoiceChoiceInput!): NarrationSegmentAudio!
    previewNarrationNamePronunciation(userId: String!, pronunciation: String!): String!
  }
`;

export const narrationGraphQLQueries = {
  narrationOptions: narrationOptionsResolver,
  narrationSelectableVoices: narrationSelectableVoicesResolver,
  narrationSegmentAudios: narrationSegmentAudiosResolver,
};

export const narrationGraphQLMutations = {
  prepareNarration: prepareNarrationResolver,
  prepareCommentNarration: prepareCommentNarrationResolver,
  generateNarrationSegmentAudio: generateNarrationSegmentAudioResolver,
  previewNarrationNamePronunciation: previewNarrationNamePronunciationResolver,
};
