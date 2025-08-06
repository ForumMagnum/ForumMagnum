import React from 'react';
import type { RSVPType } from "@/lib/collections/posts/helpers";
import { PostsEmail } from './PostsEmail';
import { EmailContextType } from './emailContext';

export const EventTomorrowReminder = ({postIds, rsvp, emailContext}: {
  postIds: string[],
  rsvp: RSVPType,
  emailContext: EmailContextType,
}) => {
  return <PostsEmail
    postIds={postIds}
    hideRecommendations
    reason={`you RSVPed ${rsvp.response} to this event`}
    emailContext={emailContext}
  />
}

