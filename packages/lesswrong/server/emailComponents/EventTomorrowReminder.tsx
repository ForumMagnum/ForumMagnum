

import React from 'react';
import type { RSVPType } from "@/lib/collections/posts/helpers";
import type { PostsRevision } from "@/lib/generated/gql-codegen/graphql";
import { PostsEmail } from './PostsEmail';

export const EventTomorrowReminder = ({posts, rsvp}: {
  posts: PostsRevision[],
  rsvp: RSVPType,
}) => {
  return <PostsEmail
    posts={posts}
    hideRecommendations
    reason={`you RSVPed ${rsvp.response} to this event`}
  />
}

