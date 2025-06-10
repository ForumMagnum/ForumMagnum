import { gql } from "@/lib/generated/gql-codegen";

export const ElicitQuestionFragment = gql(`
  fragment ElicitQuestionFragment on ElicitQuestion {
    _id
    title
    notes
    resolution
    resolvesBy
  }
`);
