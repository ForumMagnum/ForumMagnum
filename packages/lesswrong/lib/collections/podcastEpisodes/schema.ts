import { foreignKeyField } from '../../utils/schemaUtils';
import { addUniversalFields } from "../../collectionUtils";

const schema: SchemaType<"PodcastEpisodes"> = {
  ...addUniversalFields({}),
  podcastId: {
    ...foreignKeyField({
      idFieldName: 'podcastId',
      resolverName: 'podcast',
      collectionName: 'Podcasts',
      type: 'Podcast',
      nullable: false
    }),
    optional: true, // ???
    nullable: false,
    canRead: ['guests'],
    canCreate: ['podcasters', 'admins']
  },
  title: {
    type: String,
    optional: false,
    canRead: ['guests'],
    canCreate: ['podcasters', 'admins']
  },
  episodeLink: {
    type: String,
    optional: false,
    canRead: ['guests'],
    canCreate: ['podcasters', 'admins']
  },
  externalEpisodeId: {
    type: String,
    optional: false,
    canRead: ['guests'],
    canCreate: ['podcasters', 'admins']
  }
};

export default schema;
