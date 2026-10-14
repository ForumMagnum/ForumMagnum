import moment from 'moment';
import { UNREVIEWED_MAP_LOCATION_UPDATE } from '@/lib/collections/moderatorActions/constants';
import { getFreshReviewTriggerActions } from '@/lib/collections/users/reviewGroups';

export type ContentItem = SunshinePostsList | SunshineCommentsList;

export const POSITIVE_KARMA = 2;

export const CONTENT_PERIODS = [
  { label: 'Last 30 days', shortLabel: '30d', startsAgo: moment.duration(30, 'days') },
  { label: 'Last year', shortLabel: '1y', startsAgo: moment.duration(1, 'year') },
  { label: 'Older', shortLabel: 'older', startsAgo: null },
];

export function getContentPeriodIndex(postedAt: string, now: moment.Moment) {
  return CONTENT_PERIODS.findIndex(({ startsAgo }) => !startsAgo || moment(postedAt).isAfter(now.clone().subtract(startsAgo)));
}

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

  return items.sort((a, b) =>
    Number(needsDecision(b)) - Number(needsDecision(a))
    || new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}

export function needsDecision(item: ModerationContentItem) {
  return isMapPin(item) || isAwaitingReview(item);
}

export function isAwaitingReview(item: { rejected: boolean, authorIsUnreviewed: boolean, deleted?: boolean, draft?: boolean | null }) {
  return !item.rejected && item.authorIsUnreviewed && !item.deleted && !item.draft;
}

export function canRejectContent(item: ContentItem | null | undefined) {
  return !!item && !item.rejected;
}

const CONTENT_TITLE_MAX_LENGTH = 25;

/** One-line label for a post or comment */
export function getContentTitle(item: ContentItem) {
  const title = (isPost(item) ? item.title : item.contents?.plaintextMainText) ?? "comment";
  return title.length > CONTENT_TITLE_MAX_LENGTH
    ? `${title.slice(0, CONTENT_TITLE_MAX_LENGTH).trimEnd()}…`
    : title;
}
