//Added DarkMode Fam//
import { Link, useLocation } from 'react-router';
import { Plus, List, Users, AlertCircle, History, Zap, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  onAddBug: () => void;
  stats: {
    overdue: number;
    assigned: number;
    total: number;
  };
}

export function Sidebar({ onAddBug, stats }: SidebarProps) {
  const location = useLocation();

  const actions = [
    { 
      path: '/browse', 
      label: 'Browse all bugs', 
      icon: List,
      gradient: 'from-blue-400 to-cyan-400',
    },
    { 
      path: '/assigned', 
      label: 'Assigned bugs', 
      icon: Users,
      gradient: 'from-purple-400 to-pink-400',
    },
    { 
      path: '/overdue', 
      label: 'Overdue bugs', 
      icon: AlertCircle,
      gradient: 'from-red-400 to-orange-400',
    },
    { 
      path: '/history', 
      label: 'Bug history', 
      icon: History,
      gradient: 'from-green-400 to-emerald-400',
    },
    { 
      path: '/deleted', 
      label: 'Deleted bugs', 
      icon: Trash2,
      gradient: 'from-gray-400 to-slate-400',
    },
  ];

  return (
    <div className="w-80 bg-white dark:bg-[#2f353c] border-l border-gray-200 dark:border-[#3e4650] p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-5 h-5 text-yellow-500" />
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Quick Actions</h3>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddBug}
        className="w-full flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
      >
        <Plus className="w-5 h-5" />
        Create new bug
      </motion.button>

      {actions.map((action, index) => {
        const Icon = action.icon;
        const isActive = location.pathname === action.path;
        
        return (
          <motion.div
            key={action.path}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to={action.path}
              className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md bg-yellow-300 hover:bg-yellow-400 text-black"
            >
              <Icon className="w-5 h-5" />
              {action.label}
            </Link>
          </motion.div>
        );
      })}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-4 border-t border-gray-200 dark:border-[#3e4650] space-y-3"
      >
        <div className="bg-gray-50 dark:bg-[#363d45] rounded-xl p-3 border border-gray-200 dark:border-[#3e4650]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Total Bugs:</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.total}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-[#363d45] rounded-xl p-3 border border-gray-200 dark:border-[#3e4650]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Assigned to you:</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.assigned}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-[#363d45] rounded-xl p-3 border border-gray-200 dark:border-[#3e4650]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Overdue:</span>
            <motion.span 
              animate={stats.overdue > 0 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-xl font-bold text-red-600"
            >
              {stats.overdue}
            </motion.span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}