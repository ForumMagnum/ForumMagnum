import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import type { RSVPType } from '../../lib/collections/posts/newSchema';

const EventTomorrowReminder = ({postId, rsvp}: {
  postId: string,
  rsvp: RSVPType,
}) => {
  return <Components.PostsEmail
    postIds={[postId]}
    hideRecommendations
    reason={`you RSVPed ${rsvp.response} to this event`}
  />
}

const EventTomorrowReminderComponent = registerComponent("EventTomorrowReminder", EventTomorrowReminder);

declare global {
  interface ComponentTypes {
    EventTomorrowReminder: typeof EventTomorrowReminderComponent
  }
}
