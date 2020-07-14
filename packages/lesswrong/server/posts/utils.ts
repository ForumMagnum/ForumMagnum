import Localgroups from '../../lib/collections/localgroups/collection';

export function getDefaultPostLocationFields(post) {
  if (post.isEvent && post.groupId && !post.location) {
    const localgroup = Localgroups.findOne(post.groupId)
    if (!localgroup) throw Error(`Can't find localgroup to get default post location fields for post: ${post}`)
    const { location, googleLocation, mongoLocation } = localgroup
    return { location, googleLocation, mongoLocation }
  }
  return {}
}
