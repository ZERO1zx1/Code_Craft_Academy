import { Bell, CheckCheck, MessageSquareText } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { countUnreadNotifications, notificationReadPayload } from "@/lib/notificationState";
import "./communication.css";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const notifications = trpc.notifications.list.useQuery(undefined, { refetchInterval: 15000 });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  const rows = notifications.data?.rows ?? [];
  const unread = notifications.data?.unreadCount ?? countUnreadNotifications(rows);
  return <div className="notification-center"><Button variant="ghost" size="icon" className="notification-trigger" onClick={() => setOpen((value) => !value)} aria-label="Мэдэгдэл харах"><Bell size={17} />{unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}</Button>{open && <section className="notification-popover"><header><div><p className="section-kicker">NOTIFICATIONS</p><h3>Мэдэгдэл</h3></div>{unread > 0 && <button type="button" onClick={() => markRead.mutate(notificationReadPayload())}><CheckCheck size={14} /> Бүгдийг уншсан</button>}</header>{notifications.isLoading ? <p className="notification-empty">Мэдэгдлийг ачаалж байна...</p> : rows.length === 0 ? <p className="notification-empty">Одоогоор шинэ мэдэгдэл алга.</p> : <div className="notification-list">{rows.map((item) => <article key={item.id} className={item.readAt ? "" : "unread"}><Link href={item.actionUrl ?? "/feedback"} onClick={() => { if (!item.readAt) markRead.mutate(notificationReadPayload(item.id)); setOpen(false); }}><span><MessageSquareText size={15} /></span><div><b>{item.title}</b><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div></Link></article>)}</div>}</section>}</div>;
}
