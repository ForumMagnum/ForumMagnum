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

export const getDialogueResponseIds = (post:DbPost) => {
  const html = post.contents.originalContents?.data
  if (!html) return [];

  const $ = cheerioParse(html);
  
  const messageIds: string[] = [];
  $('.dialogue-message').each((idx, element) => {
    const messageId = $(element).attr('message-id');
    if (messageId) messageIds.push(messageId);
  });
  
  return messageIds;
}

export const getDialogueMessageTimestamps = (post: DbPost): Date[] => {
  const html = post.contents.originalContents?.data
  if (!html) return [];
  const $ = cheerioParse(html);
    
  const timestamps: Date[] = [];
  $('.dialogue-message').each((idx, element) => {
    const timestampString = $(element).attr('submitted-date');
    if (timestampString) timestamps.push(new Date(timestampString));
  }); 
  
  return timestamps
}
