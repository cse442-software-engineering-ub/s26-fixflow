import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Activity as ActivityIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, activityLogger } from '../lib/activity';
import { api } from '../lib/api';

interface RecentActivityProps {
  currentUser: string;
}

export function RecentActivity({ currentUser }: RecentActivityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  const loadActivities = async () => {
    const localActivities = activityLogger.getUserActivities(currentUser, 10);
    try {
      const res = await api.notificationsList(20);
      const remoteActivities = res.success ? res.activities : [];
      const unread = remoteActivities.filter((a) => a.isRead !== true).length;
      setUnreadCount(unread);
      const merged = [...remoteActivities, ...localActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      setActivities(merged);
    } catch {
      setUnreadCount(0);
      setActivities(localActivities);
    }
  };

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
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

  useEffect(() => {
    // Refresh activities when dropdown is opened
    if (isOpen) {
      api
        .notificationsMarkRead()
        .catch(() => {
          // ignore; dropdown still works with local activity data
        })
        .finally(() => {
          setUnreadCount(0);
          loadActivities();
        });
      
      // Calculate position
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth < 640; // sm breakpoint
        
        if (isMobile) {
          // Center on mobile
          setDropdownPosition({
            top: rect.bottom + 8,
            right: 16 // 1rem padding from right edge
          });
        } else {
          // Align with button on desktop
          setDropdownPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
          });
        }
      }
    }
  }, [isOpen, currentUser]);

  const hasActivities = activities.length > 0;
  const notificationBadge = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Recent Activity"
        ref={buttonRef}
      >
        <ActivityIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] leading-[18px] font-bold rounded-full text-center">
            {notificationBadge}
          </span>
        )}
      </motion.button>
      
      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9999] max-w-[calc(100vw-2rem)]"
            style={{ top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px` }}
          >
            {/* Header */}
            <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-5 h-5" />
                <h3 className="font-bold text-lg">Recent Activity</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Activities List */}
            <div className="max-h-96 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ActivityIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No recent activity</p>
                  <p className="text-gray-400 text-xs mt-1">Your activity and notifications appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0 mt-0.5">
                          {activityLogger.getActivityIcon(activity.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium leading-snug">
                            {activityLogger.getActivityMessage(activity)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activityLogger.getRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {activities.length > 0 && (
              <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
                <button
                  onClick={() => {
                    activityLogger.clearActivities();
                    setActivities([]);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Clear all activity
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}