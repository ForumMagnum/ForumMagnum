export interface PrimaryAuthorTransferInput {
  currentPrimaryUserId: string | null | undefined;
  coauthorUserIds: string[];
  promotedUserId: string;
}

export interface PrimaryAuthorTransferFields {
  userId: string;
  coauthorUserIds: string[];
}

export function getPrimaryAuthorTransferFields({
  currentPrimaryUserId,
  coauthorUserIds,
  promotedUserId,
}: PrimaryAuthorTransferInput): PrimaryAuthorTransferFields {
  const promotedIndex = coauthorUserIds.indexOf(promotedUserId);
  const nextCoauthorUserIds = coauthorUserIds.filter((userId) => userId !== promotedUserId);

  if (
    currentPrimaryUserId &&
    currentPrimaryUserId !== promotedUserId &&
    !nextCoauthorUserIds.includes(currentPrimaryUserId)
  ) {
    const insertionIndex = promotedIndex >= 0
      ? Math.min(promotedIndex, nextCoauthorUserIds.length)
      : 0;
    nextCoauthorUserIds.splice(insertionIndex, 0, currentPrimaryUserId);
  }

  const seenUserIds = new Set<string>();
  const dedupedCoauthorUserIds = nextCoauthorUserIds.filter((userId) => {
    if (seenUserIds.has(userId)) {
      return false;
    }
    seenUserIds.add(userId);
    return true;
  });

  return {
    userId: promotedUserId,
    coauthorUserIds: dedupedCoauthorUserIds,
  };
}
