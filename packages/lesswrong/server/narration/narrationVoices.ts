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

export interface NarrationVoice {
  voiceId: string
  name: string
  /** A few words on how the voice sounds */
  description: string
  /** A recording of the voice */
  previewUrl: string
}

interface DefaultVoice extends NarrationVoice {
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
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/gOupLcAkjEnguROwi4oS/AyYfK0CnNPq37Rzj9jA3.mp3",
  },
  {
    voiceId: "OZ0L6eISlOejga3XjDFt",
    name: "Talia",
    description: "Warm Soft Guide",
    gender: "female",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/OZ0L6eISlOejga3XjDFt/feNpPK3UmI71iHFkml8g.mp3",
  },
  {
    voiceId: "WQP7cQUF5aAS6Axh5yaa",
    name: "Elara",
    description: "Crisp Pro Narrator",
    gender: "female",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/WQP7cQUF5aAS6Axh5yaa/bG5JpSVsfxR6bgeyRnzk.mp3",
  },
  {
    voiceId: "jSuBIjxMKhqIfb0wCK1F",
    name: "Baxter",
    description: "Dry Calm Aussie",
    gender: "male",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/jSuBIjxMKhqIfb0wCK1F/b303c261-17fd-43e3-bd67-96365b33c6fb.mp3",
  },
  {
    voiceId: "6WwXjDDEMyNmFG95zycZ",
    name: "Eldrin",
    description: "Crisp British Baritone",
    gender: "male",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/6WwXjDDEMyNmFG95zycZ/RT3f2jFU3dCgQQwtz3dC.mp3",
  },
  {
    voiceId: "dvbL7qkNGZY1IqPGZAjM",
    name: "Elowen",
    description: "Upbeat Modern Narrator",
    gender: "female",
    previewUrl: "https://api.us.elevenlabs.io/v1/voices/dvbL7qkNGZY1IqPGZAjM/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJjdXN0b20iLCJ3b3Jrc3BhY2VfaWQiOiIxZGEwNmVhNjc5YTU0OTc1YWQ5NmEyMjIxZmU2NTMwZCIsImZpbGVuYW1lIjoibHdiVTFRZ0x1R1U3NWhvRG5WZFkubXAzIiwidGltZXN0YW1wIjoxNzk1MDQ2NDAwMDAwMDAwfQ%3D%3D",
  },
  {
    voiceId: "10NkTYmU7tSz3Kkl3Lex",
    name: "Kaelen",
    description: "Amateur Warrior",
    gender: "male",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/10NkTYmU7tSz3Kkl3Lex/Izw3uUEUt4DKcvYtVF5B.mp3",
  },
  {
    voiceId: "ktkP7Nsj67dw2zcplQYt",
    name: "Lawrence",
    description: "Bright and Informative",
    gender: "male",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/ktkP7Nsj67dw2zcplQYt/HLqkY4HmHjsgYkZUS8Fj.mp3",
  },
  {
    voiceId: "BFd5oBc2DDna33pSi4Gf",
    name: "Alicia",
    description: "Polished Global Anchor",
    gender: "female",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/DNYvvkdiu5NYK2rSLwDL/58662aa8-3484-459c-9e79-31fe579b2045.mp3",
  },
  {
    voiceId: "QtY3JBOUKEB5xzrRfOKc",
    name: "Maisie",
    description: "Friendly Casual Neighbor",
    gender: "female",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/QtY3JBOUKEB5xzrRfOKc/sxNrxFKYQqJM2twaupIl.mp3",
  },
  {
    voiceId: "7QN34D2r3hCNwbOYIeK0",
    name: "Warren",
    description: "Effortless and Cool",
    gender: "male",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/7QN34D2r3hCNwbOYIeK0/63ac2ee7-8046-4b2f-bb6f-7c65437b7d9d.mp3",
  },
  {
    voiceId: "g7LVvkPWALzPxOQbF6OE",
    name: "Jade",
    description: "Upbeat and Natural",
    gender: "female",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/g7LVvkPWALzPxOQbF6OE/ZglHE6CY6Su9USd2h7sU.mp3",
  },
  {
    voiceId: "l7kNoIfnJKPg7779LI2t",
    name: "Eddie",
    description: "Natural and Helpful",
    gender: "male",
    previewUrl: "https://api.us.elevenlabs.io/v1/voices/l7kNoIfnJKPg7779LI2t/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJjdXN0b20iLCJ3b3Jrc3BhY2VfaWQiOiIxZGEwNmVhNjc5YTU0OTc1YWQ5NmEyMjIxZmU2NTMwZCIsImZpbGVuYW1lIjoiWmZseHllQVJEOGlMOEhuTXdQN3QubXAzIiwidGltZXN0YW1wIjoxNzk1MDQ2NDAwMDAwMDAwfQ%3D%3D",
  },
  {
    voiceId: "AaOhDHYJ1XLZk74lXhdE",
    name: "Caleb",
    description: "Trusted Guide",
    gender: "male",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/AaOhDHYJ1XLZk74lXhdE/09516965-289e-4f78-9e36-569a22477d09.mp3",
  },
  {
    voiceId: "8dEUmyPMdDdK91vboYih",
    name: "Sawyer",
    description: "Midnight Storyteller",
    gender: "male",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/8dEUmyPMdDdK91vboYih/YYGMnAuSXy7aGwkcMzM0.mp3",
  },
  {
    voiceId: "fnYMz3F5gMEDGMWcH1ex",
    name: "Finley",
    description: "Articulate Anchor",
    gender: "male",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/uxut3IsZzAX3ycGl84pJ/58652fb7-82bb-4523-8620-5f7325b27d01.mp3",
  },
  {
    voiceId: "22N9cF8z0o7y23njdyaY",
    name: "Florence",
    description: "Atmospheric Storyteller",
    gender: "female",
    previewUrl: "https://api.us.elevenlabs.io/v1/voices/22N9cF8z0o7y23njdyaY/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJjdXN0b20iLCJ3b3Jrc3BhY2VfaWQiOiIxZGEwNmVhNjc5YTU0OTc1YWQ5NmEyMjIxZmU2NTMwZCIsImZpbGVuYW1lIjoiRjNzaE92TnhxaWRCOHBrZUdUWUsubXAzIiwidGltZXN0YW1wIjoxNzk1MDQ2NDAwMDAwMDAwfQ%3D%3D",
  },
  {
    voiceId: "FrS6cKLB1wg4WYgPa9GW",
    name: "Wyatt",
    description: "Seasoned Mentor",
    gender: "male",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/1da06ea679a54975ad96a2221fe6530d/voices/FrS6cKLB1wg4WYgPa9GW/401782f2-fb6e-46fb-b69b-e9c9530608ab.mp3",
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

function toNarrationVoice({ voiceId, name, description, previewUrl }: DefaultVoice): NarrationVoice {
  return { voiceId, name, description, previewUrl };
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
export function userCanListenInVoice(user: DbUser, voiceId: string): boolean {
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
