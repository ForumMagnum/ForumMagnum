import { ensureIndex } from "../../collectionIndexUtils";
import PodcastEpisodes from "./collection"

declare global {
  interface PodcastEpisodesViewTerms extends ViewTermsBase {
    view?: PodcastEpisodesViewName
    _id?: string
    externalEpisodeId?: string
  }
}

PodcastEpisodes.addView("episodeByExternalId", (terms: PodcastEpisodesViewTerms) => {
  const { _id, externalEpisodeId } = terms;
  const selector = { _id, externalEpisodeId };
  return { selector };
});

ensureIndex(PodcastEpisodes, { externalEpisodeId: 1 }, { unique: true });
