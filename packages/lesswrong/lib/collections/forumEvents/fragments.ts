import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ForumEventsMinimumInfo on ForumEvent {
    _id
    title
    startDate
    endDate
    darkColor
    lightColor
    contrastColor
    tagId
    postId
    bannerImageId
    eventFormat
    customComponent
  }
`);

registerFragment(`
  fragment ForumEventsDisplay on ForumEvent {
    ...ForumEventsMinimumInfo
    publicData
    voteCount

    post {
      ...PostsMinimumInfo
    }
    tag {
      ...TagBasicInfo
    }
    frontpageDescription {
      _id
      html
    }
    frontpageDescriptionMobile {
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
    frontpageDescriptionMobile {
      ...RevisionEdit
    }
    postPageDescription {
      ...RevisionEdit
    }
  }
`);
