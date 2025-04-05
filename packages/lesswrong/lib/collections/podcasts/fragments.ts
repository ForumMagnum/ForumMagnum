import { frag } from "@/lib/fragments/fragmentWrapper";

export const PodcastSelect = () => frag`
  fragment PodcastSelect on Podcast {
    _id
    title
  }
`
