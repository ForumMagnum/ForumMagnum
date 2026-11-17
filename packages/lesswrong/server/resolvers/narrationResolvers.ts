import gql from "graphql-tag";
import { z } from "zod";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { accessFilterMultiple, accessFilterSingle } from "@/lib/utils/schemaUtils";
import { narrationTuningRanges, type NarrationVoiceSettings } from "@/lib/narration/narrationTypes";
import { listElevenLabsSpeechModels, listElevenLabsVoices } from "@/server/narration/elevenLabs";
import { getOrCreateNarrationScript, getOrCreateNarrationSegmentAudio } from "@/server/narration/narrationGeneration";

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
  const [voices, models] = await Promise.all([listElevenLabsVoices(), listElevenLabsSpeechModels()]);
  return { voices, models };
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
  const narrationScript = await getOrCreateNarrationScript(post, context);
  return await accessFilterSingle(currentUser, "NarrationScripts", narrationScript, context);
}

async function generateNarrationSegmentAudioResolver(
  _root: void,
  { narrationSegmentId, settings }: { narrationSegmentId: string, settings: NarrationVoiceSettings },
  context: ResolverContext,
) {
  const currentUser = requireNarrationAccess(context);
  const segment = await context.NarrationSegments.findOne({ _id: narrationSegmentId });
  if (!segment) {
    throw new Error(`Narration segment ${narrationSegmentId} not found`);
  }
  const audio = await getOrCreateNarrationSegmentAudio(segment, voiceSettingsSchema.parse(settings), currentUser);
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
    narrationSegmentAudios(narrationScriptId: String!, settings: NarrationVoiceSettingsInput!): [NarrationSegmentAudio!]!
  }

  extend type Mutation {
    prepareNarration(postId: String!): NarrationScript!
    generateNarrationSegmentAudio(narrationSegmentId: String!, settings: NarrationVoiceSettingsInput!): NarrationSegmentAudio!
  }
`;

export const narrationGraphQLQueries = {
  narrationOptions: narrationOptionsResolver,
  narrationSegmentAudios: narrationSegmentAudiosResolver,
};

export const narrationGraphQLMutations = {
  prepareNarration: prepareNarrationResolver,
  generateNarrationSegmentAudio: generateNarrationSegmentAudioResolver,
};
