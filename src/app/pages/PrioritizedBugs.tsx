import { useOutletContext } from 'react-router';
import { BugCard } from '../components/BugCard';
import { Bug } from '../types';
import { Target, TrendingUp, AlertTriangle, Clock, User, Code } from 'lucide-react';
import { motion } from 'motion/react';

interface OutletContext {
  bugs: Bug[];
  onToggleStatus: (id: string) => void;
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
  onBugClick: (bug: Bug) => void;
}

export function PrioritizedBugs() {
  const { bugs, onToggleStatus, onEdit, onDelete, onBugClick } = useOutletContext<OutletContext>();

  // Prefer active bugs; if there are none, fall back to all bugs so the page is never empty.
  const activeOnly = bugs.filter((bug) => bug.status === 'active');

  const normalizePriority = (p: string) =>
    p === 'high' || p === 'medium' || p === 'low' ? p : 'low';

  const baseForPrioritization = activeOnly.length > 0 ? activeOnly : bugs;

  // Sorted by priority (high → medium → low), then by due date
  const prioritizedBugs = baseForPrioritization
    .slice()
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
      const pa = priorityOrder[normalizePriority(a.priority)];
      const pb = priorityOrder[normalizePriority(b.priority)];
      if (pa !== pb) return pa - pb;

      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDue - bDue;
    });

  const stats = {
    high: prioritizedBugs.filter((b) => normalizePriority(b.priority) === 'high').length,
    medium: prioritizedBugs.filter((b) => normalizePriority(b.priority) === 'medium').length,
    low: prioritizedBugs.filter((b) => normalizePriority(b.priority) === 'low').length,
    overdue: prioritizedBugs.filter(
      (b) => b.dueDate && new Date(b.dueDate) < new Date()
    ).length,
    total: prioritizedBugs.length,
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilDue = (dueDate: string | undefined) => {
    if (!dueDate) return undefined;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8" />
                <h2 className="text-3xl sm:text-4xl font-bold">Prioritized Bugs</h2>
              </div>
              <p className="text-slate-300 text-base sm:text-lg">
                {prioritizedBugs.length} active {prioritizedBugs.length === 1 ? 'bug' : 'bugs'} sorted by severity
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl self-start sm:self-auto">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">High → Medium → Low</span>
            </div>
          </div>
        </motion.div>

        {/* Priority Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8"
        >
          <div className="bg-red-300 rounded-xl p-3 sm:p-4 text-center border border-red-400 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-black">{stats.high}</div>
            <div className="text-xs sm:text-sm font-bold text-black mt-1">High Priority</div>
          </div>
          <div className="bg-orange-300 rounded-xl p-3 sm:p-4 text-center border border-orange-400 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-black">{stats.medium}</div>
            <div className="text-xs sm:text-sm font-bold text-black mt-1">Medium Priority</div>
          </div>
          <div className="bg-green-300 rounded-xl p-3 sm:p-4 text-center border border-green-400 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-black">{stats.low}</div>
            <div className="text-xs sm:text-sm font-bold text-black mt-1">Low Priority</div>
          </div>
          <div className="bg-blue-300 rounded-xl p-3 sm:p-4 text-center border border-blue-400 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-black">{stats.total}</div>
            <div className="text-xs sm:text-sm font-bold text-black mt-1">Total Active</div>
          </div>
          <div className="bg-red-300 rounded-xl p-3 sm:p-4 text-center border border-red-400 shadow-sm col-span-2 sm:col-span-1">
            <div className="text-2xl sm:text-3xl font-bold text-black">{stats.overdue}</div>
            <div className="text-xs sm:text-sm font-bold text-black mt-1">Overdue</div>
          </div>
        </motion.div>

        {prioritizedBugs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-2xl shadow-md"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-4">
              <Target className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No bugs yet</h3>
            <p className="text-gray-600 text-lg">Create a bug to see it ranked here.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {prioritizedBugs.map((bug, index) => {
              const daysUntil = getDaysUntilDue(bug.dueDate);
              const overdue = isOverdue(bug.dueDate);
              
              const getPriorityColor = () => {
                switch (normalizePriority(bug.priority)) {
                  case 'high': return 'border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-pink-50';
                  case 'medium': return 'border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50';
                  case 'low': return 'border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50';
                }
              };

              const getPriorityBadge = () => {
                switch (normalizePriority(bug.priority)) {
                  case 'high': return 'bg-red-300 text-black';
                  case 'medium': return 'bg-orange-300 text-black';
                  case 'low': return 'bg-green-300 text-black';
                }
              };

              return (
                <motion.div
                  key={bug.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  onClick={() => onBugClick(bug)}
                  className={`${getPriorityColor()} rounded-2xl border border-white/70 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden`}
                >
                  <div className="p-6">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <AlertTriangle
                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              normalizePriority(bug.priority) === 'high'
                                ? 'text-red-600'
                                : normalizePriority(bug.priority) === 'medium'
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-xl mb-2 break-words">{bug.title}</h3>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="text-xs text-gray-700 font-semibold bg-white/80 border border-gray-200 px-2.5 py-1 rounded-lg">
                                {bug.bugNumber || `#${bug.id}`}
                              </span>
                              <span className={`px-3 py-1 rounded-lg font-bold text-xs ${getPriorityBadge()}`}>
                                {normalizePriority(bug.priority).toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-700 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                                Rank #{index + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Description Preview */}
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2 leading-relaxed">
                          {bug.description}
                        </p>
                      </div>

                      {/* Due Date Badge */}
                      <div className={`flex-shrink-0 px-4 py-3 rounded-xl text-center shadow-sm ${overdue ? 'bg-red-500 text-white' : 'bg-white/80 border border-gray-300'}`}>
                        <Clock className={`w-5 h-5 mx-auto mb-1 ${overdue ? 'text-white' : 'text-gray-600'}`} />
                        <div className={`text-xs font-bold ${overdue ? 'text-white' : 'text-gray-900'}`}>
                          {overdue
                            ? 'OVERDUE'
                            : daysUntil === undefined
                            ? 'NO DUE DATE'
                            : daysUntil === 0
                            ? 'TODAY'
                            : daysUntil === 1
                            ? 'TOMORROW'
                            : `${daysUntil} DAYS`}
                        </div>
                        <div className={`text-xs ${overdue ? 'text-white/90' : 'text-gray-600'} mt-0.5`}>
                          {formatDate(bug.dueDate)}
                        </div>
                      </div>
                    </div>

                    {/* Code Reference Section */}
                    <div className="bg-gray-900 rounded-xl p-3.5 mb-5 shadow-inner">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-400">CODE REFERENCE</span>
                      </div>
                      <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                        {(bug.code || '').length > 150
                          ? (bug.code || '').substring(0, 150) + '...'
                          : bug.code || ''}
                      </pre>
                    </div>

                    {/* Footer Section */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/70">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shadow-sm">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-semibold">Assigned to</div>
                          <div className="text-sm font-bold text-gray-900">{bug.assignedTo || 'Unassigned'}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-500 font-semibold">Priority Rank</div>
                        <div className="text-xl font-extrabold text-gray-900">#{index + 1}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}