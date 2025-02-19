import { registerFragment } from '../../vulcan-lib';

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
