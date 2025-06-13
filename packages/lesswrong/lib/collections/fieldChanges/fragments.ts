import { gql } from "@/lib/generated/gql-codegen";

export const FieldChangeFragment = gql(`
  fragment FieldChangeFragment on FieldChange {
    _id
    createdAt
    userId
    changeGroup
    documentId
    fieldName
    oldValue
    newValue
  }
`)
