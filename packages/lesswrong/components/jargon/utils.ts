// TODO: maybe sort by first use instead of frequency?
export function countInstancesOfJargon(jargonTerm: JargonTermsPost | JargonTerms, post: PostsWithNavigationAndRevision | PostsWithNavigation | PostsPage) {
  const jargonVariants = [jargonTerm.term.toLowerCase(), ...(jargonTerm.altTerms ?? []).map(altTerm => altTerm.toLowerCase())];
  const regex = new RegExp(`\\b(${jargonVariants.join('|')})\\b`, 'gi');
  const normalizedPostContents = (post.contents?.html ?? "").toLowerCase();

  return normalizedPostContents.match(regex)?.length ?? 0;
}
