// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { getWithLoader } from "@/lib/loaders";
import { accessFilterMultiple, getFillIfMissing } from "@/lib/utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"Surveys">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  name: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  questions: {
    graphql: {
      type: "[SurveyQuestion!]!",
      canRead: ["guests"],
      resolver: async (survey, _args, context) => {
        const { currentUser, SurveyQuestions } = context;
        const questions = await getWithLoader(
          context,
          SurveyQuestions,
          "surveyQuestionsBySurvey",
          {
            surveyId: survey._id,
          },
          "surveyId",
          survey._id
        );
        const ordered = questions.sort((a, b) => a.order - b.order);
        return accessFilterMultiple(currentUser, "SurveyQuestions", ordered, context);
      },
      sqlResolver: ({ field }) => `(
      SELECT ARRAY_AGG(ROW_TO_JSON(sq.*))
      FROM "SurveyQuestions" sq
      WHERE sq."surveyId" = ${field("_id")}
      GROUP BY sq."order"
      ORDER BY sq."order" DESC
      LIMIT 1
    )`,
    },
  },
};

export default schema;
