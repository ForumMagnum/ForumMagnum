import { gql } from "@/lib/generated/gql-codegen";

export const NarrationScriptFragment = gql(`
  fragment NarrationScriptFragment on NarrationScript {
    _id
    scriptUrl
    segments {
      _id
      segmentIndex
      startBlockIndex
      endBlockIndex
      characterCount
    }
  }
`);
