import Localgroups from '../../lib/collections/localgroups/collection';

export function getDefaultPostLocationFields(post) {
  if (post.isEvent && post.groupId && !post.location) {
    const { location, googleLocation, mongoLocation } = Localgroups.findOne(post.groupId)
    return { location, googleLocation, mongoLocation }
  }
  return {}
}
