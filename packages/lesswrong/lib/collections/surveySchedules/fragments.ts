import { gql } from "@/lib/generated/gql-codegen";

export const SurveyScheduleMinimumInfo = gql(`
  fragment SurveyScheduleMinimumInfo on SurveySchedule {
    _id
    survey {
      ...SurveyMinimumInfo
    }
  }
`)

export const SurveyScheduleEdit = gql(`
  fragment SurveyScheduleEdit on SurveySchedule {
    ...SurveyScheduleMinimumInfo
    surveyId
    name
    impressionsLimit
    maxVisitorPercentage
    minKarma
    maxKarma
    target
    startDate
    endDate
    deactivated
    createdAt
  }
`)
