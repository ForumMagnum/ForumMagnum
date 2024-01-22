export const schema: SchemaType<"ReviewWinners"> = {
  postId: {
    type: String,
    nullable: false
  },
  reviewYear: {
    type: Number,
    nullable: false
  },
  curatedOrder: {
    type: Number,
    nullable: false
  },
  isAI: {
    type: Boolean,
    nullable: false
  },
}
