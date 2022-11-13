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
    insertableBy: ['podcasters', 'admins']
  },
  title: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    insertableBy: ['podcasters', 'admins']
  },
  episodeLink: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    insertableBy: ['podcasters', 'admins']
  },
  externalEpisodeId: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    insertableBy: ['podcasters', 'admins']
  }
};

export default schema;
