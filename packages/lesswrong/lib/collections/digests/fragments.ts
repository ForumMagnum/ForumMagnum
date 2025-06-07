import { gql } from "@/lib/crud/wrapGql";

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
