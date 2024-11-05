// TODO: maybe sort by first use instead of frequency?
export function countInstancesOfJargon(
  jargonTerm: JargonTermsPost | JargonTerms,
  post: PostsWithNavigationAndRevision | PostsWithNavigation | PostsPage | PostsEditQueryFragment,
  normalizedPostContents?: string
) {
  const postText = normalizedPostContents ?? (post.contents?.html ?? "").toLowerCase();
  const searchString = jargonTerm.term.toLowerCase();
  const altTerms = (jargonTerm.altTerms ?? []).map(altTerm => altTerm.toLowerCase());
  
  // Helper function to check if a character is part of a word
  const isWordChar = (char: string) => /[\p{L}\p{N}'-]/u.test(char);
  
  const countMatches = (term: string): number => {
    let count = 0;
    let index = postText.indexOf(term);
    
    while (index !== -1) {
      // Check word boundaries
      const prevChar = postText[index - 1];
      const nextChar = postText[index + term.length];
      
      const isPrevBoundary = !prevChar || !isWordChar(prevChar);
      const isNextBoundary = !nextChar || !isWordChar(nextChar);
      
      if (isPrevBoundary && isNextBoundary) {
        count++;
      }
      
      index = postText.indexOf(term, index + 1);
    }
    return count;
  };

  // Count main term and all alternate terms
  return countMatches(searchString) + altTerms.reduce((sum, term) => sum + countMatches(term), 0);
}
