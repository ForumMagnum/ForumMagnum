import { gql } from "@/lib/generated/gql-codegen/gql";

export const DigestsMinimumInfo = gql(`
  fragment DigestsMinimumInfo on Digest {
    _id
    num
    startDate
    endDate
    publishedDate
    onsiteImageId
    onsitePrimaryColor
  }
`)
