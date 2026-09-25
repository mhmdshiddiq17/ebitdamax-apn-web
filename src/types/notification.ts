export type Notification = {
  id: string;
  title: string;
  message: string;
  sender_name: string | null;
  created_at: string;
  read_at: string | null;
};

export type NotificationsResponse = {
  data: Notification[];
  meta: { unread_count: number };
};
