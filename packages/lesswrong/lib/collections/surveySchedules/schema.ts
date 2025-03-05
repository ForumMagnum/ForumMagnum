import { arrayOfForeignKeysField, foreignKeyField } from "@/lib/utils/schemaUtils";
import { addUniversalFields } from "../../collectionUtils";

const commonFields = ({nullable = false}: {
  nullable?: boolean,
} = {}): CollectionFieldSpecification<"SurveySchedules"> => ({
  canRead: ["admins"],
  canCreate: ["admins"],
  canUpdate: ["admins"],
  optional: nullable,
  nullable,
});

const surveyScheduleTargets = [
  {value: "allUsers", label: "All users"},
  {value: "loggedInOnly", label: "Logged-in users only"},
  {value: "loggedOutOnly", label: "Logged-out users only"},
] as const;

export type SurveyScheduleTarget = typeof surveyScheduleTargets[number]["value"];

const schema: SchemaType<"SurveySchedules"> = {
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
    canRead: ["guests"],
  },
  name: {
    ...commonFields(),
    type: String,
    label: "Schedule name",
  },
  impressionsLimit: {
    ...commonFields({nullable: true}),
    type: Number,
    tooltip: "The maximum number of visitors who'll see this survey",
    min: 0,
  },
  maxVisitorPercentage: {
    ...commonFields({nullable: true}),
    type: Number,
    tooltip: "The maximum percentage of visitors this survey will be shown to",
    min: 0,
    max: 100,
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
    allowedValues: surveyScheduleTargets.map(({value}) => value),
    defaultValue: "allUsers",
    control: "select",
    form: {
      options: () => surveyScheduleTargets,
      hideClear: true,
    },
  },
  startDate: {
    ...commonFields({nullable: true}),
    type: Date,
    control: "datetime",
  },
  endDate: {
    ...commonFields({nullable: true}),
    type: Date,
    control: "datetime",
  },
  deactivated: {
    ...commonFields(),
    type: Boolean,
    defaultValue: false,
    optional: true,
  },
  clientIds: {
    ...commonFields(),
    ...arrayOfForeignKeysField({
      idFieldName: "clientIds",
      resolverName: "clients",
      collectionName: "ClientIds",
      type: "ClientId"
    }),
    hidden: true,
  },
  "clientIds.$": {
    type: String,
    foreignKey: "ClientIds",
  },
};

export default schema;
