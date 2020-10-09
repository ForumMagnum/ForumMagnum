import Tags from './collection';

Tags.getUrl = (tag: DbTag|TagBasicInfo, urlOptions) => {
  const { flagId, edit } = urlOptions || {};
  const url = `/tag/${tag.slug}`
  if (flagId && edit) return `${url}?flagId=${flagId}&edit=${edit}`
  if (flagId) return `${url}?flagId=${flagId}`
  if (edit) return `${url}?edit=${edit}`
  return url
}

Tags.getDiscussionUrl = (tag: DbTag|TagBasicInfo) => {
  return `/tag/${tag.slug}/discussion`
}

Tags.getCommentLink = (tag: DbTag|TagBasicInfo, commentId: string): string => {
  return `/tag/${tag.slug}/discussion#${commentId}`
}

Tags.getRevisionLink = (tag: DbTag|TagBasicInfo, versionNumber: string): string => {
  return `/tag/${tag.slug}?version=${versionNumber}`;
}
