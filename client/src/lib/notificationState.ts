export type NotificationReadState = { id: number; readAt: Date | string | null };

export function countUnreadNotifications(rows: NotificationReadState[]) {
  return rows.filter((item) => item.readAt === null).length;
}

export function notificationReadPayload(notificationId?: number) {
  return notificationId === undefined ? {} : { notificationIds: [notificationId] };
}
