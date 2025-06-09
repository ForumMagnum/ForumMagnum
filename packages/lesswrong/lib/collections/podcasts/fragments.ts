import { gql } from "@/lib/generated/gql-codegen";

export const PodcastSelect = gql(`
  fragment PodcastSelect on Podcast {
    _id
    title
  }
`)
