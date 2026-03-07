import { X, Calendar, Code, User, Clock, CheckCircle2, AlertCircle, Sparkles, GitBranch, FileCode, Minus, Plus, Trash2 } from 'lucide-react';
import { Bug } from '../types';

interface BugDetailModalProps {
  bug: Bug;
  onClose: () => void;
  onEdit: (bug: Bug) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BugDetailModal({ bug, onClose, onEdit, onToggleStatus, onDelete }: BugDetailModalProps) {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  const isOverdue = new Date(bug.dueDate) < new Date() && bug.status === 'active';
  const daysUntilDue = Math.ceil((new Date(bug.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate AI summary based on bug data
  const generateAISummary = () => {
    const priorityText = bug.priority === 'high' ? 'critical' : bug.priority === 'medium' ? 'moderate' : 'minor';
    const statusText = bug.status === 'fixed' ? 'has been resolved' : isOverdue ? 'is overdue and requires immediate attention' : 'is currently being worked on';
    const assignmentText = bug.assignedTo ? `assigned to ${bug.assignedTo}` : 'currently unassigned';
    
    return `This ${priorityText} priority bug ${statusText}. It is ${assignmentText} and relates to ${bug.code}. ${
      bug.status === 'active' && daysUntilDue >= 0 
        ? `The issue should be resolved within ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}.` 
        : bug.status === 'active' && daysUntilDue < 0
        ? `This bug is ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'day' : 'days'} overdue.`
        : 'This issue has been successfully resolved.'
    } ${bug.priority === 'high' ? 'Due to its high priority, this bug should be addressed as soon as possible to prevent system impact.' : ''}`;
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-gray-900">{bug.title}</h2>
              {bug.status === 'fixed' ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className={`w-6 h-6 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-mono">{bug.bugNumber || `Bug-${bug.id}`}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[bug.priority]}`}>
                {bug.priority.toUpperCase()} PRIORITY
              </span>
              {bug.status === 'fixed' && (
                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                  FIXED
                </span>
              )}
              {isOverdue && (
                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
                  OVERDUE
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* AI Summary Section */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                AI Summary Overview
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {generateAISummary()}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bug Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                  <Code className="w-4 h-4" />
                  Code Reference
                </div>
                <code className="block text-sm bg-gray-50 p-3 rounded-lg font-mono text-gray-900 break-all">
                  {bug.code}
                </code>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </div>
                <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {new Date(bug.dueDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                  {bug.status === 'active' && daysUntilDue >= 0 && (
                    <span className="text-gray-500 ml-2">
                      ({daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'} remaining)
                    </span>
                  )}
                  {isOverdue && (
                    <span className="text-red-600 ml-2">
                      ({Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? 'day' : 'days'} overdue)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {bug.assignedTo && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                    <User className="w-4 h-4" />
                    Assigned To
                  </div>
                  <p className="text-sm text-gray-900">{bug.assignedTo}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                  <Clock className="w-4 h-4" />
                  Created
                </div>
                <p className="text-sm text-gray-900">{formatDate(bug.createdAt)}</p>
              </div>

              {bug.fixedAt && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Fixed
                  </div>
                  <p className="text-sm text-gray-900">{formatDate(bug.fixedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                {bug.description}
              </p>
            </div>
          </div>

          {/* Fix Details Section */}
          {bug.fixDetails && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Fix Details</h3>
              </div>

              {/* Fix Description */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">How it was fixed:</h4>
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {bug.fixDetails.description}
                  </p>
                </div>
              </div>

              {/* Fixed By and Date */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                    <User className="w-3 h-3" />
                    Fixed By
                  </div>
                  <p className="text-sm font-medium text-gray-900">{bug.fixDetails.fixedBy}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                    <Clock className="w-3 h-3" />
                    Fixed At
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatDate(bug.fixDetails.fixedAt)}</p>
                </div>
              </div>

              {/* Code Changes */}
              <div className="space-y-3">
                {bug.fixDetails.removedCode && (
                  <div className="bg-white p-3 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Minus className="w-4 h-4 text-red-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Code Removed</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3 h-3 text-gray-500" />
                        <span className="font-mono text-gray-700">{bug.fixDetails.removedCode.fileName}</span>
                        {bug.fixDetails.removedCode.lineNumbers && (
                          <span className="text-gray-500">Lines: {bug.fixDetails.removedCode.lineNumbers}</span>
                        )}
                      </div>
                      {bug.fixDetails.removedCode.reference && (
                        <pre className="bg-red-50 p-2 rounded border border-red-200 overflow-x-auto text-xs font-mono text-gray-900">
{bug.fixDetails.removedCode.reference}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {bug.fixDetails.addedCode && (
                  <div className="bg-white p-3 rounded-lg border border-green-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="w-4 h-4 text-green-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Code Added</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3 h-3 text-gray-500" />
                        <span className="font-mono text-gray-700">{bug.fixDetails.addedCode.fileName}</span>
                        {bug.fixDetails.addedCode.lineNumbers && (
                          <span className="text-gray-500">Lines: {bug.fixDetails.addedCode.lineNumbers}</span>
                        )}
                      </div>
                      {bug.fixDetails.addedCode.reference && (
                        <pre className="bg-green-50 p-2 rounded border border-green-300 overflow-x-auto text-xs font-mono text-gray-900">
{bug.fixDetails.addedCode.reference}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Git Branch */}
              {bug.fixDetails.gitBranch && (
                <div className="mt-3 bg-white p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">Git Branch:</span>
                    <code className="text-sm font-mono text-gray-900">{bug.fixDetails.gitBranch}</code>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                onEdit(bug);
                onClose();
              }}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Edit Bug
            </button>
            <button
              onClick={() => {
                onToggleStatus(bug.id);
              }}
              className={`flex-1 py-3 rounded-lg transition-colors font-medium ${
                bug.status === 'fixed'
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              Mark as {bug.status === 'fixed' ? 'Active' : 'Fixed'}
            </button>
            <button
              onClick={() => {
                onDelete(bug.id);
                onClose();
              }}
              className="px-6 py-3 border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Delete Bug
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}