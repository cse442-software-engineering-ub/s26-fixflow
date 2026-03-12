import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { Bug } from '../types';
import { Trash2, RotateCcw, AlertCircle, Calendar, Code, User, X, MessageSquare, Filter, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { UserSelectWithSearch } from '../components/UserSelectWithSearch';

interface OutletContext {
  deletedBugs: Bug[];
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
}

type DeletedBug = Bug & { deletedAt?: string; deletedBy?: string; deletionReason?: string };

export function DeletedBugs() {
  const { deletedBugs, onRestore, onPermanentlyDelete } = useOutletContext<OutletContext>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDeletedBy, setFilterDeletedBy] = useState<string>('all');

  const allDeletedByUsers = Array.from(
    new Set(
      deletedBugs
        .map((b) => (b as DeletedBug).deletedBy)
        .filter((u): u is string => !!u)
    )
  ).sort();

  const filteredBugs = deletedBugs.filter((bug) => {
    const d = bug as DeletedBug;
    const matchesSearch =
      !searchTerm.trim() ||
      bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bug.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bug.bugNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(bug.id).includes(searchTerm);
    const matchesDeletedBy = filterDeletedBy === 'all' || d.deletedBy === filterDeletedBy;
    return matchesSearch && matchesDeletedBy;
  });

  const sortedDeletedBugs = [...filteredBugs].sort((a, b) => {
    const dateA = (a as any).deletedAt ? new Date((a as any).deletedAt).getTime() : 0;
    const dateB = (b as any).deletedAt ? new Date((b as any).deletedAt).getTime() : 0;
    return dateB - dateA; // Most recently deleted first
  });

  const formatDate = (dateString: string) => {
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="w-6 h-6 sm:w-8 sm:h-8" />
            <h2 className="text-3xl sm:text-4xl font-bold">Deleted Bugs</h2>
          </div>
          <p className="text-slate-300 text-base sm:text-lg">
            {filteredBugs.length} of {deletedBugs.length} {deletedBugs.length === 1 ? 'bug' : 'bugs'} in trash
          </p>
        </motion.div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="flex flex-wrap gap-4 mb-4 ml-0 sm:ml-8">
            <div className="w-full sm:flex-1 sm:min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Bug title, ID, or description..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deleted By
              </label>
              <UserSelectWithSearch
                users={allDeletedByUsers}
                value={filterDeletedBy}
                onChange={setFilterDeletedBy}
                allOptionValue="all"
                allOptionLabel="All Users"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredBugs.length}</span> {filteredBugs.length === 1 ? 'bug' : 'bugs'}
            </p>
          </div>
        </div>

        {filteredBugs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-2xl shadow-md"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-4">
              <Trash2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {deletedBugs.length === 0 ? 'Trash is empty' : 'No bugs found'}
            </h3>
            <p className="text-gray-600 text-lg">
              {deletedBugs.length === 0
                ? 'Deleted bugs will appear here'
                : 'Try adjusting your search or filter'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Deleted bugs are stored here temporarily. You can restore them or permanently delete them. Permanently deleted bugs cannot be recovered.
                </p>
              </div>
            </div>

            {sortedDeletedBugs.map((bug, index) => (
              <motion.div
                key={bug.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-gray-900">{bug.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(bug.priority)}`}>
                        {bug.priority.toUpperCase()}
                      </span>
                      {bug.status === 'fixed' && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          WAS FIXED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{bug.bugNumber}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
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

                    {(bug as any).deletedAt && (
                      <p className="text-xs text-red-600 font-medium">
                        Deleted on {formatDate((bug as any).deletedAt)}
                        {(bug as any).deletedBy && (
                          <> by <span className="font-bold">{(bug as any).deletedBy}</span></>
                        )}
                      </p>
                    )}

                    {(bug as any).deletionReason && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-amber-900 mb-1">Deletion Reason:</p>
                          <p className="text-sm text-amber-800">{(bug as any).deletionReason}</p>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-700 mt-3 line-clamp-2">{bug.description}</p>
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => onRestore(bug.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm font-medium text-sm flex-1 sm:flex-initial whitespace-nowrap"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                    <button
                      onClick={() => onPermanentlyDelete(bug.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm font-medium text-sm flex-1 sm:flex-initial whitespace-nowrap"
                    >
                      <X className="w-4 h-4" />
                      Delete Forever
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}