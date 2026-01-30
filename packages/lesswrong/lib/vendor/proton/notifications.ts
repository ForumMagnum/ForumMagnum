export type CreateNotificationOptions = {
  text: string;
  type: 'warning' | 'info' | 'success' | 'error';
};

export const useNotifications = () => {
  const createNotification = (_options: CreateNotificationOptions) => 0;
  return { createNotification };
};
