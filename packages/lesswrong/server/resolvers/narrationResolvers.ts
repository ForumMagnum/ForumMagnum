import gql from "graphql-tag";
import { z } from "zod";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { accessFilterMultiple, accessFilterSingle } from "@/lib/utils/schemaUtils";
import {
  AUTHOR_NARRATION_VOICE,
  DEFAULT_NARRATION_MODEL_ID,
  narrationVoiceTuning,
  type NarrationVoiceChoice,
  type NarrationVoiceSettings,
} from "@/lib/narration/narrationTypes";
import { listElevenLabsSpeechModels } from "@/server/narration/elevenLabs";
import {
  getAuthorVoiceId,
  getOrCreateCommentNarrationScript,
  getOrCreateNarrationSegmentAudio,
  getOrCreatePostNarrationScript,
  isFinishedNarrationScript,
  isFinishedNarrationSegmentAudio,
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

function requireNarrationAccess(context: ResolverContext): DbUser {
  const { currentUser } = context;
  if (!userIsAdmin(currentUser)) {
    throw new Error("Narration is only available to admins");
  }
  return currentUser;
}

/** The choices that only admins are offered: the rest of the voices, and the speech model */
async function getAdminNarrationOptions(currentUser: DbUser) {
  if (!userIsAdmin(currentUser)) {
    return null;
  }
  return { voices: listAdminListenerVoices(), models: await listElevenLabsSpeechModels() };
}

async function narrationOptionsResolver(_root: void, _args: {}, context: ResolverContext) {
  const currentUser = requireNarrationAccess(context);
  return { voices: listListenerVoices(), adminOptions: await getAdminNarrationOptions(currentUser) };
}

function narrationSelectableVoicesResolver(_root: void, _args: {}, context: ResolverContext) {
  requireNarrationAccess(context);
  return listUserSelectableVoices();
}

/**
 * The settings to generate audio with, given what the listener asked to hear
 * a script read in. Throws if they asked for something that they aren't
 * allowed: only admins can listen in any voice, or choose the model.
 */
async function getVoiceSettings(
  narrationScript: DbNarrationScript,
  requestedVoice: NarrationVoiceChoice,
  currentUser: DbUser,
  context: ResolverContext,
): Promise<NarrationVoiceSettings> {
  const { voiceId: requestedVoiceId, modelId } = voiceChoiceSchema.parse(requestedVoice);
  if (modelId !== DEFAULT_NARRATION_MODEL_ID && !userIsAdmin(currentUser)) {
    throw new Error("Only admins can choose the speech model");
  }
  if (requestedVoiceId === AUTHOR_NARRATION_VOICE) {
    return { voiceId: await getAuthorVoiceId(narrationScript, context), modelId, ...narrationVoiceTuning };
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
  const currentUser = requireNarrationAccess(context);
  const narrationScript = await context.NarrationScripts.findOne({ _id: narrationScriptId });
  if (!narrationScript) {
    throw new Error(`Narration script ${narrationScriptId} not found`);
  }
  const segments = await context.NarrationSegments.find({ narrationScriptId }, {}, { _id: 1 }).fetch();
  const audios = await context.NarrationSegmentAudios.find({
    narrationSegmentId: { $in: segments.map(segment => segment._id) },
    ...await getVoiceSettings(narrationScript, voice, currentUser, context),
  }).fetch();
  return await accessFilterMultiple(currentUser, "NarrationSegmentAudios", audios.filter(isFinishedNarrationSegmentAudio), context);
}

async function prepareNarrationResolver(_root: void, { postId }: { postId: string }, context: ResolverContext) {
  const currentUser = requireNarrationAccess(context);
  const post = await context.loaders.Posts.load(postId);
  const canReadPost = !!(await accessFilterSingle(currentUser, "Posts", post, context));
  if (!post || !canReadPost) {
    throw new Error(`Post ${postId} not found`);
  }
  const narrationScript = await getOrCreatePostNarrationScript(post, context);
  return await accessFilterSingle(currentUser, "NarrationScripts", narrationScript, context);
}

async function prepareCommentNarrationResolver(_root: void, { commentId }: { commentId: string }, context: ResolverContext) {
  const currentUser = requireNarrationAccess(context);
  const comment = await context.loaders.Comments.load(commentId);
  const canReadComment = !!(await accessFilterSingle(currentUser, "Comments", comment, context));
  if (!comment || !canReadComment) {
    throw new Error(`Comment ${commentId} not found`);
  }
  const narrationScript = await getOrCreateCommentNarrationScript(comment, context);
  return await accessFilterSingle(currentUser, "NarrationScripts", narrationScript, context);
}

async function generateNarrationSegmentAudioResolver(
  _root: void,
  { narrationSegmentId, voice }: { narrationSegmentId: string, voice: NarrationVoiceChoice },
  context: ResolverContext,
) {
  const currentUser = requireNarrationAccess(context);
  const segment = await context.NarrationSegments.findOne({ _id: narrationSegmentId });
  const narrationScript = segment ? await context.NarrationScripts.findOne({ _id: segment.narrationScriptId }) : null;
  if (!segment || !narrationScript || !isFinishedNarrationScript(narrationScript)) {
    throw new Error(`Narration segment ${narrationSegmentId} not found`);
  }
  const voiceSettings = await getVoiceSettings(narrationScript, voice, currentUser, context);
  const audio = await getOrCreateNarrationSegmentAudio(segment, narrationScript, voiceSettings, currentUser);
  return await accessFilterSingle(currentUser, "NarrationSegmentAudios", audio, context);
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
};
