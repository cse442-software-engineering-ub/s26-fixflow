export interface Activity {
  id: string;
  type: 'created' | 'edited' | 'fixed' | 'deleted' | 'restored' | 'profile_updated' | 'password_changed' | 'notification';
  bugNumber?: string;
  bugTitle?: string;
  message?: string;
  timestamp: string;
  user: string;
}

const ACTIVITIES_KEY = 'fixflow_activities';
const MAX_ACTIVITIES = 50;

// Sample activities for new users
const SAMPLE_ACTIVITIES: Activity[] = [
  {
    id: 'sample-1',
    type: 'created',
    bugNumber: '#001',
    bugTitle: 'Login button not responding on mobile',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    user: 'john'
  },
  {
    id: 'sample-2',
    type: 'edited',
    bugNumber: '#003',
    bugTitle: 'Dashboard loading too slow',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    user: 'john'
  },
  {
    id: 'sample-3',
    type: 'fixed',
    bugNumber: '#002',
    bugTitle: 'Navbar overlapping content',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    user: 'john'
  },
  {
    id: 'sample-4',
    type: 'created',
    bugNumber: '#015',
    bugTitle: 'API timeout on profile save',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    user: 'sarah'
  },
  {
    id: 'sample-5',
    type: 'fixed',
    bugNumber: '#012',
    bugTitle: 'Search not returning results',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    user: 'sarah'
  },
  {
    id: 'sample-6',
    type: 'edited',
    bugNumber: '#008',
    bugTitle: 'File upload fails for large files',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    user: 'mike'
  },
  {
    id: 'sample-7',
    type: 'created',
    bugNumber: '#020',
    bugTitle: 'Date picker shows wrong timezone',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    user: 'mike'
  }
];

// Initialize activities storage with sample activities if needed
const initializeActivities = (): void => {
  try {
    const stored = localStorage.getItem(ACTIVITIES_KEY);
    const activities = stored ? JSON.parse(stored) : [];
    
    // If there are no activities at all, add sample activities
    if (!Array.isArray(activities) || activities.length === 0) {
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(SAMPLE_ACTIVITIES));
      console.log('✅ Initialized with sample activities:', SAMPLE_ACTIVITIES.length);
    } else {
      console.log('📊 Existing activities found:', activities.length);
    }
  } catch (error) {
    console.error('Error initializing activities:', error);
    // On error, reset with sample activities
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(SAMPLE_ACTIVITIES));
  }
};

// Call initialization immediately
initializeActivities();

export const activityLogger = {
  logActivity(activity: Omit<Activity, 'id' | 'timestamp'>) {
    const activities = this.getActivities();
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    activities.unshift(newActivity);
    
    // Keep only the latest MAX_ACTIVITIES
    const trimmedActivities = activities.slice(0, MAX_ACTIVITIES);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(trimmedActivities));
    
    return newActivity;
  },

  getActivities(limit?: number): Activity[] {
    const stored = localStorage.getItem(ACTIVITIES_KEY);
    const activities = stored ? JSON.parse(stored) : [];
    return limit ? activities.slice(0, limit) : activities;
  },

  getUserActivities(username: string, limit?: number): Activity[] {
    const activities = this.getActivities();
    const userActivities = activities.filter(a => a.user === username);
    return limit ? userActivities.slice(0, limit) : userActivities;
  },

  clearActivities() {
    localStorage.removeItem(ACTIVITIES_KEY);
  },

  getActivityMessage(activity: Activity): string {
    switch (activity.type) {
      case 'created':
        return `Created bug ${activity.bugNumber}: ${activity.bugTitle}`;
      case 'edited':
        return `Edited bug ${activity.bugNumber}: ${activity.bugTitle}`;
      case 'fixed':
        return `Marked bug ${activity.bugNumber} as fixed`;
      case 'deleted':
        return `Deleted bug ${activity.bugNumber}: ${activity.bugTitle}`;
      case 'restored':
        return `Restored bug ${activity.bugNumber}: ${activity.bugTitle}`;
      case 'profile_updated':
        return 'Updated profile information';
      case 'password_changed':
        return 'Changed account password';
      case 'notification':
        return activity.message || 'You have a new notification';
      default:
        return 'Unknown activity';
    }
  },

  getActivityIcon(type: Activity['type']): string {
    switch (type) {
      case 'created': return '✨';
      case 'edited': return '✏️';
      case 'fixed': return '✅';
      case 'deleted': return '🗑️';
      case 'restored': return '♻️';
      case 'profile_updated': return '👤';
      case 'password_changed': return '🔒';
      case 'notification': return '🔔';
      default: return '📝';
    }
  },

  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return activityTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};