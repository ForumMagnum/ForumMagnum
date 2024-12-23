const chooseAnimation = (personality: string) => {
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

const chooseColor = (personality: string) => {
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
  `https://res.cloudinary.com/cea/${type}/upload/v1734615259/wrapped-2024/${file}`;

type WrappedColor = "grey" | "red" | "blue" | "green" | "black";

type WrappedVideo = {
  animation: string,
  frame: string,
  color: WrappedColor,
  src: string,
}

export const getWrappedVideo = (personality: string): WrappedVideo => {
  if (personality === "thinking") {
    return {
      animation: "thinking",
      color: "black",
      src: prefix("Bulby-thinking.mp4", "video"),
      frame: prefix("Bulby-thinking-frame.jpg", "image"),
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
  };
}
