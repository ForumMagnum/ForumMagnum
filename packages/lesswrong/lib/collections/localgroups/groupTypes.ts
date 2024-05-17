export const groupTypes = [
  {
    shortName: "LW",
    longName: "LessWrong",
  },
  {
    shortName: "SSC",
    longName: "Slate Star Codex",
  },
  {
    shortName: "EA",
    longName: "Effective Altruism",
  },
  {
    shortName: "MIRIx",
    longName: "MIRIx",
  }
];

export const localGroupTypeFormOptions = groupTypes.map(
  groupType => {
    return {
      value: groupType.shortName,
    };
  }
);
