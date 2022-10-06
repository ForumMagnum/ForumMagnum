const schema: SchemaType<DbPodcast> = {
  title: {
    type: String,
    optional: false,
    viewableBy: ['guests']
  },
  applePodcastLink: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    nullable: true
  },
  spotifyPodcastLink: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    nullable: true
  }
};

export default schema;
