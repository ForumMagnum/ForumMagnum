import { UNREVIEWED_MAP_LOCATION_UPDATE } from '@/lib/collections/moderatorActions/constants';
import { getFreshReviewTriggerActions } from '@/lib/collections/users/reviewGroups';

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

export function areAllContentPermissionsDisabled(user: {
  postingDisabled?: boolean | null;
  allCommentingDisabled?: boolean | null;
  conversationsDisabled?: boolean | null;
  votingDisabled?: boolean | null;
}): boolean {
  return !!(
    user.postingDisabled &&
    user.allCommentingDisabled &&
    user.conversationsDisabled &&
    user.votingDisabled
  );
}

export function isPost(item: ContentItem): item is SunshinePostsList {
  return 'title' in item && item.title !== null;
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

export function canRejectContent(item: ContentItem | null | undefined) {
  return !!item && !item.rejected && item.authorIsUnreviewed;
}

const CONTENT_TITLE_MAX_LENGTH = 25;

/** One-line label for a post or comment */
export function getContentTitle(item: ContentItem) {
  const title = (isPost(item) ? item.title : item.contents?.plaintextMainText) ?? "comment";
  return title.length > CONTENT_TITLE_MAX_LENGTH
    ? `${title.slice(0, CONTENT_TITLE_MAX_LENGTH).trimEnd()}…`
    : title;
}
