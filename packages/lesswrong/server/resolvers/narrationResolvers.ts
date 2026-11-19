import gql from "graphql-tag";
import { z } from "zod";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { accessFilterMultiple, accessFilterSingle } from "@/lib/utils/schemaUtils";
import { narrationTuningRanges, type NarrationVoiceSettings } from "@/lib/narration/narrationTypes";
import { listElevenLabsSpeechModels } from "@/server/narration/elevenLabs";
import {
  getCommentAuthorVoiceSettings,
  getOrCreateCommentNarrationScript,
  getOrCreateNarrationSegmentAudio,
  getOrCreatePostNarrationScript,
} from "@/server/narration/narrationGeneration";
import { listPlayerVoices, listUserSelectableVoices } from "@/server/narration/narrationVoices";

function roundToHundredths(value: number): number {
  return Math.round(value * 100) / 100;
}

function tuningValueSchema({ min, max }: { min: number, max: number }) {
  return z.number().min(min).max(max).transform(roundToHundredths);
}

/**
 * Generated audio is looked up by exact match on its settings, so the numeric
 * ones are rounded here, before they're used for either lookup or storage.
 */
const voiceSettingsSchema = z.object({
  voiceId: z.string().min(1),
  modelId: z.string().min(1),
  stability: tuningValueSchema(narrationTuningRanges.stability),
  similarityBoost: tuningValueSchema(narrationTuningRanges.similarityBoost),
  style: tuningValueSchema(narrationTuningRanges.style),
  speed: tuningValueSchema(narrationTuningRanges.speed),
});

function requireNarrationAccess(context: ResolverContext): DbUser {
  const { currentUser } = context;
  if (!userIsAdmin(currentUser)) {
    throw new Error("Narration is only available to admins");
  }
  return currentUser;
}

async function narrationOptionsResolver(_root: void, _args: {}, context: ResolverContext) {
  requireNarrationAccess(context);
  const [voices, models] = await Promise.all([listPlayerVoices(), listElevenLabsSpeechModels()]);
  return { voices, models };
}

function narrationSelectableVoicesResolver(_root: void, _args: {}, context: ResolverContext) {
  requireNarrationAccess(context);
  return listUserSelectableVoices();
}

async function narrationSegmentAudiosResolver(
  _root: void,
  { narrationScriptId, settings }: { narrationScriptId: string, settings: NarrationVoiceSettings },
  context: ResolverContext,
) {
  const currentUser = requireNarrationAccess(context);
  const segments = await context.NarrationSegments.find({ narrationScriptId }, {}, { _id: 1 }).fetch();
  const audios = await context.NarrationSegmentAudios.find({
    narrationSegmentId: { $in: segments.map(segment => segment._id) },
    ...voiceSettingsSchema.parse(settings),
  }).fetch();
  return await accessFilterMultiple(currentUser, "NarrationSegmentAudios", audios, context);
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

/**
 * A comment's narration is in its author's voice, so the listener's settings
 * only apply to (and are required for) a post's.
 */
async function getSegmentVoiceSettings(
  narrationScript: DbNarrationScript,
  requestedSettings: NarrationVoiceSettings|null,
  context: ResolverContext,
): Promise<NarrationVoiceSettings> {
  const commentAuthorSettings = await getCommentAuthorVoiceSettings(narrationScript, context);
  if (commentAuthorSettings && requestedSettings) {
    throw new Error("A comment is narrated in its author's voice, so voice settings can't be given for it");
  }
  if (!commentAuthorSettings && !requestedSettings) {
    throw new Error("Voice settings are required to narrate a post");
  }
  return commentAuthorSettings ?? voiceSettingsSchema.parse(requestedSettings);
}

async function generateNarrationSegmentAudioResolver(
  _root: void,
  { narrationSegmentId, settings }: { narrationSegmentId: string, settings: NarrationVoiceSettings|null },
  context: ResolverContext,
) {
  const currentUser = requireNarrationAccess(context);
  const segment = await context.NarrationSegments.findOne({ _id: narrationSegmentId });
  const narrationScript = segment ? await context.NarrationScripts.findOne({ _id: segment.narrationScriptId }) : null;
  if (!segment || !narrationScript) {
    throw new Error(`Narration segment ${narrationSegmentId} not found`);
  }
  const voiceSettings = await getSegmentVoiceSettings(narrationScript, settings ?? null, context);
  const audio = await getOrCreateNarrationSegmentAudio(segment, narrationScript, voiceSettings, currentUser);
  return await accessFilterSingle(currentUser, "NarrationSegmentAudios", audio, context);
}

export const narrationGraphQLTypeDefs = gql`
  type NarrationVoice {
    voiceId: String!
    name: String!
    category: String
    description: String
    previewUrl: String
  }

  type NarrationModel {
    modelId: String!
    name: String!
    description: String
  }

  type NarrationOptions {
    voices: [NarrationVoice!]!
    models: [NarrationModel!]!
  }

  input NarrationVoiceSettingsInput {
    voiceId: String!
    modelId: String!
    stability: Float!
    similarityBoost: Float!
    style: Float!
    speed: Float!
  }

  extend type Query {
    narrationOptions: NarrationOptions!
    narrationSelectableVoices: [NarrationVoice!]!
    narrationSegmentAudios(narrationScriptId: String!, settings: NarrationVoiceSettingsInput!): [NarrationSegmentAudio!]!
  }

  extend type Mutation {
    prepareNarration(postId: String!): NarrationScript!
    prepareCommentNarration(commentId: String!): NarrationScript!
    generateNarrationSegmentAudio(narrationSegmentId: String!, settings: NarrationVoiceSettingsInput): NarrationSegmentAudio!
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
