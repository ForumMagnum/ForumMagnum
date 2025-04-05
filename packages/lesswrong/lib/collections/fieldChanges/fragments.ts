import { frag } from "@/lib/fragments/fragmentWrapper";

export const FieldChangeFragment = () => frag`
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
`
