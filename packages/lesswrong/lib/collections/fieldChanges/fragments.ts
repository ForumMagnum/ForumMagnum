import { gql } from "@/lib/crud/wrapGql";

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
