"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationItem,
} from "@/lib/actions";
import { toast } from "sonner";

export default function NotificationsBell() {
  const { isSignedIn } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!isSignedIn) return;
    const items = await getNotifications();
    setNotifications(items);
    setUnreadCount(items.filter((item) => !item.is_read).length);
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchNotifications();
      // Poll notifications every 30 seconds for dynamic updates
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isSignedIn]);

  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationAsRead(id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsAsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    }
  };

  if (!isSignedIn) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative text-ink-dim hover:bg-surface hover:text-ink rounded-full"
          />
        }
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-void bg-coral text-[10px] font-bold text-void">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-surface-2 border-hairline-strong text-ink"
      >
        <div className="flex items-center justify-between px-4 py-2">
          <span className="font-bold text-sm text-ink">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              onClick={handleMarkAllRead}
              className="text-xs text-coral hover:text-coral-ink p-0 h-auto font-medium"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-hairline-strong" />
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-sm text-ink-dim">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                render={
                  notification.external_url ? (
                    <a
                      href={notification.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    ></a>
                  ) : (
                    <Link href={`/game/${notification.game_id}`} />
                  )
                }
                className="flex flex-col items-start gap-1 p-3 focus:bg-surface-3 cursor-pointer border-b border-hairline last:border-b-0"
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-2">
                  {!notification.is_read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-coral shrink-0" />
                  )}
                  <p
                    className={`text-xs ${!notification.is_read ? "font-semibold text-ink" : "text-ink-dim"}`}
                  >
                    {notification.message}
                  </p>
                </div>
                <span className="text-[10px] text-ink-faint pl-4 block mt-1">
                  {new Date(notification.created_at).toLocaleDateString()}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
