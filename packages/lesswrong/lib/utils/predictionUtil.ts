
export function percentageToBucket(percentage: number, numBuckets: number): number {
  return Math.floor((percentage/100.0) * numBuckets);
}

export function userCanMoveInlinePredictionToComment({ currentUserIsCreator, currentUserIsPostAuthor }: {
  currentUserIsCreator: boolean,
  currentUserIsPostAuthor: boolean,
}) {
  return currentUserIsCreator || currentUserIsPostAuthor;
}
