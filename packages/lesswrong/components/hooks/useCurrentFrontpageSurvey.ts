import { gql, useQuery } from "@apollo/client";
import { getFragment } from "@/lib/vulcan-lib";
import { hasSurveys } from "@/lib/betas";

const query = gql`
  query CurrentFrontpageSurvey {
    CurrentFrontpageSurvey {
      ...SurveyScheduleMinimumInfo
    }
  }
  ${getFragment("SurveyScheduleMinimumInfo")}
`;

export const useCurrentFrontpageSurvey = (): {
  survey?: SurveyScheduleMinimumInfo,
  loading: boolean,
} => {
  const {data: survey, loading} = useQuery(query, {
    skip: !hasSurveys,
    ssr: true,
  });
  return {survey: survey?.CurrentFrontpageSurvey, loading};
}
