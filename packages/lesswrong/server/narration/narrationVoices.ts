import { generateText } from "ai";
import sample from "lodash/sample";
import { z } from "zod";
import { htmlToTextDefault } from "@/lib/htmlToText";
import { defaultNarrationVoiceTuning, type NarrationVoiceSettings } from "@/lib/narration/narrationTypes";
import Users from "@/server/collections/users/collection";
import { listElevenLabsVoices, type ElevenLabsVoice } from "./elevenLabs";
import { NARRATION_READING_MODEL } from "./llmReadings";

/** The speech model that users' voices are used with */
const USER_VOICE_MODEL_ID = "eleven_v4";
const BIO_MAX_CHARACTERS = 2000;

const VOICE_GENDER_SYSTEM_PROMPT = `A forum is choosing a text-to-speech voice to read one of its users' comments aloud, and wants to know whether a male or a female voice would suit that user.

You'll be given JSON with the user's display name and the bio from their profile. Go by how they present themselves: pronouns they state or use for themselves, what they say about themselves, or a name that is clearly a man's or a woman's.

Reply with one word and nothing else:
- male or female, if that's reasonably clear
- neutral, if they say they're nonbinary or go by they/them
- unknown otherwise. Most pseudonyms and handles say nothing about this, and unknown is the right answer for them. Don't guess from interests or writing style.`;

const voiceGenderSchema = z.enum(["male", "female", "neutral"]);
const voiceGenderReplySchema = z.enum([...voiceGenderSchema.options, "unknown"]);
type VoiceGender = z.infer<typeof voiceGenderSchema>;

const googleProfileSchema = z.object({
  google: z.object({ gender: z.string() }),
});

const voiceGenderByGoogleGender: Partial<Record<string, VoiceGender>> = {
  male: "male",
  female: "female",
  other: "neutral",
};

/**
 * The voices that a user can have: the ones that ElevenLabs provides
 * ready-made, as opposed to any that have been created in our account.
 */
export async function listUserSelectableVoices(): Promise<ElevenLabsVoice[]> {
  const voices = await listElevenLabsVoices();
  return voices.filter(voice => voice.category === "premade");
}

/**
 * Google used to include a gender in the profile that it gives to sites its
 * users sign in to, so some accounts that were created that way have one.
 */
function getGoogleProfileGender(user: DbUser): VoiceGender|null {
  const googleProfile = googleProfileSchema.safeParse(user.services);
  return googleProfile.success ? voiceGenderByGoogleGender[googleProfile.data.google.gender] ?? null : null;
}

async function guessVoiceGenderFromProfile(user: DbUser): Promise<VoiceGender|null> {
  const result = await generateText({
    model: NARRATION_READING_MODEL,
    system: VOICE_GENDER_SYSTEM_PROMPT,
    prompt: JSON.stringify({
      displayName: user.displayName,
      bio: htmlToTextDefault(user.biography?.html ?? "").slice(0, BIO_MAX_CHARACTERS),
    }),
    // The reply is one word, but the model's reasoning counts towards this too
    maxOutputTokens: 2000,
  });
  const reply = voiceGenderReplySchema.parse(result.text.trim().toLowerCase());
  return reply === "unknown" ? null : reply;
}

/**
 * Picks at random among the voices of the given gender. If the gender isn't
 * known (or no voice has it), any voice will do.
 */
function chooseVoice(voices: ElevenLabsVoice[], gender: VoiceGender|null): ElevenLabsVoice {
  const matchingVoices = voices.filter(voice => voice.gender === gender);
  const chosenVoice = sample(matchingVoices.length > 0 ? matchingVoices : voices);
  if (!chosenVoice) {
    throw new Error("ElevenLabs has no voices to choose from");
  }
  return chosenVoice;
}

async function assignNarrationVoice(user: DbUser): Promise<string> {
  const [voices, gender] = await Promise.all([
    listUserSelectableVoices(),
    getGoogleProfileGender(user) ?? guessVoiceGenderFromProfile(user),
  ]);
  const chosenVoice = chooseVoice(voices, gender);

  // Only written if the user still has no voice, so that when two requests
  // need a voice for the same user at once, both end up using the same one.
  await Users.rawUpdateOne({ _id: user._id, narrationVoiceId: null }, { $set: { narrationVoiceId: chosenVoice.voiceId } });
  const updatedUser = await Users.findOne({ _id: user._id });
  if (!updatedUser?.narrationVoiceId) {
    throw new Error(`User ${user._id} has no narration voice after being assigned one`);
  }
  return updatedUser.narrationVoiceId;
}

/**
 * The settings that a user's writing is read aloud with: the voice they've
 * chosen, with default tuning. A user who hasn't chosen is assigned a voice
 * the first time this is called for them, and keeps it until they choose
 * another.
 */
export async function getUserNarrationVoiceSettings(user: DbUser): Promise<NarrationVoiceSettings> {
  const voiceId = user.narrationVoiceId ?? await assignNarrationVoice(user);
  return { voiceId, modelId: USER_VOICE_MODEL_ID, ...defaultNarrationVoiceTuning };
}
