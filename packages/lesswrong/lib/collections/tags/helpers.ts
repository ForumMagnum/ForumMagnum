import Tag from './collection';

Tag.getUrl = (tag: TagBasicInfo) => {
  return `/tag/${tag.slug}`
}
