interface MarkdownUserProfileCandidate {
  slug?: string | null;
  bio?: string | null;
  karma?: number | null;
  afKarma?: number | null;
  postCount?: number | null;
  commentCount?: number | null;
}

const getProfileActivityScore = (user: MarkdownUserProfileCandidate): number => {
  const bio = user.bio?.trim() ?? "";
  const karma = Math.max(user.karma ?? 0, 0);
  const afKarma = Math.max(user.afKarma ?? 0, 0);
  const postCount = Math.max(user.postCount ?? 0, 0);
  const commentCount = Math.max(user.commentCount ?? 0, 0);

  return karma + afKarma + (postCount * 100) + commentCount + (bio.length > 0 ? 2 : 0);
};

const hasMeaningfulPublicProfile = (user: MarkdownUserProfileCandidate): boolean => {
  const bio = user.bio?.trim() ?? "";
  return getProfileActivityScore(user) > 1 || bio.length > 0;
};

export const selectMarkdownUserProfile = <T extends MarkdownUserProfileCandidate>(
  requestedSlug: string,
  candidates: readonly T[],
): T | null => {
  if (candidates.length === 0) {
    return null;
  }

  const exactSlugMatch = candidates.find((candidate) => candidate.slug === requestedSlug);
  if (exactSlugMatch && hasMeaningfulPublicProfile(exactSlugMatch)) {
    return exactSlugMatch;
  }

  const bestCandidate = candidates.reduce<T>((best, candidate) => (
    getProfileActivityScore(candidate) > getProfileActivityScore(best)
      ? candidate
      : best
  ), candidates[0]);

  return getProfileActivityScore(bestCandidate) > getProfileActivityScore(exactSlugMatch ?? candidates[0])
    ? bestCandidate
    : exactSlugMatch ?? bestCandidate;
};
