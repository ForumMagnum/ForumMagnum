export function getAverageContentKarma(content: VoteableType[]) {
  const runningContentKarma = content.reduce((prev, curr) => prev + curr.baseScore, 0);
  return runningContentKarma / content.length;
}

export function isLowAverageKarmaContent(content: VoteableType[], contentType: 'post' | 'comment') {
  if (!content.length) return { lowAverage: false };
  
  const lastNContent = contentType === 'comment' ? 10 : 5;
  const karmaThreshold = contentType === 'comment' ? 1.5 : 5;

  if (content.length < lastNContent) return { lowAverage: false };

  const lastNContentItems = content.slice(0, lastNContent);
  const averageContentKarma = getAverageContentKarma(lastNContentItems);

  const lowAverage = averageContentKarma < karmaThreshold;
  return { lowAverage, averageContentKarma };
}
