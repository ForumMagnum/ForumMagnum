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
  const nextCoauthorUserIds = coauthorUserIds.filter((userId) =>
    userId !== promotedUserId && userId !== currentPrimaryUserId
  );

  if (currentPrimaryUserId && currentPrimaryUserId !== promotedUserId) {
    const insertionIndex = promotedIndex >= 0
      ? Math.min(promotedIndex, nextCoauthorUserIds.length)
      : 0;
    nextCoauthorUserIds.splice(insertionIndex, 0, currentPrimaryUserId);
  }

  return {
    userId: promotedUserId,
    coauthorUserIds: nextCoauthorUserIds,
  };
}
