
export const allQueries = {
  RecommendationsQuery: `query RecommendationsQuery($count: Int, $algorithm: JSON) {
    Recommendations(count: $count, algorithm: $algorithm) {
      ...PostsList
    }
  }`,
};
