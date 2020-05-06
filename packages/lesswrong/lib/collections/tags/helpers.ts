import Tag from './collection';

Tag.getUrl = (tag) => {
  return `/tag/${tag.slug}`
}
