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
  grey: {
    lurker: 0.985,
    "Karma-farmer": 0.985,
    convstarter: 0.985,
    contrarian: 0.985,
    Visitor: 0.985,
    "one-hit": 0.985,
  },
  red: {
    lurker: 0.92,
    "Karma-farmer": 0.995,
    convstarter: 0.92,
    contrarian: 1.068,
    Visitor: 1.068,
    "one-hit": 0.985,
  },
  blue: {
    lurker: 0.94,
    "Karma-farmer": 0.99,
    convstarter: 0.97,
    contrarian: 0.995,
    Visitor: 0.998,
    "one-hit": 0.998,
  },
  green: {
    lurker: 0.98,
    "Karma-farmer": 0.995,
    convstarter: 0.995,
    contrarian: 0.9955,
    Visitor: 1.01,
    "one-hit": 0.999,
  },
  transparent: {},
};


const prefix = (file: string, type: "video" | "image") =>
  `https://res.cloudinary.com/cea/${type}/upload/v1734615259/wrapped-2024/${file}`;

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
  brightness: number,
}

export const getWrappedVideo = (personality: string): WrappedVideo => {
  if (personality === "thinking") {
    return {
      animation: "thinking",
      color: "transparent",
      src: prefix("Bulby-thinking-151515-short.mp4", "video"),
      frame: prefix("Bulbythinking-frame.png", "image"),
      brightness: 1,
    };
  }
  personality = personality.toLowerCase();
  const animation = chooseAnimation(personality);
  const color = chooseColor(personality);
  return {
    animation,
    color,
    src: prefix(`${animation}-${color}.mp4`, "video"),
    frame: prefix(`${animation}-alpha.png`, "image"),
    brightness: brightnesses[color]?.[animation] ?? 1,
  };
}
