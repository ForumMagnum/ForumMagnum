import schema from '@/lib/collections/podcasts/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";

export const Podcasts: PodcastsCollection = createCollection({
  collectionName: 'Podcasts',
  typeName: 'Podcast',
  schema,
  resolvers: getDefaultResolvers('Podcasts')
});


export default Podcasts;
