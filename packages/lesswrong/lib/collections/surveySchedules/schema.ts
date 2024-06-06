import { arrayOfForeignKeysField, foreignKeyField } from "@/lib/utils/schemaUtils";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";

const commonFields = ({nullable = false}: {
  nullable?: boolean,
} = {}): CollectionFieldSpecification<"SurveySchedules"> => ({
  canRead: ["admins"],
  canCreate: ["admins"],
  canUpdate: ["admins"],
  optional: nullable,
  nullable,
});

const surveyScheduleTargets = new TupleSet([
  "allUsers",
  "loggedInOnly",
  "loggedOutOnly",
] as const);

export type SurveyScheduleTarget = UnionOf<typeof surveyScheduleTargets>;

const schema: SchemaType<"SurveySchedules"> = {
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
  name: {
    ...commonFields(),
    type: String,
  },
  minKarma: {
    ...commonFields({nullable: true}),
    type: Number,
  },
  maxKarma: {
    ...commonFields({nullable: true}),
    type: Number,
  },
  target: {
    ...commonFields(),
    type: String,
    allowedValues: Array.from(surveyScheduleTargets),
    defaultValue: "allUsers",
  },
  startDate: {
    ...commonFields({nullable: true}),
    type: Date,
  },
  endDate: {
    ...commonFields({nullable: true}),
    type: Date,
  },
  deactivated: {
    ...commonFields(),
    type: Boolean,
    defaultValue: false,
  },
  clientIds: {
    ...commonFields(),
    ...arrayOfForeignKeysField({
      idFieldName: "clientIds",
      resolverName: "clients",
      collectionName: "ClientIds",
      type: "ClientId"
    }),
  },
  "clientIds.$": {
    type: String,
    foreignKey: "ClientIds",
  },
};

export default schema;
