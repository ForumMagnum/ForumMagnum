import React from 'react';
import type { RSVPType } from '../../lib/collections/posts/newSchema';
import { PostsEmail } from './PostsEmail';

export const EventTomorrowReminder = ({postId, rsvp}: {
  postId: string,
  rsvp: RSVPType,
}) => {
  return <PostsEmail
    postIds={[postId]}
    hideRecommendations
    reason={`you RSVPed ${rsvp.response} to this event`}
  />
}

