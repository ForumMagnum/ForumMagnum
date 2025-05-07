import { useCallback } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery";
import { fragmentTextForQuery } from "@/lib/vulcan-lib/fragments";
import { hasSurveys } from "@/lib/betas";


export const useCurrentFrontpageSurvey = (): {
  survey?: SurveyScheduleMinimumInfo,
  refetch: () => Promise<void>,
  loading: boolean,
} => {
  const {data, loading, refetch: refetch_} = useQuery(gql`
    query CurrentFrontpageSurvey {
      CurrentFrontpageSurvey {
        ...SurveyScheduleMinimumInfo
      }
    }
    ${fragmentTextForQuery("SurveyScheduleMinimumInfo")}
  `, {
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
