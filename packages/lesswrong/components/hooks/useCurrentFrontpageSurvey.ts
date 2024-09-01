import { useCallback } from "react";
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
  refetch: () => Promise<void>,
  loading: boolean,
} => {
  const {data, loading, refetch: refetch_} = useQuery(query, {
    skip: !hasSurveys,
    ssr: true,
  });
  const refetch = useCallback(async () => { await refetch_(); }, [refetch_]);
  return {
    survey: data?.CurrentFrontpageSurvey,
    refetch,
    loading,
  };
}
