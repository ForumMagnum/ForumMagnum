type WrappedAnimation =
  "thinking" |
  "lurker" |
  "Karma-farmer" |
  "convstarter" |
  "contrarian" |
  "Visitor" |
  "one-hit";

const chooseAnimation = (personality: string): WrappedAnimation => {
  if (personality.indexOf("lurker") >= 0) {
    return "lurker";
  }
  if (personality.indexOf("farmer") >= 0) {
    return "Karma-farmer";
  }
  if (personality.indexOf("conversation") >= 0) {
    return "convstarter";
  }
  if (personality.indexOf("contrarian") >= 0) {
    return "contrarian";
  }
  if (personality.indexOf("visitor") >= 0) {
    return "Visitor";
  }
  return "one-hit";
}

type WrappedColor = "grey" | "red" | "blue" | "green" | "transparent";

const chooseColor = (personality: string): WrappedColor => {
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

// The videos are encoded in the bt709 color space but the browser expects sRGB.
// I don't want to talk about it.
const brightnesses: Record<WrappedColor, Partial<Record<WrappedAnimation, number>>> = {
  grey: {},
  red: {
    convstarter: 0.92,
    lurker: 0.92,
    contrarian: 1.068,
    Visitor: 1.068,
  },
  blue: {
    convstarter: 0.97,
    "Karma-farmer": 0.99,
    lurker: 0.95,
  },
  green: {
    lurker: 0.98,
    Visitor: 1.01,
  },
  transparent: {},
};

/**
 * On the Personality page, we need to position each animation independently
 * so that it appears a reasonable distance below the text.
 */
const animationMarginTop = (animation: WrappedAnimation): number => {
  if (animation === 'Karma-farmer' || animation === 'contrarian') {
    return 250
  }
  if (animation === 'lurker' || animation === 'Visitor') {
    return 120
  }
  if (animation === 'convstarter') {
    return 230
  }
  return 0
}

const prefix = (file: string, type: "video" | "image") =>
  `https://res.cloudinary.com/cea/${type}/upload/v1734615259/wrapped-2024/${file}`;

type WrappedVideo = {
  /** The name of the animation */
  animation: WrappedAnimation,
  /** The background color of the animation */
  color: WrappedColor,
  /**
   * This is be the cloudinary URL of the video file
   * Before uploading cloudinary you should ensure that the video uses an sRGB
   * color profile with:
   *   ffmpeg -i input.mp4 -color_trc iec61966_2_1 output.mp4
   */
  src: string,
  /**
   * This is be the cloudinary URL of a static image of the last frame of the
   * video. This can be generated with:
   *   ffmpeg -sseof -3 -i input.mp4 -update 1 -q:v 1 output.jpg
   */
  frame: string,
  /** The same image as above, but cropped to be smaller for the summary */
  frameCropped: string,
  brightness: number,
  animationMarginTop: number,
}

export const getWrappedVideo = (personality: string): WrappedVideo => {
  if (personality === "thinking") {
    return {
      animation: "thinking",
      color: "transparent",
      src: prefix("Bulby-thinking-151515-short.mp4", "video"),
      frame: prefix("Bulby-thinking-frame.jpg", "image"),
      frameCropped: prefix("Bulby-thinking-frame.jpg", "image"),
      brightness: 1,
      animationMarginTop: 0,
    };
  }
  personality = personality.toLowerCase();
  const animation = chooseAnimation(personality);
  const color = chooseColor(personality);
  return {
    animation,
    color,
    src: prefix(`${animation}-${color}.mp4`, "video"),
    frame: prefix(`${animation}-${color}-frame.jpg`, "image"),
    frameCropped: prefix(`${animation}-${color}-frame-cropped.jpg`, "image"),
    brightness: brightnesses[color]?.[animation] ?? 1,
    animationMarginTop: animationMarginTop(animation),
  };
}
