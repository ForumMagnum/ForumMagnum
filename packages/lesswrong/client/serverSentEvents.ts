
export function subscribeToNotifications() {
  const evtSource = new EventSource("/api/notificationEvents");
  evtSource.onmessage = (event) => {
    console.log(event); //TODO
  }
}

