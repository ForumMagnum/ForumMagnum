import { onServerSentNotificationEvent } from "../components/hooks/useUnreadNotifications";

let serverSentEventSource: EventSource|null = null;

export function subscribeToNotifications() {
  recreateEventSource();
}

function recreateEventSource() {
  if (serverSentEventSource) {
    if (serverSentEventSource.readyState === EventSource.CLOSED) {
      serverSentEventSource = null;
    } else if (serverSentEventSource.readyState === EventSource.OPEN) {
      serverSentEventSource.close();
      serverSentEventSource = null;
    } else if (serverSentEventSource.readyState === EventSource.CONNECTING) {
      // If it's already connected, don't try to reconnect again.
      return;
    }
  }
  // eslint-disable-next-line no-console
  console.log("Connecting to server-sent events");
  serverSentEventSource = new EventSource("/api/notificationEvents");
  serverSentEventSource.onerror = (errorEvent) => {
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(`Server-sent events error`, errorEvent);
      recreateEventSource();
    }, 3000);
  }
  serverSentEventSource.onmessage = (event) => {
    onServerSentNotificationEvent(event.data);
  }
}
