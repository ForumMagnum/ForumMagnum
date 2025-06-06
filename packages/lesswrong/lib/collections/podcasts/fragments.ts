import { gql } from "@/lib/crud/wrapGql";

export const PodcastSelect = gql(`
  fragment PodcastSelect on Podcast {
    _id
    title
  }
`)
