import moment from 'moment';
import { randomId } from '@/lib/random';
import { UltraFeedResolverType } from '@/components/ultraFeed/ultraFeedTypes';

export const TIME_MARKER_BUCKET_SIZE_HOURS = 3;

export type SubscribedFeedEntryType = 'feedPost' | 'feedCommentThread' | 'feedSubscriptionSuggestions';

/**
 * Inserts "Day" and "TimeBucket" markers into the feed items list.
 *
 * - A "Day" marker is inserted when the date (in the user's timezone) changes.
 * - A "TimeBucket" marker is inserted when the time bucket (e.g., 3-hour block) changes within the same day.
 *
 * The logic assumes the input items are sorted by date descending (newest first).
 * Markers are placed *before* the first item of the new period to visually separate it from the previous (newer) period.
 * 
 * Timezone offset is used to adjust the date to the user's local time so that day and time bucket markers appear aligned to 00:00 to the user's timezone.
 */
export function insertTimeMarkers(
  pageItems: Array<{ type: SubscribedFeedEntryType; sortDate: Date }>,
  baseResults: UltraFeedResolverType[],
  timezoneOffset: number,
  cutoff?: Date | null,
  bucketSizeHours: number = TIME_MARKER_BUCKET_SIZE_HOURS,
): UltraFeedResolverType[] {
  const resultsWithMarkers: UltraFeedResolverType[] = [];
  let lastEmittedSortDate: Date | null = cutoff ?? null;
  
  let lastEmittedDayKey: string | null = cutoff ? getDayKey(cutoff, timezoneOffset) : null;
  let lastEmittedBucketKey: string | null = cutoff ? getBucketKey(cutoff, timezoneOffset, bucketSizeHours) : null;

  for (let i = 0; i < pageItems.length; i++) {
    const item = pageItems[i];
    const result = baseResults[i];
    if (!result) continue;

    // Skip markers for suggestion blocks, they don't have meaningful dates for this purpose
    if (item.type !== 'feedSubscriptionSuggestions') {
      const currentDayKey = getDayKey(item.sortDate, timezoneOffset);
      const currentBucketKey = getBucketKey(item.sortDate, timezoneOffset, bucketSizeHours);

      // If the day changed, insert a day marker (and reset the bucket tracker)
      if (lastEmittedDayKey && currentDayKey !== lastEmittedDayKey && lastEmittedSortDate) {
        resultsWithMarkers.push(createMarkerEntry('day', lastEmittedSortDate, lastEmittedDayKey, timezoneOffset, i));
        lastEmittedBucketKey = null;
      } 
      // Otherwise, if the time bucket changed, insert a bucket marker
      else if (lastEmittedBucketKey && currentBucketKey !== lastEmittedBucketKey && lastEmittedSortDate) {
        resultsWithMarkers.push(createMarkerEntry('timeBucket', lastEmittedSortDate, lastEmittedBucketKey, timezoneOffset, i, bucketSizeHours));
      }
    }

    resultsWithMarkers.push(result);

    if (item.type !== 'feedSubscriptionSuggestions') {
      lastEmittedSortDate = item.sortDate;
      lastEmittedDayKey = getDayKey(item.sortDate, timezoneOffset);
      lastEmittedBucketKey = getBucketKey(item.sortDate, timezoneOffset, bucketSizeHours);
    }
  }

  return resultsWithMarkers;
}

function createMarkerEntry(
  type: 'day' | 'timeBucket',
  referenceDate: Date,
  key: string,
  timezoneOffset: number,
  index: number,
  bucketSizeHours?: number,
): UltraFeedResolverType {
  const adjustedDate = getAdjustedDate(referenceDate, timezoneOffset);
  let startOfBlockUserTime: moment.Moment;
  
  if (type === 'day') {
    startOfBlockUserTime = moment.utc(adjustedDate).startOf('day');
  } else {
    const startOfHour = moment.utc(adjustedDate).startOf('hour');
    const hourBucket = Math.floor(startOfHour.hour() / (bucketSizeHours || 1));
    startOfBlockUserTime = startOfHour.clone().hour(hourBucket * (bucketSizeHours || 1));
  }
  
  // Convert back to UTC timestamp for the marker
  const startOfBlockUtc = new Date(startOfBlockUserTime.valueOf() + (timezoneOffset * 60 * 1000));

  return {
    type: 'feedMarker',
    feedMarker: {
      _id: `feed-marker-${type}-${key}-${index}-${randomId()}`,
      markerType: type,
      timestamp: startOfBlockUtc,
    },
  };
}

function getAdjustedDate(date: Date, timezoneOffset: number): Date {
  // Adjust date by timezone offset (in minutes) to get "user local time" as a UTC date object
  return new Date(date.getTime() - (timezoneOffset * 60 * 1000));
}

function getDayKey(date: Date, timezoneOffset: number) {
  const adjustedDate = getAdjustedDate(date, timezoneOffset);
  return moment.utc(adjustedDate).format('YYYY-MM-DD');
}

function getBucketKey(date: Date, timezoneOffset: number, bucketSizeHours: number) {
  const adjustedDate = getAdjustedDate(date, timezoneOffset);
  const rounded = moment.utc(adjustedDate).startOf('hour');
  const hourBucket = Math.floor(rounded.hour() / bucketSizeHours);
  return `${rounded.format('YYYY-MM-DD')}-${hourBucket}`;
}
