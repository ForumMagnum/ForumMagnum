import { frag } from "@/lib/fragments/fragmentWrapper";

export const PodcastSelect = () => gql`
  fragment PodcastSelect on Podcast {
    _id
    title
  }
`
