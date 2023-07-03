import { serverSentEventsAPI, onServerSentNotificationEvent } from "../components/hooks/useUnreadNotifications";

let serverSentEventsActive = false;
let serverSentEventSource: EventSource|null = null;
let reconnectPending = false;

export function initServerSentEvents() {
  serverSentEventsAPI.setServerSentEventsActive = setServerSentEventsActive;
}

function setServerSentEventsActive(active: boolean)
{
  if (active) {
    serverSentEventsActive = true;
    if (!serverSentEventSource && !reconnectPending)
      connectServerSentEvents();
  } else {
    serverSentEventsActive = false;
    disconnectServerSentEvents();
  }
}

function disconnectServerSentEvents() {
  if (serverSentEventSource) {
    serverSentEventSource.close();
    serverSentEventSource = null;
  }
}

function connectServerSentEvents() {
  reconnectPending = false;
  
  if (!serverSentEventsActive) {
    return;
  }

  if (serverSentEventSource) {
    if (serverSentEventSource.readyState === EventSource.CLOSED) {
      // If there's an EventSource but it's closed, we're recreating it.
      serverSentEventSource = null;
    } else if (serverSentEventSource.readyState === EventSource.OPEN || serverSentEventSource.readyState === EventSource.CONNECTING) {
      // If it's already connected or connecting, don't try to reconnect again.
      return;
    }
  }
  // eslint-disable-next-line no-console
  console.log("Connecting to server-sent events");
  serverSentEventSource = new EventSource("/api/notificationEvents");

  serverSentEventSource.onerror = (errorEvent) => {
    // eslint-disable-next-line no-console
    console.log(`Server-sent events error`, errorEvent);
    disconnectServerSentEvents();

    if (!reconnectPending) {
      reconnectPending = true;
      setTimeout(() => {
        connectServerSentEvents();
      }, 15000);
    }
  }
  serverSentEventSource.onmessage = (event) => {
    onServerSentNotificationEvent(event.data);
  }
}
