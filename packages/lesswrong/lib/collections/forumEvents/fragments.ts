import { frag } from "@/lib/fragments/fragmentWrapper"

export const ForumEventsMinimumInfo = () => frag`
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
    isGlobal

    pollAgreeWording
    pollDisagreeWording

    maxStickersPerUser
  }
`

export const ForumEventsDisplay = () => frag`
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
    pollQuestion {
      _id
      html
    }
  }
`

export const ForumEventsEdit = () => frag`
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
    pollQuestion {
      ...RevisionEdit
    }
  }
`
