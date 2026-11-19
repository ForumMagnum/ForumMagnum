import { generateText } from "ai";
import sample from "lodash/sample";
import { z } from "zod";
import { htmlToTextDefault } from "@/lib/htmlToText";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import Users from "@/server/collections/users/collection";
import { NARRATION_READING_MODEL } from "./llmReadings";

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

/** Where the recordings of the voices are served from. They're files in /public. */
const VOICE_SAMPLE_DIRECTORY = "/narration-voice-samples";

export interface NarrationVoice {
  voiceId: string
  name: string
  /** A few words on how the voice sounds */
  description: string
  /** A recording of the voice; see getVoiceSamplePath */
  previewUrl: string
}

interface DefaultVoice {
  voiceId: string
  name: string
  description: string
  gender: VoiceGender
}

/**
 * ElevenLabs' default voices. Its API has no way to ask for these: they're
 * ordinary entries in its public voice library, which replaced an earlier set
 * of defaults that the API could list. Nor can they be looked up by ID until
 * they're in our account, which happens the first time speech is generated
 * with each. So this is the list of replacements, as of 2026-11-18, from
 * https://elevenlabs.io/docs/help-center/product/voices/my-voices/what-are-default-voices
 * in that page's order, with what the voice library says about each (it calls
 * the first one "Darian - Warm Grounded Storyteller", and so on). It leaves
 * out the one voice on that page that the API says doesn't exist (the
 * replacement for Callum, fs2OqxduwXgp9foh2xjK). Alicia has no gender in the
 * library; hers is from the library's description of the voice.
 */
const defaultVoices: DefaultVoice[] = [
  {
    voiceId: "gOupLcAkjEnguROwi4oS",
    name: "Darian",
    description: "Warm Grounded Storyteller",
    gender: "male",
  },
  {
    voiceId: "OZ0L6eISlOejga3XjDFt",
    name: "Talia",
    description: "Warm Soft Guide",
    gender: "female",
  },
  {
    voiceId: "WQP7cQUF5aAS6Axh5yaa",
    name: "Elara",
    description: "Crisp Pro Narrator",
    gender: "female",
  },
  {
    voiceId: "jSuBIjxMKhqIfb0wCK1F",
    name: "Baxter",
    description: "Dry Calm Aussie",
    gender: "male",
  },
  {
    voiceId: "6WwXjDDEMyNmFG95zycZ",
    name: "Eldrin",
    description: "Crisp British Baritone",
    gender: "male",
  },
  {
    voiceId: "dvbL7qkNGZY1IqPGZAjM",
    name: "Elowen",
    description: "Upbeat Modern Narrator",
    gender: "female",
  },
  {
    voiceId: "10NkTYmU7tSz3Kkl3Lex",
    name: "Kaelen",
    description: "Amateur Warrior",
    gender: "male",
  },
  {
    voiceId: "ktkP7Nsj67dw2zcplQYt",
    name: "Lawrence",
    description: "Bright and Informative",
    gender: "male",
  },
  {
    voiceId: "BFd5oBc2DDna33pSi4Gf",
    name: "Alicia",
    description: "Polished Global Anchor",
    gender: "female",
  },
  {
    voiceId: "QtY3JBOUKEB5xzrRfOKc",
    name: "Maisie",
    description: "Friendly Casual Neighbor",
    gender: "female",
  },
  {
    voiceId: "7QN34D2r3hCNwbOYIeK0",
    name: "Warren",
    description: "Effortless and Cool",
    gender: "male",
  },
  {
    voiceId: "g7LVvkPWALzPxOQbF6OE",
    name: "Jade",
    description: "Upbeat and Natural",
    gender: "female",
  },
  {
    voiceId: "l7kNoIfnJKPg7779LI2t",
    name: "Eddie",
    description: "Natural and Helpful",
    gender: "male",
  },
  {
    voiceId: "AaOhDHYJ1XLZk74lXhdE",
    name: "Caleb",
    description: "Trusted Guide",
    gender: "male",
  },
  {
    voiceId: "8dEUmyPMdDdK91vboYih",
    name: "Sawyer",
    description: "Midnight Storyteller",
    gender: "male",
  },
  {
    voiceId: "fnYMz3F5gMEDGMWcH1ex",
    name: "Finley",
    description: "Articulate Anchor",
    gender: "male",
  },
  {
    voiceId: "22N9cF8z0o7y23njdyaY",
    name: "Florence",
    description: "Atmospheric Storyteller",
    gender: "female",
  },
  {
    voiceId: "FrS6cKLB1wg4WYgPa9GW",
    name: "Wyatt",
    description: "Seasoned Mentor",
    gender: "male",
  },
];

