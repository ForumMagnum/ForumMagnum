import { frag } from "@/lib/fragments/fragmentWrapper";

export const DigestsMinimumInfo = () => gql`
  fragment DigestsMinimumInfo on Digest {
    _id
    num
    startDate
    endDate
    publishedDate
    onsiteImageId
    onsitePrimaryColor
  }
`
