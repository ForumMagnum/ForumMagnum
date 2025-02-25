import { useCallback, useMemo } from "react";
import { countInstancesOfJargon } from "../jargon/utils";

export function useJargonCounts<T extends JargonTermsPost | JargonTerms>(post: PostsEditQueryFragment | PostsPage | PostsWithNavigationAndRevision | PostsWithNavigation, glossaryTerms: Array<T>) {
  // Memoize the normalized post contents
  const normalizedPostContents = useMemo(() => 
    (post.contents?.html ?? "").toLowerCase(),
    [post.contents?.html]
  );

  // Memoize the term counts
  const termCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    glossaryTerms.forEach(term => {
      counts.set(term._id, countInstancesOfJargon(term, post, normalizedPostContents));
    });
    
    return counts;
  }, [glossaryTerms, normalizedPostContents, post]);

  // Helper function to get count for a term
  const getCount = useCallback((term: JargonTermsPost | JargonTerms) => termCounts.get(term._id) ?? 0, [termCounts]);

  // Helper function to sort terms by count
  const sortedTerms = useMemo(() => {
    return [...glossaryTerms].sort((a, b) => getCount(b) - getCount(a));
  }, [getCount, glossaryTerms]);

  return {
    getCount,
    sortedTerms,
    normalizedPostContents
  };
}
