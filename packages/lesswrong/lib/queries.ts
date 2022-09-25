
export const elicitDataFragment = `
  _id
  title
  notes
  resolvesBy
  resolution
  predictions {
    _id,
    predictionId,
    prediction,
    createdAt,
    notes,
    sourceUrl,
    sourceId,
    binaryQuestionId
    creator {
      _id,
      displayName,
      sourceUserId
      lwUser {
        ...UsersMinimumInfo
      }
    }
  }
`;

export const allQueries = {
  RecommendationsQuery: `query RecommendationsQuery($count: Int, $algorithm: JSON) {
    Recommendations(count: $count, algorithm: $algorithm) {
      ...PostsList
    }
  }`,
  MozillaHubsRoomData: `
    query MozillaHubsRoomData($roomId: String) {
      MozillaHubsRoomData(roomId: $roomId) {
        id
        previewImage
        lobbyCount
        memberCount
        roomSize
        description
        url
        name
      }
    }
  `,
  EmailPreviewQuery: `
    query EmailPreviewQuery($notificationIds: [String], $postId: String) {
      EmailPreview(notificationIds: $notificationIds, postId: $postId) { to subject html text }
    }
  `,
  ArbitalPageRequest: `
    query ArbitalPageRequest($arbitalSlug: String!) {
      ArbitalPageData(pageAlias: "$arbitalSlug") {
        title
        html
      }
    }
  `,
  GetRandomTag: `
    query GetRandomTag {
      RandomTag {slug}
    }
  `,
  AdminMetadataQuery: `
    query AdminMetadataQuery {
      AdminMetadata
    }
  `,
  MigrationsDashboardQuery: `
    query MigrationsDashboardQuery {
      MigrationsDashboard {
        migrations {
          name
          dateWritten
          runs { name started finished succeeded }
          lastRun
        }
      }
    }
  `,
  ElicitQuery: `
    query ElicitQuery($questionId: String) {
      ElicitBlockData(questionId: $questionId) {
       ${elicitDataFragment}
      }
    }
  `,
  PostAnalyticsQuery: `
    query PostAnalyticsQuery($postId: String!) {
      PostAnalytics(postId: $postId) {
        allViews
        uniqueClientViews
        uniqueClientViews10Sec
        medianReadingTime
        uniqueClientViews5Min
        uniqueClientViewsSeries {
          date
          uniqueClientViews
        }
      }
    }
  `,
  CoronaVirusData: `
    query CoronaVirusData {
      CoronaVirusData {
        range
        majorDimension
        values {
          accepted
          imp
          link
          shortDescription
          url
          description
          domain
          type
          reviewerThoughts
          foundVia
          sourceLink
          sourceLinkDomain
          lastUpdated
          title
          dateAdded
          category
        } 
      }
    }
  `,
  TagUpdatesInTimeBlock: `
    query TagUpdatesInTimeBlock($before: Date!, $after: Date!) {
      TagUpdatesInTimeBlock(before: $before, after: $after) {
        tag {
          ...TagBasicInfo
        }
        revisionIds
        commentCount
        commentIds
        lastRevisedAt
        lastCommentedAt
        added
        removed
        users {
          ...UsersMinimumInfo
        }
      }
    }
  `,
  ContinueReadingQuery: `
    query ContinueReadingQuery {
      ContinueReading {
        sequence {
          _id
          title
          gridImageId
          canonicalCollectionSlug
        }
        collection {
          _id
          title
          slug
          gridImageId
        }
        nextPost {
          ...PostsList
        }
        numRead
        numTotal
        lastReadTime
      }
    }
  `,
  PetrovDayLaunchResolvers: `
    query PetrovDayLaunchResolvers {
      PetrovDayCheckIfIncoming {
        launched
        createdAt
      }
    }
  `,
  RevisionsDiff: `
    query RevisionsDiff($collectionName: String!, $fieldName: String!, $id: String!, $beforeRev: String, $afterRev: String!, $trim: Boolean) {
      RevisionsDiff(collectionName: $collectionName, fieldName: $fieldName, id: $id, beforeRev: $beforeRev, afterRev: $afterRev, trim: $trim)
    }
  `,
};
