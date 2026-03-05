import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { BugCard } from '../components/BugCard';
import { Bug, Priority } from '../types';
import { Filter } from 'lucide-react';
import { UserSelectWithSearch } from '../components/UserSelectWithSearch';

interface OutletContext {
  bugs: Bug[];
  allUsers?: string[];
  onToggleStatus: (id: string) => void;
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
  onBugClick: (bug: Bug) => void;
}

export function BrowseAllBugs() {
  const { bugs, allUsers: allUsersFromContext, onToggleStatus, onEdit, onDelete, onBugClick } =
    useOutletContext<OutletContext>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'fixed'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [filterUser, setFilterUser] = useState<string>('all');

  // Get unique users from bugs based on assignee only (DB-backed)
  const allUsers = Array.from(
    new Set(
      (allUsersFromContext && allUsersFromContext.length > 0
        ? allUsersFromContext
        : (bugs.map((bug) => bug.assignedTo).filter(Boolean) as string[]))
    )
  ).sort();

  const filteredBugs = bugs
    .filter(bug => {
      const matchesSearch = 
        bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.bugNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = filterPriority === 'all' || bug.priority === filterPriority;
      const matchesStatus = filterStatus === 'all' || bug.status === filterStatus;
      const matchesUser = filterUser === 'all' || bug.assignedTo === filterUser;

      return matchesSearch && matchesPriority && matchesStatus && matchesUser;
    })
    .sort((a, b) => {
      // Sort by status first (active first), then by priority, then by due date
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // Sort by creation date (newest/oldest)
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortBy === 'latest' ? bTime - aTime : aTime - bTime;
    });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">Browse All Bugs</h2>
          <p className="text-slate-300 text-base sm:text-lg">
            {filteredBugs.length} of {bugs.length} bugs
          </p>
        </div>

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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'fixed')}
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

            {/* Priority Filter */}
            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* User Filter */}
            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <UserSelectWithSearch
                users={allUsers}
                value={filterUser}
                onChange={setFilterUser}
                allOptionValue="all"
                allOptionLabel="All Users"
              />
            </div>
          </div>

          {/* Results count */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredBugs.length}</span> {filteredBugs.length === 1 ? 'bug' : 'bugs'}
            </p>
          </div>
        </div>

        {filteredBugs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md">
            <p className="text-gray-500">
              {bugs.length === 0 ? 'No bugs have been reported yet.' : 'No bugs found matching your filters'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {filteredBugs.map((bug) => (
              <BugCard
                key={bug.id}
                bug={bug}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onBugClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}