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
  // {
  //   shortName: "MIRIx",
  //   longName: "MIRIx",
  // },
  {
    shortName: "IFANYONE",
    longName: "If Anyone Builds It",
  },
  {
    shortName: "PETROV",
    longName: "Petrov Day",
  }
];

export const localGroupTypeFormOptions = groupTypes.map(
  groupType => {
    return {
      value: groupType.shortName,
    };
  }
);

export const GROUP_CATEGORIES = [
  { value: "national", label: "National" },
  { value: "regional", label: "Regional" },
  { value: "city", label: "City" },
  { value: "university", label: "University" },
  { value: "high-school", label: "High School" },
  { value: "workplace", label: "Workplace" },
  { value: "professional", label: "Professional" },
  { value: "cause-area", label: "Cause Area" },
  { value: "affiliation", label: "Affiliation" },
];
