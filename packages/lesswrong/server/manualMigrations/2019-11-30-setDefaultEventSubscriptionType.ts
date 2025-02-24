import { registerMigration, fillDefaultValues } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';
import Users from '../../lib/collections/users/collection';


export default registerMigration({
  name: "setDefaultEventSubscriptionType",
  dateWritten: "2019-11-30",
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
