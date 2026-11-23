import { UNREVIEWED_MAP_LOCATION_UPDATE } from '@/lib/collections/moderatorActions/constants';
import { getFreshReviewTriggerActions, isAwaitingReview as isDocumentAwaitingReview } from '@/lib/collections/users/reviewGroups';

export type ContentItem = SunshinePostsList | SunshineCommentsList;

export interface ModerationMapPinItem {
  contentType: 'mapPin';
  _id: string;
  postedAt: string;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  mapMarkerText: string | null;
  htmlMapMarkerText: string | null;
}

export type ModerationContentItem = ContentItem | ModerationMapPinItem;

type MapPinUserFields = Pick<
  SunshineUsersList,
  'mapLocation' | 'mapMarkerText' | 'htmlMapMarkerText' | 'moderatorActions' | 'lastRemovedFromReviewQueueAt'
>;

const contentPermissionFields = [
  'postingDisabled',
  'allCommentingDisabled',
  'conversationsDisabled',
  'votingDisabled',
] as const;

export type ContentPermissionField = typeof contentPermissionFields[number];

type ContentPermissionFlags = Partial<Record<ContentPermissionField, boolean | null>>;

export function areAllContentPermissionsDisabled(user: ContentPermissionFlags): boolean {
  return contentPermissionFields.every(field => !!user[field]);
}

export function isAnyContentPermissionDisabled(user: ContentPermissionFlags): boolean {
  return contentPermissionFields.some(field => !!user[field]);
}

export function isPost(item: ContentItem): item is SunshinePostsList {
  return item.__typename === 'Post';
};

export function isMapPin(item: ModerationContentItem): item is ModerationMapPinItem {
  return 'contentType' in item && item.contentType === 'mapPin';
}

export function getUnreviewedMapPin(user: MapPinUserFields): ModerationMapPinItem | null {
  if (!user.mapLocation) return null;

  const latestMapPinAction = getFreshReviewTriggerActions(
    user.moderatorActions ?? [],
    user.lastRemovedFromReviewQueueAt,
  )
    .filter(action => action.type === UNREVIEWED_MAP_LOCATION_UPDATE)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (!latestMapPinAction) return null;

  const formattedAddress = typeof user.mapLocation.formatted_address === 'string'
    ? user.mapLocation.formatted_address
    : null;
  const latitude = typeof user.mapLocation.geometry?.location?.lat === 'number'
    ? user.mapLocation.geometry.location.lat
    : null;
  const longitude = typeof user.mapLocation.geometry?.location?.lng === 'number'
    ? user.mapLocation.geometry.location.lng
    : null;

  return {
    contentType: 'mapPin',
    _id: `map-pin-${latestMapPinAction._id}`,
    postedAt: latestMapPinAction.createdAt,
    formattedAddress,
    latitude,
    longitude,
    mapMarkerText: user.mapMarkerText,
    htmlMapMarkerText: user.htmlMapMarkerText,
  };
}

export function getModerationContentItems(
  user: MapPinUserFields,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[],
): ModerationContentItem[] {
  const mapPin = getUnreviewedMapPin(user);
  const items: ModerationContentItem[] = mapPin
    ? [...posts, ...comments, mapPin]
    : [...posts, ...comments];

  return items.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
}

export function isAwaitingReview(item: ContentItem) {
  return isDocumentAwaitingReview(item, isPost(item) ? 'Posts' : 'Comments');
}

export function canRejectContent(item: ContentItem | null | undefined) {
  return !!item && !item.rejected;
}

export interface IndexedRejectableContent {
  _id: string;
  rejected?: boolean | null;
  authorIsUnreviewed?: boolean | null;
}

/**
 * Finds the next unapproved item after `currentContentId`, wrapping around the
 * list once. The current item is never returned, even before its optimistic
 * rejection has reached the Apollo cache.
 */
export function getNextUnapprovedContentIndex(items: IndexedRejectableContent[], currentContentId: string) {
  const currentIndex = items.findIndex(item => item._id === currentContentId);
  for (let offset = 1; offset <= items.length; offset++) {
    const candidateIndex = (currentIndex + offset) % items.length;
    const candidate = items[candidateIndex];
    if (candidate._id !== currentContentId && !candidate.rejected && !!candidate.authorIsUnreviewed) {
      return candidateIndex;
    }
  }

  return null;
}

/** Whether a keyboard event target is a place the moderator is typing, so plain-letter shortcuts should be ignored */
export function isInTextInput(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

const CONTENT_TITLE_MAX_LENGTH = 25;

/** One-line label for a post or comment */
export function getContentTitle(item: ContentItem) {
  const title = (isPost(item) ? item.title : item.contents?.plaintextMainText) ?? "comment";
  return title.length > CONTENT_TITLE_MAX_LENGTH
    ? `${title.slice(0, CONTENT_TITLE_MAX_LENGTH).trimEnd()}…`
    : title;
}
