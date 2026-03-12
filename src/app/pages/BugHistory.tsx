import { useOutletContext } from 'react-router';
import { Bug } from '../types';
import { Clock, CheckCircle2, Calendar, Code, User, Filter } from 'lucide-react';
import { useState } from 'react';
import { UserSelectWithSearch } from '../components/UserSelectWithSearch';

interface OutletContext {
  bugs: Bug[];
  allUsers?: string[];
  onBugSelect: (bug: Bug) => void;
}

export function BugHistory() {
  const { bugs, allUsers: allUsersFromContext, onBugSelect } = useOutletContext<OutletContext>();
  const [statusFilter, setStatusFilter] = useState<'all' | 'fixed' | 'active'>('fixed');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [userFilter, setUserFilter] = useState<string>('');

  const assignedUsers = Array.from(
    new Set(
      (allUsersFromContext && allUsersFromContext.length > 0
        ? allUsersFromContext
        : bugs.map((b) => b.assignedTo).filter((u): u is string => Boolean(u)))
    )
  ).sort();

  const allBugsWithActivity = bugs
    .filter(bug => !userFilter || bug.assignedTo === userFilter)
    .map(bug => ({
      ...bug,
      activities: [
        {
          type: 'created',
          date: bug.createdAt,
          description: 'Bug created',
        },
        ...((bug.fixedAt || bug.status === 'fixed') ? [{
          type: 'fixed',
          date: bug.fixedAt || '',
          description: bug.fixDetails
            ? `Fixed by ${bug.fixDetails.fixedBy}: ${bug.fixDetails.description}`
            : `Fixed by ${bug.assignedTo || 'Unknown'}: ${bug.description?.trim() ? bug.description : 'No fix details were recorded'}`,
        }] : []),
      ].sort((a, b) => {
        const aDate = a.date || bug.createdAt;
        const bDate = b.date || bug.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      }),
    }))
    .filter(bug => {
      // Apply status filter
      if (statusFilter === 'fixed') return bug.status === 'fixed';
      if (statusFilter === 'active') return bug.status === 'active';
      return true; // 'all' shows everything
    })
    .sort((a, b) => {
      const latestA = new Date(a.activities[0].date || a.createdAt).getTime();
      const latestB = new Date(b.activities[0].date || b.createdAt).getTime();
      
      // Apply sort order
      if (sortBy === 'latest') {
        return latestB - latestA;
      } else {
        return latestA - latestB;
      }
    });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Time unavailable';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCardTone = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-gradient-to-r from-red-50/60 to-white';
      case 'medium':
        return 'border-orange-200 bg-gradient-to-r from-orange-50/60 to-white';
      case 'low':
        return 'border-green-200 bg-gradient-to-r from-green-50/60 to-white';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">Bug History</h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Complete timeline of all bug activities
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="flex flex-wrap gap-4 mb-4 ml-0 sm:ml-8">
            {/* Status Filter */}
            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'fixed')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
              >
                <option value="all">All Bugs</option>
                <option value="active">Active Only</option>
                <option value="fixed">Fixed Only</option>
              </select>
            </div>

            {/* Sort By Date */}
            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By Date
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Filter by username */}
            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned to user
              </label>
              <UserSelectWithSearch
                users={assignedUsers}
                value={userFilter}
                onChange={setUserFilter}
                allOptionValue=""
                allOptionLabel="All users"
              />
            </div>
          </div>

          {/* Results count */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{allBugsWithActivity.length}</span> {allBugsWithActivity.length === 1 ? 'activity' : 'activities'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {allBugsWithActivity.map((bug) => (
            <button
              key={bug.id}
              onClick={() => onBugSelect(bug)}
              className={`w-full rounded-xl border-2 p-6 hover:shadow-lg transition-all text-left cursor-pointer relative overflow-hidden ${getCardTone(
                bug.priority
              )}`}
            >
              <div
                className={`absolute left-0 top-0 h-full w-1 ${
                  bug.priority === 'high'
                    ? 'bg-red-500'
                    : bug.priority === 'medium'
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
              />
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-gray-900">{bug.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(bug.priority)}`}>
                      {bug.priority.toUpperCase()}
                    </span>
                    {bug.status === 'fixed' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        FIXED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{bug.bugNumber}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 flex-shrink-0" />
                      <code className="text-xs bg-gray-50 px-2 py-1 rounded break-all">{bug.code}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Due: {new Date(bug.dueDate).toLocaleDateString()}</span>
                    </div>
                    {bug.assignedTo && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span>{bug.assignedTo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Activity Timeline
                </h4>
                <div className="space-y-3">
                  {bug.activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        activity.type === 'fixed'
                          ? 'bg-blue-100'
                          : 'bg-blue-100'
                      }`}>
                        {activity.type === 'fixed' ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}