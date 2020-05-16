import Tag from './collection';

Tag.getUrl = (tag: TagPreviewFragment) => {
  return `/tag/${tag.slug}`
}
