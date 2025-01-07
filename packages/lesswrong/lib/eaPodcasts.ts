import type { ReactNode } from "react";
import { applePodcastsLogoIcon } from "../components/icons/ApplePodcastsLogoIcon";
import { pocketCastsLogoIcon } from "../components/icons/PocketCastsLogoIcon";
import { podcastAddictLogoIcon } from "../components/icons/PodcastAddictLogoIcon";
import { spotifyLogoIcon } from "../components/icons/SpotifyLogoIcon";

export const podcastPost = "/posts/K5Snxo5EhgmwJJjR2/announcing-ea-forum-podcast-audio-narrations-of-ea-forum";

export type PodcastData = {
  url: string,
  icon: ReactNode,
  name: string,
}

export const podcasts: PodcastData[] = [
  {
    url: "https://open.spotify.com/show/3NwXq1GGCveAbeH1Sk3yNq",
    icon: spotifyLogoIcon,
    name: "Spotify"
  }, {
    url: "https://podcasts.apple.com/us/podcast/1657526204",
    icon: applePodcastsLogoIcon,
    name: "Apple Podcasts"
  }, {
    url: "https://pca.st/zlt4n89d",
    icon: pocketCastsLogoIcon,
    name: "Pocket Casts"
  }, {
    url: "https://podcastaddict.com/podcast/ea-forum-podcast-curated-popular/4160487",
    icon: podcastAddictLogoIcon,
    name: "Podcast Addict"
  },
];

export const getPodcastDataByName = (podcastName: string): PodcastData | undefined =>
  podcasts.find(({name}) => name === podcastName);
