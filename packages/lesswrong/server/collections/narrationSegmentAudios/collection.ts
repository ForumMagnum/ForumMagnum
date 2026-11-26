import schema from '@/lib/collections/narrationSegmentAudios/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const NarrationSegmentAudios: NarrationSegmentAudiosCollection = createCollection({
  collectionName: 'NarrationSegmentAudios',
  typeName: 'NarrationSegmentAudio',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex(
      'NarrationSegmentAudios',
      { narrationSegmentId: 1, voiceId: 1, modelId: 1, stability: 1, similarityBoost: 1, style: 1, speed: 1 },
      { unique: true, name: "NarrationSegmentAudios_segment_settings" },
    );
    return indexSet;
  },
});

export default NarrationSegmentAudios;
