import Tags from './collection';

Tags.getUrl = (tag: TagBasicInfo) => {
  return `/tag/${tag.slug}`
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
