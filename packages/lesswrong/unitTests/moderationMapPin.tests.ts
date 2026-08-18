import { UNREVIEWED_MAP_LOCATION_UPDATE } from '@/lib/collections/moderatorActions/constants';
import { getUnreviewedMapPin, type MapPinUser } from '@/components/sunshineDashboard/supermod/helpers';

const baseAction: ModeratorActionDisplay = {
  _id: 'map-action',
  userId: 'user-id',
  type: UNREVIEWED_MAP_LOCATION_UPDATE,
  active: true,
  createdAt: '2026-08-17T12:00:00.000Z',
  endedAt: null,
  user: null,
};

function createUser(overrides: Partial<MapPinUser> = {}): MapPinUser {
  return {
    mapLocation: {
      formatted_address: 'Berkeley, CA, USA',
      geometry: { location: { lat: 37.8715, lng: -122.273 } },
    },
    mapMarkerText: 'I organize alignment meetups.',
    htmlMapMarkerText: '<p>I organize alignment meetups.</p>',
    moderatorActions: [baseAction],
    lastRemovedFromReviewQueueAt: null,
    ...overrides,
  };
}

describe('getUnreviewedMapPin', () => {
  test('builds a moderation item with the public pin contents', () => {
    expect(getUnreviewedMapPin(createUser())).toEqual({
      contentType: 'mapPin',
      _id: 'map-pin-map-action',
      postedAt: '2026-08-17T12:00:00.000Z',
      formattedAddress: 'Berkeley, CA, USA',
      latitude: 37.8715,
      longitude: -122.273,
      mapMarkerText: 'I organize alignment meetups.',
      htmlMapMarkerText: '<p>I organize alignment meetups.</p>',
    });
  });

  test('uses the newest fresh map-pin action even when actions are unsorted', () => {
    const newerAction = {
      ...baseAction,
      _id: 'newer-action',
      createdAt: '2026-08-17T13:00:00.000Z',
    };
    const pin = getUnreviewedMapPin(createUser({ moderatorActions: [baseAction, newerAction] }));

    expect(pin?._id).toBe('map-pin-newer-action');
    expect(pin?.postedAt).toBe(newerAction.createdAt);
  });

  test('omits pins whose review action is inactive or stale', () => {
    const inactiveUser = createUser({
      moderatorActions: [{ ...baseAction, active: false }],
    });
    const staleUser = createUser({
      lastRemovedFromReviewQueueAt: '2026-08-17T12:30:00.000Z',
    });

    expect(getUnreviewedMapPin(inactiveUser)).toBeNull();
    expect(getUnreviewedMapPin(staleUser)).toBeNull();
  });

  test('omits a removed map pin', () => {
    expect(getUnreviewedMapPin(createUser({ mapLocation: null }))).toBeNull();
  });
});
