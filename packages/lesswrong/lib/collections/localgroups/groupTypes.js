
export const groupTypes = [
  {
    shortName: "LW",
    longName: "LessWrong",
    color: "rgba(100, 169, 105, 0.9)",
    hoverColor: "rgba(100, 169, 105, 0.5)"
  },
  {
    shortName: "SSC",
    longName: "Slate Star Codex",
    color: "rgba(100, 169, 105, 0.9)",
    hoverColor: "rgba(100, 169, 105, 0.5)"
  },
  {
    shortName: "EA",
    longName: "Effective Altruism",
    color: "rgba(100, 169, 105, 0.9)",
    hoverColor: "rgba(100, 169, 105, 0.5)"
  },
  {
    shortName: "MIRIx",
    longName: "MIRIx",
    color: "rgba(100, 169, 105, 0.9)",
    hoverColor: "rgba(100, 169, 105, 0.5)"
  }

  // Alternative colorization, keep around for now
  // {value: "SSC", color: "rgba(136, 172, 184, 0.9)", hoverColor: "rgba(136, 172, 184, 0.5)"},
  // {value: "EA", color: "rgba(29, 135, 156,0.5)", hoverColor: "rgba(29, 135, 156,0.5)"},
  // {value: "MIRIx", color: "rgba(225, 96, 1,0.6)", hoverColor: "rgba(225, 96, 1,0.3)"}
];

export const localGroupTypeFormOptions = _.map(groupTypes,
  groupType => {
    return {
      value: groupType.shortName,
      color: groupType.color,
      hoverColor: groupType.hoverColor
    };
  }
);
