import schema from '@/lib/collections/revisions/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections";

export const Revisions = createCollection({
  collectionName: 'Revisions',
  typeName: 'Revision',
  schema,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export interface ChangeMetrics {
  added: number
  removed: number
}

export default Revisions;
