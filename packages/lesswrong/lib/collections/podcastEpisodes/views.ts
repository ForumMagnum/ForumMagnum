import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface PodcastEpisodesViewTerms extends ViewTermsBase {
    view?: PodcastEpisodesViewName
    _id?: string
    externalEpisodeId?: string
  }
}

function episodeByExternalId(terms: PodcastEpisodesViewTerms) {
  const { _id, externalEpisodeId } = terms;
  const selector = { _id, externalEpisodeId };
  return { selector };
}

export const PodcastEpisodesViews = new CollectionViewSet('PodcastEpisodes', {
  episodeByExternalId
});
