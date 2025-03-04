export const ForumEventsMinimumInfo = `
  fragment ForumEventsMinimumInfo on ForumEvent {
    _id
    title
    startDate
    endDate
    darkColor
    lightColor
    bannerTextColor
    contrastColor
    tagId
    postId
    bannerImageId
    eventFormat
    customComponent
    commentPrompt

    maxStickersPerUser
  }
`

export const ForumEventsDisplay = `
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
`

export const ForumEventsEdit = `
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
`