/**
 * The names of the voices that anyone can choose to listen in. Every voice
 * that something gets listened to in is another copy of its audio to generate
 * and pay for, so listeners are kept to these (and to the voices of the
 * people who wrote what they're listening to). The first is what posts are
 * read in unless the listener chooses otherwise.
 */
const LISTENER_VOICE_NAMES = ["Eddie", "Maisie"];

function getDefaultVoiceByName(name: string): DefaultVoice {
  const voice = defaultVoices.find(defaultVoice => defaultVoice.name === name);
  if (!voice) {
    throw new Error(`There's no default voice called ${name}`);
  }
  return voice;
}

/**
 * The recording of a voice that's played to someone who's choosing between
 * voices, as a path on this site. In each one the voice says the same
 * sentence, generated the way that narration is. The recordings are checked
 * in, and scripts/generateNarrationVoiceSamples.ts makes them: it has to be
 * run again when a voice is added.
 */
export function getVoiceSamplePath(voiceId: string): string {
  return `${VOICE_SAMPLE_DIRECTORY}/${voiceId}.mp3`;
}

function toNarrationVoice({ voiceId, name, description }: DefaultVoice): NarrationVoice {
  return { voiceId, name, description, previewUrl: getVoiceSamplePath(voiceId) };
}

/** Whether a voice is one that a user can have as their own: any of ElevenLabs' default voices */
export function isUserSelectableVoice(voiceId: string): boolean {
  return defaultVoices.some(voice => voice.voiceId === voiceId);
}

/** The voices that a user can have as their own */
export function listUserSelectableVoices(): NarrationVoice[] {
  return defaultVoices.map(toNarrationVoice);
}

/** The voices that anyone can choose to listen in */
export function listListenerVoices(): NarrationVoice[] {
  return LISTENER_VOICE_NAMES.map(getDefaultVoiceByName).map(toNarrationVoice);
}

/**
 * The rest of the default voices. Admins can listen in these as well, so that
 * they can compare them with the ones that everyone gets.
 */
export function listAdminListenerVoices(): NarrationVoice[] {
  return defaultVoices.filter(voice => !LISTENER_VOICE_NAMES.includes(voice.name)).map(toNarrationVoice);
}

/** Whether a user may ask to hear things read in a particular voice */
export function userCanListenInVoice(user: DbUser|null, voiceId: string): boolean {
  const allowedVoices = userIsAdmin(user) ? listUserSelectableVoices() : listListenerVoices();
  return allowedVoices.some(voice => voice.voiceId === voiceId);
}

/** The voice that posts are read in unless the listener chooses otherwise */
export function getDefaultListenerVoiceId(): string {
  return getDefaultVoiceByName(LISTENER_VOICE_NAMES[0]).voiceId;
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
 * Picks at random among the default voices of the given gender. If the gender
 * isn't known (or no voice has it), any of them will do.
 */
function chooseVoice(gender: VoiceGender|null): DefaultVoice {
  const matchingVoices = defaultVoices.filter(voice => voice.gender === gender);
  const chosenVoice = sample(matchingVoices.length > 0 ? matchingVoices : defaultVoices);
  if (!chosenVoice) {
    throw new Error("There are no voices to choose from");
  }
  return chosenVoice;
}

async function assignNarrationVoice(user: DbUser): Promise<string> {
  const gender = getGoogleProfileGender(user) ?? await guessVoiceGenderFromProfile(user);
  const chosenVoice = chooseVoice(gender);

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
 * The voice that a user's writing is read aloud in, for listeners who ask to
 * hear authors' voices: the one they've chosen. A user who hasn't chosen is
 * assigned a voice the first time this is called for them, and keeps it until
 * they choose another.
 */
export async function getUserNarrationVoiceId(user: DbUser): Promise<string> {
  return user.narrationVoiceId ?? await assignNarrationVoice(user);
}
