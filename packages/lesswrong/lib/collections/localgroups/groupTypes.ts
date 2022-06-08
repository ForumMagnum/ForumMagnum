import * as _ from 'underscore';

export const groupTypes = [
  {
    shortName: "LW",
    longName: "LessWrong",
  },
  {
    shortName: "ACX",
    longName: "Astral Codex Ten",
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

export const localGroupTypeFormOptions = _.map(groupTypes,
  groupType => {
    return {
      value: groupType.shortName,
    };
  }
);
