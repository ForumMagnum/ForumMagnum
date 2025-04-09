import { gql } from "@/lib/generated/gql-codegen/gql";

export const FieldChangeFragment = () => gql(`
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
