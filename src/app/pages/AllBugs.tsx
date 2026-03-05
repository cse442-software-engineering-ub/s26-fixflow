import { useOutletContext } from 'react-router';
import { BugCard } from '../components/BugCard';
import { Bug } from '../types';
import { FileX, Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface OutletContext {
  bugs: Bug[];
  onToggleStatus: (id: string) => void;
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
  onBugClick: (bug: Bug) => void;
}

export function AllBugs() {
  const { bugs, onToggleStatus, onEdit, onDelete, onBugClick } = useOutletContext<OutletContext>();

  const sortedBugs = [...bugs].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'active' ? -1 : 1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

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
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">All Bugs</h2>
              <p className="text-slate-300 text-base sm:text-lg">
                Showing {bugs.length} {bugs.length === 1 ? 'bug' : 'bugs'}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl self-start sm:self-auto">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Sorted by Status & Due Date</span>
            </div>
          </div>
        </motion.div>

        {sortedBugs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-2xl shadow-md"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-4">
              <FileX className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No bugs yet</h3>
            <p className="text-gray-600 text-lg mb-6">Get started by adding your first bug</p>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {sortedBugs.map((bug, index) => (
              <motion.div
                key={bug.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BugCard
                  bug={bug}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onClick={onBugClick}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}