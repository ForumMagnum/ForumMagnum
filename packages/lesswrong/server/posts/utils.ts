import Localgroups from '../../lib/collections/localgroups/collection';
import { cheerioParse } from "../utils/htmlUtil";

export async function getDefaultPostLocationFields(post: DbPost) {
  if (post.isEvent && post.groupId && !post.location) {
    const localgroup = await Localgroups.findOne(post.groupId)
    if (!localgroup) throw Error(`Can't find localgroup to get default post location fields for post: ${post}`)
    const { location, googleLocation, mongoLocation } = localgroup
    return { location, googleLocation, mongoLocation }
  }
  return {}
}

export const getDialogueResponseCount = (post:DbPost) => {
  const html = post.contents.originalContents.data;
  const parsedHtml= cheerioParse(html);
  
  const blocksWithId = parsedHtml('block[message-id]');
  const ids : string[] = blocksWithId.map( (i, block) => parsedHtml(block).attr('message-id')).get();
  
  return ids.length;
}

export const getDialogueMessageTimestamps = (post: DbPost): Date[] => {
  const html = post.contents.originalContents.data;
  const parsedHtml= cheerioParse(html);
  
  const blocksWithId = parsedHtml('block[message-id]');
  const timestampStrings = blocksWithId.map( (i, block) => (parsedHtml(block).attr('submitted-at'))).get();
  const timestamps = timestampStrings.map( dateString => new Date(dateString))
  
  return timestamps
}
