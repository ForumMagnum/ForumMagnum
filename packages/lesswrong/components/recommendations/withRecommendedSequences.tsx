import { useQuery, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';

export interface RecommendedSequencesAlgorithm {
  count?: number
}

export const defaultAlgorithmSettings: RecommendedSequencesAlgorithm = {
  count: 3
}


// export const useRecommendations = (algorithm: RecommendationsAlgorithm): {
//   recommendationsLoading: boolean,
//   recommendations: PostsList[]|undefined,
// }=> {
//   const {data, loading} = useQuery(gql`
//     query RecommendationsQuery($count: Int, $algorithm: JSON) {
//       Recommendations(count: $count, algorithm: $algorithm) {
//         ...PostsList
//       }
//     }
//     ${fragmentTextForQuery("PostsList")}
//   `, {
//     variables: {
//       count: algorithm?.count || 10,
//       algorithm: algorithm || defaultAlgorithmSettings,
//     },
//     ssr: true,
//   });
//   return {
//     recommendationsLoading: loading,
//     recommendations: data?.Recommendations,
//   };
// }



export const useRecommendedSequences = (algorithm: RecommendedSequencesAlgorithm): {
  loading: boolean,
  results: SequencesPageFragment[]|undefined
} => {
  console.log("useRecommendedSequences")
  const { data, loading} = useQuery(gql`
    query RecommendedSequencesQuery($count: Int) {
      RecommendedSequences(count: $count) {
        ...SequencesPageFragment
      }
    }
    ${fragmentTextForQuery("SequencesPageFragment")}
  `, {
    variables: {
      count: algorithm?.count || 3
    },
    ssr: true
  })
  return {
    loading,
    results: data?.RecommendedSequences
  }
}