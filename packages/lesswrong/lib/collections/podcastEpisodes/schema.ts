import { foreignKeyField } from '../../utils/schemaUtils';

const schema: SchemaType<DbPodcastEpisode> = {
  podcastId: {
      ...foreignKeyField({
      idFieldName: 'podcastId',
      resolverName: 'podcast',
      collectionName: 'Podcasts',
      type: 'Podcast',
      nullable: false
    }),
    optional: true, // ???
    viewableBy: ['guests'],
  },
  title: {
    type: String,
    optional: false,
    viewableBy: ['guests']
  },
  episodeLink: {
    type: String,
    optional: false,
    viewableBy: ['guests']
  },
  externalEpisodeId: {
    type: String,
    optional: false,
    viewableBy: ['guests']
  }
};

export default schema;