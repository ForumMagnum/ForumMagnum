import moment from "moment";
import { useCookiesWithConsent } from "@/components/hooks/useCookiesWithConsent";
import { NARRATION_PLAYBACK_RATE_COOKIE } from "@/lib/cookies/cookies";

export const narrationPlaybackRates = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];

export function formatNarrationPlaybackRate(playbackRate: number): string {
  return `${playbackRate}×`;
}

/** The speed that this browser last listened to narration at, which is remembered in a cookie */
export function useNarrationPlaybackRate(): { playbackRate: number, setPlaybackRate: (playbackRate: number) => void } {
  const [cookies, setCookie] = useCookiesWithConsent([NARRATION_PLAYBACK_RATE_COOKIE]);
  const storedPlaybackRate = Number(cookies[NARRATION_PLAYBACK_RATE_COOKIE]);
  const playbackRate = narrationPlaybackRates.includes(storedPlaybackRate) ? storedPlaybackRate : 1;
  const setPlaybackRate = (newPlaybackRate: number) => {
    setCookie(NARRATION_PLAYBACK_RATE_COOKIE, String(newPlaybackRate), {
      path: "/",
      expires: moment().add(2, "years").toDate(),
    });
  };
  return { playbackRate, setPlaybackRate };
}
