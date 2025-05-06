
export const surveyQuestionFormats = {
  rank0To10: "Rank 0-10",
  text: "Text",
  multilineText: "Multiline text",
} as const;

export type SurveyQuestionFormat = keyof typeof surveyQuestionFormats;
