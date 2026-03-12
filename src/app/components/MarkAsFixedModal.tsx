import { useState } from 'react';
import { X, CheckCircle2, Code, GitBranch, FileCode, Minus, Plus } from 'lucide-react';
import { Bug, FixDetails } from '../types';
import { motion } from 'motion/react';

interface MarkAsFixedModalProps {
  bug: Bug;
  onSubmit: (fixDetails: Omit<FixDetails, 'fixedBy' | 'fixedAt'>) => void;
  onCancel: () => void;
}

export function MarkAsFixedModal({ bug, onSubmit, onCancel }: MarkAsFixedModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    removedFileName: '',
    removedLineNumbers: '',
    removedReference: '',
    addedFileName: '',
    addedLineNumbers: '',
    addedReference: '',
    gitBranch: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      alert('Please provide a description of the fix');
      return;
    }

    const fixDetails: Omit<FixDetails, 'fixedBy' | 'fixedAt'> = {
      description: formData.description,
      ...(formData.removedFileName && {
        removedCode: {
          fileName: formData.removedFileName,
          lineNumbers: formData.removedLineNumbers,
          reference: formData.removedReference,
        }
      }),
      ...(formData.addedFileName && {
        addedCode: {
          fileName: formData.addedFileName,
          lineNumbers: formData.addedLineNumbers,
          reference: formData.addedReference,
        }
      }),
      ...(formData.gitBranch && { gitBranch: formData.gitBranch }),
    };

    onSubmit(fixDetails);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mark Bug as Fixed</h2>
              <p className="text-sm text-gray-600 mt-0.5">{bug.bugNumber || `Bug-${bug.id}`}: {bug.title}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Fix Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fix Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Describe how you fixed this bug..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">Explain the solution and any important details</p>
          </div>

          {/* Code Removed Section */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Minus className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Code Removed</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <FileCode className="w-4 h-4 inline mr-1" />
                  File Name
                </label>
                <input
                  type="text"
                  value={formData.removedFileName}
                  onChange={(e) => setFormData({ ...formData, removedFileName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., src/components/Header.tsx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Line Numbers
                </label>
                <input
                  type="text"
                  value={formData.removedLineNumbers}
                  onChange={(e) => setFormData({ ...formData, removedLineNumbers: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 45-52 or 120"
                />
              </div>

              {/* Intentionally only capturing which file and which lines were removed */}
            </div>
          </div>

          {/* Code Added Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Code Added</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <FileCode className="w-4 h-4 inline mr-1" />
                  File Name
                </label>
                <input
                  type="text"
                  value={formData.addedFileName}
                  onChange={(e) => setFormData({ ...formData, addedFileName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., src/components/Header.tsx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Line Numbers
                </label>
                <input
                  type="text"
                  value={formData.addedLineNumbers}
                  onChange={(e) => setFormData({ ...formData, addedLineNumbers: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 45-60 or 75"
                />
              </div>

              {/* Intentionally only capturing which file and which lines were added */}
            </div>
          </div>

          {/* Git Branch */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <GitBranch className="w-4 h-4 inline mr-1" />
              Git Branch
            </label>
            <input
              type="text"
              value={formData.gitBranch}
              onChange={(e) => setFormData({ ...formData, gitBranch: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., fix/login-button-mobile"
            />
            <p className="text-xs text-gray-500 mt-1">The branch where this fix was committed</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg shadow-green-500/30"
            >
              <CheckCircle2 className="w-5 h-5 inline mr-2" />
              Mark as Fixed
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}