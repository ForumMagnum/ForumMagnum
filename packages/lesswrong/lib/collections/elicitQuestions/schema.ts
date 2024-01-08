const commonFields = (nullable: boolean) => ({
  hidden: true,
  canCreate: ['admins' as const],
  canRead: ['guests' as const],
  canUpdate: ['admins' as const],
  optional: nullable,
  nullable,
});

const schema: SchemaType<"ElicitQuestions"> = {
  _id: {
    type: String,
    ...commonFields(false)
  },
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
    ...commonFields(false)
  },
  createdAt: {
    type: Date,
    onInsert: question => question.createdAt ?? new Date(),
    ...commonFields(false)
  },
};

export default schema;
