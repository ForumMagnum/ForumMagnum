import { gql } from "@/lib/generated/gql-codegen";

export const NarrationSegmentAudioFragment = gql(`
  fragment NarrationSegmentAudioFragment on NarrationSegmentAudio {
    _id
    narrationSegmentId
    audioUrl
    timingsUrl
    durationMs
  }
`);
