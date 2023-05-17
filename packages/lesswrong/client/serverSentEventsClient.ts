import { onServerSentNotificationEvent } from "../components/hooks/useUnreadNotifications";

export function subscribeToNotifications() {
  const evtSource = new EventSource("/api/notificationEvents");
  evtSource.onmessage = (event) => {
    onServerSentNotificationEvent(event.data);
  }
}

