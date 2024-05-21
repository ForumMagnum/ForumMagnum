import { foreignKeyField } from '../../utils/schemaUtils';

const schema: SchemaType<"PodcastEpisodes"> = {
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
