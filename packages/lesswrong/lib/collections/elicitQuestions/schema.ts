const commonFields = (nullable: boolean) => ({
  hidden: true,
  required: false,
  canCreate: ['members' as const,'sunshineRegiment' as const],
  canRead: ['guests' as const],
  canUpdate: ['admins' as const],
  optional: nullable,
  nullable,
});

const schema: SchemaType<"ElicitQuestions"> = {
  title: {
    type: String,
    ...commonFields(false)
  },
  notes: {
    type: String,
    ...commonFields(true)
  },
  resolution: {
    type: String,
    ...commonFields(true)
  },
  resolvesBy: {
    type: Date,
    ...commonFields(true)
  },
};

export default schema;
