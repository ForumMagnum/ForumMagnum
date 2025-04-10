import { gql } from "@/lib/generated/gql-codegen/gql";

export const ElicitQuestionFragment = gql(`
  fragment ElicitQuestionFragment on ElicitQuestion {
    _id
    title
    notes
    resolution
    resolvesBy
  }
`);
