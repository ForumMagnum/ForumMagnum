import { ensureIndex } from "../../collectionUtils";
import PodcastEpisodes from "./collection"

declare global {
  interface PodcastEpisodesViewTerms extends ViewTermsBase {
    view?: PodcastEpisodesViewName
    _id?: string
    externalEpisodeId?: string
  }
}

PodcastEpisodes.addView("episodeByExternalId", (terms: PodcastEpisodesViewTerms) => {
  const selector = terms._id ? { _id: terms._id } : { externalEpisodeId: terms.externalEpisodeId };
  return { selector };
});

ensureIndex(PodcastEpisodes, { externalEpisodeId: 1 }, { unique: true });
