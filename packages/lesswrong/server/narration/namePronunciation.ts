import uniq from "lodash/uniq";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import type { ForumTypeString } from "@/lib/instanceSettings";
import { DEFAULT_NARRATION_MODEL_ID, narrationVoiceTuning } from "@/lib/narration/narrationTypes";
import { synthesizeSpeechWithTimestamps } from "./elevenLabs";
import { getCommentIntroduction } from "./narrationScript";
import { getDefaultListenerVoiceId } from "./narrationVoices";

const NAME_PRONUNCIATION_MAX_CHARACTERS = 100;

/**
 * Matches anything that IPA isn't written with. A pronunciation goes into the
 * text that the speech model reads, between the marks that tell it to read
 * IPA (see getSpokenName). So this is also what stops one from ending that
 * early, with a slash or a quotation mark, and going on to have the narrator
 * say something else, or from directing the model with a tag in brackets.
 */
const nonIpaCharacterPattern = /[^\p{L}\p{M}\p{Sk} .‿|‖↑↓↗↘]/gu;

/** Throws, with a message for whoever entered it, if a user's pronunciation of their name isn't one that can be used */
export function validateNamePronunciation(pronunciation: string) {
  if (pronunciation.length > NAME_PRONUNCIATION_MAX_CHARACTERS) {
    throw new Error(`A pronunciation can't be longer than ${NAME_PRONUNCIATION_MAX_CHARACTERS} characters`);
  }
  const nonIpaCharacters = uniq(pronunciation.match(nonIpaCharacterPattern));
  if (nonIpaCharacters.length > 0) {
    throw new Error(
      "A pronunciation is written in the International Phonetic Alphabet, without slashes or brackets around it. "
      + `It can't contain: ${nonIpaCharacters.join(" ")}`
    );
  }
}

/**
 * How a name is written in a script: as it is, or if there's a pronunciation
 * for it, as that, in the form that the Eleven v4 models take IPA in (between
 * slashes, in quotation marks). The v2 models only guess at what that says,
 * but only admins can choose to listen with those.
 */
function getSpokenName(displayName: string, pronunciation: string): string {
  const ipa = pronunciation.trim();
  return ipa ? `"/${ipa}/"` : displayName;
}

/** What a script calls a user: their name, said the way they've asked for it to be if they have */
export function getSpokenUserName(user: DbUser, forumType: ForumTypeString): string {
  return getSpokenName(userGetDisplayName(user, forumType), user.narrationNamePronunciation);
}

/**
 * Audio of a user's name as narration would say it if `pronunciation` were
 * the one they'd set, for them to hear before they save it. It's what their
 * comments open with, in their own voice, or the default voice if they
 * haven't got one yet. Nothing is stored.
 */
export async function synthesizeNamePronunciationPreview(user: DbUser, pronunciation: string, forumType: ForumTypeString): Promise<Buffer> {
  validateNamePronunciation(pronunciation);
  const spokenName = getSpokenName(userGetDisplayName(user, forumType), pronunciation);
  const { audio } = await synthesizeSpeechWithTimestamps({
    text: getCommentIntroduction({ answer: false, parentCommentId: null, retracted: false }, spokenName, null),
    previousText: null,
    nextText: null,
    settings: {
      voiceId: user.narrationVoiceId ?? getDefaultListenerVoiceId(),
      modelId: DEFAULT_NARRATION_MODEL_ID,
      ...narrationVoiceTuning,
    },
  });
  return audio;
}
