import { browserProperties } from "@/lib/utils/browserProperties";

/*
 * We generate animations for each different personality. The background color
 * is separate and depends on the user's other stats. To be able to display
 * these videos on different coloured backgrounds we must ensure they have
 * transparent backgrounds which, it turns out, is ridiculously complicated
 * to do in a cross-browser way (I'm looking at you, Safari).
 *
 * For Safari we need a video encoded with HEVC with alpha and saved as a .mov.
 * For every other browser we need a video encoded with VP9 and saved as a .webm.
 *
 * Agnes' sister (who makes the animations) is able to supply us with a suitable
 * webm. If our webm is called "output.webm", we can run the following ffmpeg
 * command to convert to a format for Safari can understand:
 *   ffmpeg -c:v libvpx-vp9 -i output.webm -vf "scale=1080:1920" -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le -q:v 64 output.mov
 * That command also includes some pretty aggressive compression because the
 * mov file will be _significantly_ larger than the webm.
 *
 * Since we don't know which file to use until we're on the client, anything
 * that embeds the video src in the DOM should be no-SSR'd.
 *
 * There is a script at "ForumMagnum/scripts/process-wrapped-videos.sh" which,
 * when copied into a directory containing the webm files, will automatically
 * convert all of them to suitable mov files, and export the final frames as
 * pngs for sharing.
 *
 * (NB: In the past we pre-rendered each personality with each different
 * background colour. This was a bad idea. Apart from requiring annoyingly many
 * different files, we ran into a problem where the background colour of the
 * videos didn't quite match the background of the site because the videos
 * were encoded in the bt709 colour space but the browser expected sRGB so the
 * gamma was all messed up. My ffmpeg-foo wasn't up to the job of fixing it so
 * we ended up hard-coding a custom "brightness" number to apply to each video
 * using CSS to offset the gamma. That was a bad day.)
 */

const wrappedAnimations = [
  "AISafetyist",
  "AnimalWelfarist",
  "Biosecuritarian",
  "EABuilder",
  "FirstResponder",
  "GlobalHealther",
  "Intro",
  "KarmaCharmer",
  "Newbie",
  "Philosopher",
] as const;

type WrappedAnimation = typeof wrappedAnimations[number];

const chooseAnimation = (personality: string): WrappedAnimation => {
  personality = personality.replace(/ /g, "")
  for (const animation of wrappedAnimations) {
    if (personality.indexOf(animation) >= 0) {
      return animation;
    }
  }
  return "Intro";
}

type WrappedColor = "grey" | "red" | "blue" | "green" | "transparent";

const chooseColor = (personality: string): WrappedColor => {
  if (personality === "thinking") {
    return "transparent";
  }
  if (personality.indexOf("stoic") >= 0 || personality.indexOf("agreeable") >= 0) {
    return "grey";
  }
  if (personality.indexOf("beloved") >= 0 || personality.indexOf("loving") >= 0) {
    return "red";
  }
  if (personality.indexOf("insightful") >= 0 || personality.indexOf("curious") >= 0) {
    return "blue";
  }
  return "green";
}

const prefix = (file: string, type: "video" | "image") =>
  `https://res.cloudinary.com/cea/${type}/upload/v1734615259/wrapped-2025/${file}`;

type WrappedVideo = {
  /** The name of the animation */
  animation: WrappedAnimation,
  /** The background color of the animation */
  color: WrappedColor,
  /**
   * This is be the cloudinary URL of the video file
   */
  src: string,
  /**
   * Static image with a transparent background for use on the summary page
   */
  frame: string,
}

export const getWrappedVideo = (personality: string): WrappedVideo => {
  const animation = chooseAnimation(personality);
  const color = chooseColor(personality);
  const properties = browserProperties();
  const videoFormat = properties?.safari ? "mov" : "webm";
  return {
    animation,
    color,
    src: prefix(`${animation}-${videoFormat}.${videoFormat}`, "video"),
    frame: prefix(`${animation}-png.png`, "image"),
  };
}
