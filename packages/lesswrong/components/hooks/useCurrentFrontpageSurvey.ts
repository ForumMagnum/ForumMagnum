import { useCallback } from "react";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { hasSurveys } from "@/lib/betas";


export const useCurrentFrontpageSurvey = (): {
  survey?: SurveyScheduleMinimumInfo,
  refetch: () => Promise<void>,
  loading: boolean,
} => {
  const {data, loading, refetch: refetch_} = useQuery(gql(`
    query CurrentFrontpageSurvey {
      CurrentFrontpageSurvey {
        ...SurveyScheduleMinimumInfo
      }
    }
  `), {
    skip: !hasSurveys,
    ssr: true,
  });
  const refetch = useCallback(async () => { await refetch_(); }, [refetch_]);
  return {
    survey: data?.CurrentFrontpageSurvey ?? undefined,
    refetch,
    loading,
  };
}
