import { useOutletContext, Link } from 'react-router';
import { Bug } from '../types';
import { StatsCard } from '../components/StatsCard';
import { ArrowRight, Circle, User, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface OutletContext {
  bugs: Bug[];
  currentUser: string;
  sessionDisplayName: string;
  onToggleStatus: (id: string) => void;
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
  onBugClick: (bug: Bug) => void;
}

export function Home() {
  const { bugs, sessionDisplayName, onBugClick } = useOutletContext<OutletContext>();

  const stats = {
    high: bugs.filter(b => b.priority === 'high' && b.status === 'active').length,
    medium: bugs.filter(b => b.priority === 'medium' && b.status === 'active').length,
    low: bugs.filter(b => b.priority === 'low' && b.status === 'active').length,
    overdue: bugs.filter(b => {
      if (b.status !== 'active') return false;
      return new Date(b.dueDate) < new Date();
    }).length,
  };

  const topPriorityBugs = bugs
    .filter(b => b.status === 'active' && b.priority === 'high')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500';
      case 'medium': return 'bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500';
      case 'low': return 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500';
      default: return 'bg-gray-100';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-300 text-black';
      case 'medium': return 'bg-orange-300 text-black';
      case 'low': return 'bg-green-300 text-black';
      default: return 'bg-gray-300 text-black';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusText = (bug: Bug) => {
    if (bug.status === 'fixed') return 'Fixed';
    const dueDate = new Date(bug.dueDate);
    const today = new Date();
    if (dueDate < today) return 'Overdue';
    return 'In progress';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="text-3xl sm:text-4xl font-bold">Welcome back, {sessionDisplayName}</h1>
          </div>
          <p className="text-slate-300 text-base sm:text-lg">Here's an overview of the system health.</p>
        </motion.div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">System bug status:</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="High Priority Bugs" count={stats.high} color="red" />
            <StatsCard title="Medium Priority Bugs" count={stats.medium} color="orange" />
            <StatsCard title="Low Priority Bugs" count={stats.low} color="green" />
            <StatsCard title="Overdue bugs" count={stats.overdue} color="blue" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-md p-4 sm:p-8 border border-gray-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-6 sm:h-8 bg-red-500 rounded-full"></div>
              Top Priority Bugs
            </h2>
            <Link 
              to="/prioritized"
              className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-slate-700 transition-all shadow-sm text-sm sm:text-base whitespace-nowrap self-start sm:self-auto"
            >
              View all prioritized bugs
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>

          {topPriorityBugs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-gray-500 text-lg">No high priority bugs at the moment</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {topPriorityBugs.map((bug, index) => (
                <motion.button
                  key={bug.id}
                  type="button"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onBugClick(bug)}
                  className={`w-full text-left rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${getPriorityColor(bug.priority)}`}
                >
                  <div className="p-4 sm:p-5">
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-start gap-3 mb-3">
                        <Circle className="w-4 h-4 fill-red-500 text-red-500 flex-shrink-0 mt-1" />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="font-bold text-gray-900 text-base leading-tight mb-2">{bug.title}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs text-gray-600 font-medium">{bug.bugNumber}</p>
                            <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${getPriorityBadgeColor(bug.priority)}`}>
                              {bug.priority.charAt(0).toUpperCase() + bug.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-bold text-gray-700 block">{getStatusText(bug)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shadow-sm">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-bold text-gray-900">{bug.assignedTo || 'Unassigned'}</span>
                        </div>
                        <p className="text-xs text-gray-500">Due: {formatDate(bug.dueDate)}</p>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-6">
                      <div className="flex min-w-0 flex-1 items-center justify-start gap-4">
                        <Circle className="w-4 h-4 fill-red-500 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 text-left">
                          <p className="font-bold text-gray-900 text-lg">{bug.title}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <p className="text-sm text-gray-600 font-medium">{bug.bugNumber}</p>
                            <span className={`px-3 py-1 rounded-lg font-bold text-xs ${getPriorityBadgeColor(bug.priority)}`}>
                              {bug.priority.charAt(0).toUpperCase() + bug.priority.slice(1)}
                            </span>
                            <p className="text-xs text-gray-500">Due: {formatDate(bug.dueDate)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-6">
                        <span className="text-sm font-bold text-gray-700">{getStatusText(bug)}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shadow-md">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{bug.assignedTo || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}