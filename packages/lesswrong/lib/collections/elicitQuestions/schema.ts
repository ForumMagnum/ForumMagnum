const commonFields = (nullable: boolean) => ({
  hidden: true,
  canCreate: ['admins' as const],
  canRead: ['guests' as const],
  canUpdate: ['admins' as const],
  optional: nullable,
  nullable,
});

const schema: SchemaType<DbElicitQuestion> = {
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
    ...commonFields(false)
  },
  resolution: {
    type: String,
    ...commonFields(false)
  },
  resolvesBy: {
    type: Date,
    ...commonFields(false)
  },
  // predictions: resolverOnlyField({
  //   type: Array,
  //   graphQLtype: '[ElicitQuestionPrediction]',
  //   resolver: (elicitQuestion, _, context) => context.ElicitQuestionPredictions.find({ binaryQuestionId: elicitQuestion._id }).fetch()
  // }),
  // 'predictions.$': {
  //   type: Object
  // }
};

export default schema;
