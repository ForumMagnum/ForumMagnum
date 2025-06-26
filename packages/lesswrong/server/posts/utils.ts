import { cheerioParse } from "../utils/htmlUtil";
import type { FetchedFragment } from '../fetchFragment';
import { getLatestContentsRevision } from '../collections/revisions/helpers';

export const getPostHTML = async (
  post: DbPost|FetchedFragment<"PostsHTML">,
  context: ResolverContext,
): Promise<string> => {
  if ("contents" in post && post.contents) {
    return post.contents?.html ?? "";
  }
  const revision = await getLatestContentsRevision(post, context);
  return revision?.html ?? "";
}

export async function getDefaultPostLocationFields(post: Pick<CreatePostDataInput, "isEvent" | "groupId" | "location">, context: ResolverContext) {
  const { Localgroups } = context;
  if (post.isEvent && post.groupId && !post.location) {
    const localgroup = await Localgroups.findOne(post.groupId)
    if (!localgroup) throw Error(`Can't find localgroup to get default post location fields for post: ${post}`)
    const { location, googleLocation, mongoLocation } = localgroup
    return { location, googleLocation, mongoLocation }
  }
  return {}
}

export const getDialogueResponseIds = async (
  post: DbPost,
  context: ResolverContext,
): Promise<string[]> => {
  const html = await getPostHTML(post, context);
  if (!html) return [];

  const $ = cheerioParse(html);
  
  const messageIds: string[] = [];
  $('.dialogue-message').each((idx, element) => {
    const messageId = $(element).attr('message-id');
    if (messageId) messageIds.push(messageId);
  });
  
  return messageIds;
}

export const getDialogueMessageTimestamps = async (
  post: DbPost,
  context: ResolverContext,
): Promise<Date[]> => {
  const html = await getPostHTML(post, context);
  if (!html) return [];
  const $ = cheerioParse(html);
    
  const timestamps: Date[] = [];
  $('.dialogue-message').each((idx, element) => {
    const timestampString = $(element).attr('submitted-date');
    if (timestampString) timestamps.push(new Date(timestampString));
  }); 
  
  return timestamps
}
