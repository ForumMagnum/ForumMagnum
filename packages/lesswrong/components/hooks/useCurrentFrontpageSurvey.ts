import { getFragment } from "@/lib/vulcan-lib";
import { gql, useQuery } from "@apollo/client";

const query = gql`
  query CurrentFrontpageSurvey {
    CurrentFrontpageSurvey {
      ...SurveyMinimumInfo
    }
  }
  ${getFragment("SurveyMinimumInfo")}
`;

export const useCurrentFrontpageSurvey = (): {
  survey?: SurveyMinimumInfo,
  loading: boolean,
} => {
  const {data: survey, loading} = useQuery(query, {ssr: true});
  return {survey: survey?.CurrentFrontpageSurvey, loading};
}
