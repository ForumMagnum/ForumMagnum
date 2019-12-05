import { registerMigration, fillDefaultValues } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';
import Users from 'meteor/vulcan:users';


registerMigration({
  name: "setDefaultEventSubscriptionType",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationEventInRadius",
    });
    await recomputeDenormalizedValues({collectionName: "Users", fieldName: "nearbyEventsNotificationsMongoLocation"})
    await recomputeDenormalizedValues({collectionName: "Users", fieldName: "mongoLocation"})
  },
});
