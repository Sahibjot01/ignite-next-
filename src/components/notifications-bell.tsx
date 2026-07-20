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
import { Badge } from "@/components/ui/badge";
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
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
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
          <Button variant="ghost" size="icon" className="relative hover:bg-zinc-800 text-zinc-350 hover:text-white rounded-full" />
        }
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-[#ff7676] text-white text-[10px] font-bold border-2 border-black p-0">
            {unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-800 text-white">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="font-bold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              onClick={handleMarkAllRead}
              className="text-xs text-[#ff7676] hover:text-[#ff9292] p-0 h-auto font-medium"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-sm text-zinc-400">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                render={<Link href={`/game/${notification.game_id}`} />}
                className="flex flex-col items-start gap-1 p-3 focus:bg-zinc-800 cursor-pointer border-b border-zinc-800/50 last:border-b-0"
                onClick={() => handleMarkAsRead(notification.id)}
              >
                  <div className="flex items-start gap-2">
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-[#ff7676] shrink-0" />
                    )}
                    <p className={`text-xs ${!notification.is_read ? 'font-semibold text-white' : 'text-zinc-400'}`}>
                      {notification.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-500 pl-4 block mt-1">
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
