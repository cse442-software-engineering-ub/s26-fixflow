import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Bug } from '../types';
import { motion } from 'motion/react';

interface DeleteBugModalProps {
  bug: Bug;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

export function DeleteBugModal({ bug, onSubmit, onCancel }: DeleteBugModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for deletion');
      return;
    }
    
    onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-red-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Delete Bug</h2>
              <p className="text-red-100 text-sm">
                {(bug.bugNumber || `Bug-${bug.id}`)} - {bug.title}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Alert */}
        <div className="p-6 bg-red-50 border-b border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Warning: This action will move the bug to deleted items</h3>
              <p className="text-sm text-red-700">
                You can restore this bug later from the Deleted Bugs section if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          <div className="space-y-4">
            {/* Deletion Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Deletion <span className="text-red-600">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="Explain why this bug is being deleted (e.g., duplicate, not a bug, resolved differently, etc.)"
              />
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                This will help track why bugs were removed
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Bug
          </button>
        </div>
      </motion.div>
    </div>
  );
}
