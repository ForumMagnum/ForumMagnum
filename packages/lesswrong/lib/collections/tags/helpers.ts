import Tags from './collection';

Tags.getUrl = (tag: TagBasicInfo, { flagId, edit } = {}) => {
  const url = `/tag/${tag.slug}`
  if (flagId && edit) return `${url}?flagId=${flagId}&edit=${edit}`
  if (flagId) return `${url}?flagId=${flagId}`
  if (edit) return `${url}?edit=${edit}`
  return url
}
