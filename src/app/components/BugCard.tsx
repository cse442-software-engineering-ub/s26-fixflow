import { Bug } from '../types';
import { Calendar, Code, CheckCircle2, Circle, Trash2, Edit, User, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface BugCardProps {
  bug: Bug;
  onToggleStatus: (id: string) => void;
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
  onClick?: (bug: Bug) => void;
}

export function BugCard({ bug, onToggleStatus, onEdit, onDelete, onClick }: BugCardProps) {
  const clampStyle = {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  };
  const hasLongPreviewContent = (bug.code || '').length > 180 || (bug.description || '').length > 260;

  const priorityConfig = {
    high: {
      gradient: 'from-red-50 to-pink-50',
      border: 'border-red-200',
      badge: 'bg-red-600 text-white',
      icon: 'text-red-500',
    },
    medium: {
      gradient: 'from-orange-50 to-yellow-50',
      border: 'border-orange-200',
      badge: 'bg-orange-600 text-white',
      icon: 'text-orange-500',
    },
    low: {
      gradient: 'from-green-50 to-emerald-50',
      border: 'border-green-200',
      badge: 'bg-green-600 text-white',
      icon: 'text-green-500',
    },
  } as const;

  const normalizedPriority =
    bug.priority === 'high' || bug.priority === 'medium' || bug.priority === 'low'
      ? bug.priority
      : 'low';

  const config = priorityConfig[normalizedPriority];

  const dueDateObj = bug.dueDate ? new Date(bug.dueDate) : null;
  const now = new Date();
  const isOverdue = !!dueDateObj && dueDateObj < now && bug.status === 'active';
  const daysUntilDue = dueDateObj
    ? Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-xl border-2 ${config.border} p-6 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden ${
        bug.status === 'fixed' ? 'opacity-75' : ''
      }`}
      onClick={() => onClick?.(bug)}
    >
      {/* Small color indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${config.badge}`} />
      
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10 pl-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <motion.button
            whileHover={{ scale: 1.2, rotate: 360 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(bug.id);
            }}
            className="mt-1"
          >
              {bug.status === 'fixed' ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className={`w-6 h-6 ${config.icon}`} />
              )}
          </motion.button>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-lg mb-3 ${
              bug.status === 'fixed' ? 'line-through text-gray-500' : 'text-gray-900'
            } break-all`}>
              <span style={{ ...clampStyle, WebkitLineClamp: 2 }}>{bug.title}</span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {bug.bugNumber || `Bug-${bug.id}`}
              </span>
              <span className={`px-3 py-1 rounded-md text-xs font-bold ${config.badge}`}>
                {(bug.priority || normalizedPriority).toUpperCase()}
              </span>
              {bug.status === 'fixed' && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 rounded-md text-xs font-bold bg-green-600 text-white flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  FIXED
                </motion.span>
              )}
              {isOverdue && (
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="px-3 py-1 rounded-md text-xs font-bold bg-red-600 text-white"
                >
                  OVERDUE
                </motion.span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(bug);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bug.id);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="space-y-3 relative z-10 pl-2">
        <div className="flex items-start gap-3 text-sm bg-gray-50 rounded-lg p-3">
          <Code className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
          <code
            className="text-gray-800 font-mono text-sm break-all font-medium"
            style={{ ...clampStyle, WebkitLineClamp: 5 }}
          >
            {bug.code || ''}
          </code>
        </div>

        <div className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg p-3">
          <Calendar className={`w-5 h-5 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
          <span className={isOverdue ? 'text-red-700 font-bold' : 'text-gray-700 font-medium'}>
            {dueDateObj
              ? <>
                  Due:{' '}
                  {dueDateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </>
              : 'No due date'}
            {dueDateObj && bug.status === 'active' && daysUntilDue >= 0 && (
              <span className="text-gray-500 ml-2">
                ({daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'} left)
              </span>
            )}
          </span>
        </div>

        {bug.assignedTo && (
          <div className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg p-3">
            <User className="w-5 h-5 text-slate-600" />
            <span className="text-gray-700 font-medium">Assigned to: <span className="font-bold">{bug.assignedTo}</span></span>
          </div>
        )}

        <div className="relative bg-gray-50 rounded-lg p-3">
          <p
            className="text-gray-700 text-sm leading-relaxed break-all"
            style={{ ...clampStyle, WebkitLineClamp: 6 }}
          >
            {bug.description || ''}
          </p>
          {hasLongPreviewContent && (
            <div className="mt-2 text-xs font-medium text-blue-600">
              Click to read more
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}