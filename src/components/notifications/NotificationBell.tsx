'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell, Video, MessageSquare, Info, X } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  type: 'call' | 'message' | 'system';
  title: string;
  message: string;
  link?: string;
  roomId?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    // Don't fetch if not authenticated
    if (status !== 'authenticated' || !session) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/notifications');

      if (!response.ok) {
        console.error('Notifications API error:', response.status, response.statusText);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body marks all as read
      });

      if (response.ok) {
        // Update local state - mark all as read
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  // Mark specific notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notificationIds.includes(notif._id) ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification._id]);
    }

    if (notification.link) {
      // Check if it's a session link
      if (notification.link.includes('/live-session/')) {
        const sessionId = notification.link.split('/live-session/')[1];

        try {
          // Verify session status and scheduled time before redirecting
          const response = await fetch(`/api/live-sessions/${sessionId}`);

          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('API returned non-JSON response');
          }

          const data = await response.json();

          if (data.success) {
            const session = data.data;

            // Check if session has ended
            if (session.status === 'ended') {
              toast.error('This session has ended and cannot be joined');
              setIsOpen(false);
              return;
            }

            // Check if session is scheduled for a future time
            if (session.scheduledFor && session.status === 'scheduled') {
              const scheduledTime = new Date(session.scheduledFor);
              const now = new Date();

              if (now < scheduledTime) {
                // Calculate time difference
                const diffMs = scheduledTime.getTime() - now.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                let timeMessage = '';
                if (diffDays > 0) {
                  timeMessage = `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
                } else if (diffHours > 0) {
                  timeMessage = `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                } else if (diffMins > 0) {
                  timeMessage = `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
                } else {
                  timeMessage = 'very soon';
                }

                toast.error(`This session is scheduled for ${scheduledTime.toLocaleString()}. Please join ${timeMessage}.`);
                setIsOpen(false);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error checking session status:', error);
          toast.error('Failed to verify session details');
          setIsOpen(false);
          return;
        }
      }

      router.push(notification.link);
      setIsOpen(false);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'system':
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Initial fetch
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (status === 'authenticated') {
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed sm:absolute left-0 right-0 sm:right-0 sm:left-auto mt-0 sm:mt-2 w-full sm:w-80 md:w-96 bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border-t sm:border border-gray-200 z-50 flex flex-col bottom-0 sm:bottom-auto sm:top-auto">
            {/* Header */}
            <div className="px-4 sm:px-4 py-3 sm:py-3 border-b border-gray-200 bg-gray-50 rounded-t-2xl sm:rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2 sm:gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm sm:text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium px-2 py-1"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 max-h-[65vh] sm:max-h-[28rem] bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 sm:h-8 sm:w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-12 px-4">
                <Bell className="w-12 h-12 sm:w-12 sm:h-12 text-gray-300 mb-3 sm:mb-3" />
                <p className="text-gray-500 text-sm sm:text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 sm:px-4 py-4 sm:py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation ${
                      !notification.read ? 'bg-blue-50/70' : 'bg-white'
                    }`}
                  >
                    <div className="flex gap-3 sm:gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-[15px] sm:text-sm font-semibold leading-snug ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full mt-1"></span>
                          )}
                        </div>
                        <p className="text-[13px] sm:text-sm text-gray-600 mt-0.5 line-clamp-3 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs sm:text-xs text-gray-500 mt-2 font-medium">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
