import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractDataFromResponse } from "@/lib/apiHelper";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotificationsDropdown() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (open) fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [open]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications?per_page=10");
      const data = extractDataFromResponse(response);
      const list = Array.isArray(data)
        ? data
        : data?.data ?? data?.data?.data ?? [];
      setNotifications(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      const count =
        response.data?.data?.unread_count ?? response.data?.unread_count ?? 0;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e?.stopPropagation();
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e?.stopPropagation();
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    }
    if (!notification.is_read) handleMarkAsRead(notification.id);
  };

  const getIcon = (type) => {
    switch (type) {
      case "order": return "📦";
      case "prescription": return "💊";
      case "booking": return "📅";
      case "message": return "💬";
      default: return "🔔";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={language === "ar" ? "start" : "end"}
        className="w-80 md:w-96 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">
            {language === "ar" ? "الإشعارات" : "Notifications"}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              {language === "ar" ? "قراءة الكل" : "Mark all read"}
            </Button>
          )}
        </div>
        <ScrollArea className="h-[320px]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "لا توجد إشعارات" : "No notifications"}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <span className="text-xl shrink-0" role="img" aria-hidden>
                    {getIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium leading-tight",
                          !notification.is_read && "font-semibold"
                        )}
                      >
                        {notification.title || (language === "ar" ? "إشعار" : "Notification")}
                      </p>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="shrink-0 p-1 rounded hover:bg-accent"
                        >
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.created_at
                        ? format(new Date(notification.created_at), "PPp")
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm"
                onClick={() => {
                  navigate("/admin/notifications");
                  setOpen(false);
                }}
              >
                {language === "ar" ? "عرض الكل" : "View all"}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
