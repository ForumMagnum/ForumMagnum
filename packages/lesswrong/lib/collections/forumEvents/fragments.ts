import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ForumEventsMinimumInfo on ForumEvent {
    _id
    title
    startDate
    endDate
    darkColor
    lightColor
    tagId
    bannerImageId
  }
`);

registerFragment(`
  fragment ForumEventsDisplay on ForumEvent {
    ...ForumEventsMinimumInfo
    tag {
      ...TagBasicInfo
    }
    frontpageDescription {
      _id
      html
    }
    postPageDescription {
      _id
      html
    }
  }
`);

registerFragment(`
  fragment ForumEventsEdit on ForumEvent {
    ...ForumEventsMinimumInfo
    frontpageDescription {
      ...RevisionEdit
    }
    postPageDescription {
      ...RevisionEdit
    }
  }
`);
