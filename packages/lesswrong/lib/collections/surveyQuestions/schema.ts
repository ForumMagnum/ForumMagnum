import { foreignKeyField } from "@/lib/utils/schemaUtils";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";

const commonFields = ({nullable = false}: {
  nullable?: boolean,
} = {}): CollectionFieldSpecification<"SurveyQuestions"> => ({
  canRead: ["guests"],
  canCreate: ["admins"],
  canUpdate: ["admins"],
  optional: nullable,
  nullable,
});

const surveyQuestionFormats = new TupleSet([
  "rank1-10",
  "text",
  "multilineText",
] as const);

export type SurveyQuestionFormat = UnionOf<typeof surveyQuestionFormats>;

const schema: SchemaType<"SurveyQuestions"> = {
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
    allowedValues: Array.from(surveyQuestionFormats),
  },
  order: {
    ...commonFields(),
    type: Number,
  },
};

export default schema;
