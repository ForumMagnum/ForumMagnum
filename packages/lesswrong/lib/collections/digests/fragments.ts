import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment DigestsMinimumInfo on Digest {
    _id
    num
    startDate
    endDate
    publishedDate
    onsiteImageId
    onsitePrimaryColor
  }
`);
