import { gql } from "@/lib/crud/wrapGql";

export const ElicitQuestionFragment = gql(`
  fragment ElicitQuestionFragment on ElicitQuestion {
    _id
    title
    notes
    resolution
    resolvesBy
  }
`);
