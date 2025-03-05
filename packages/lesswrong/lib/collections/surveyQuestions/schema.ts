import { addUniversalFields } from "@/lib/collectionUtils";
import { foreignKeyField } from "@/lib/utils/schemaUtils";

const commonFields = ({nullable = false}: {
  nullable?: boolean,
} = {}): CollectionFieldSpecification<"SurveyQuestions"> => ({
  canRead: ["guests"],
  canCreate: ["admins"],
  canUpdate: ["admins"],
  optional: nullable,
  nullable,
});

export const surveyQuestionFormats = {
  rank0To10: "Rank 0-10",
  text: "Text",
  multilineText: "Multiline text",
} as const;

export type SurveyQuestionFormat = keyof typeof surveyQuestionFormats;

const schema: SchemaType<"SurveyQuestions"> = {
  ...addUniversalFields({}),

  surveyId: {
    ...commonFields(),
    ...foreignKeyField({
      idFieldName: "surveyId",
      resolverName: "survey",
      collectionName: "Surveys",
      type: "Survey",
      nullable: false,
    }),
  },
  question: {
    ...commonFields(),
    type: String,
  },
  format: {
    ...commonFields(),
    type: String,
    allowedValues: Object.keys(surveyQuestionFormats),
  },
  order: {
    ...commonFields(),
    type: Number,
  },
};

export default schema;
