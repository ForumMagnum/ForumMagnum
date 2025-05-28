import { gql } from "@/lib/generated/gql-codegen/gql";

export const ForumEventsMinimumInfo = gql(`
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
    commentId
    bannerImageId
    eventFormat
    customComponent
    commentPrompt
    isGlobal

    pollAgreeWording
    pollDisagreeWording

    maxStickersPerUser
  }
`)

export const ForumEventsDisplay = gql(`
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
      plaintextMainText
    }
  }
`)

export const ForumEventsEdit = gql(`
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
`)
