export const SurveyScheduleMinimumInfo = `
  fragment SurveyScheduleMinimumInfo on SurveySchedule {
    _id
    survey {
      ...SurveyMinimumInfo
    }
  }
`

export const SurveyScheduleEdit = `
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
`
