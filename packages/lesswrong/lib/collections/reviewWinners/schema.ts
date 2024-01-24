export const schema: SchemaType<"ReviewWinners"> = {
  postId: {
    type: String,
    nullable: false,
    canCreate: ['admins']
  },
  reviewYear: {
    type: Number,
    nullable: false,
    canCreate: ['admins']
  },
  curatedOrder: {
    type: Number,
    nullable: false,
    canCreate: ['admins']
  },
  reviewRanking: {
    type: Number,
    nullable: false,
    canCreate: ['admins']
  },
  isAI: {
    type: Boolean,
    nullable: false,
    canCreate: ['admins']
  },
}
