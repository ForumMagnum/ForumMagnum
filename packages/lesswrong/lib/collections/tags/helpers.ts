import Tags from './collection';

Tags.getUrl = (tag: TagBasicInfo, urlOptions) => {
  const { flagId, edit } = urlOptions || {};
  const url = `/tag/${tag.slug}`
  if (flagId && edit) return `${url}?flagId=${flagId}&edit=${edit}`
  if (flagId) return `${url}?flagId=${flagId}`
  if (edit) return `${url}?edit=${edit}`
  return url
}
