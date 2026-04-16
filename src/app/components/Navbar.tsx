import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Bug, List, CheckCircle, Clock, Home, User, Menu, X, Users, AlertCircle, History, Trash2, Zap, Search, Shield } from 'lucide-react';
import logoImage from '../../assets/fflogo.jpeg';
import { motion, AnimatePresence } from 'motion/react';
import { RecentActivity } from './RecentActivity';
import {
  DEFAULT_AVATAR_GRADIENT_ID,
  isPersistedCustomAvatar,
  normalizeAvatarGradientId,
} from '../lib/user-display';
import { Bug as BugType } from '../types';

interface NavbarProps {
  onAddBug: () => void;
  currentUser: string;
  sessionDisplayName: string;
  sessionAvatarGradient: string;
  sessionAvatarImage: string | null;
  isAdmin?: boolean;
  onLogout: () => void;
  onOpenAccount: () => void;
  bugs: BugType[];
  onBugSelect: (bug: BugType) => void;
  onRefreshBugs?: () => void;
}

export function Navbar({
  onAddBug,
  currentUser,
  sessionDisplayName,
  sessionAvatarGradient,
  sessionAvatarImage,
  isAdmin = false,
  onLogout,
  onOpenAccount,
  bugs,
  onBugSelect,
  onRefreshBugs,
}: NavbarProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BugType[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = bugs.filter(bug => 
      bug.title.toLowerCase().includes(lowerQuery) ||
      bug.bugNumber?.toLowerCase().includes(lowerQuery) ||
      bug.description.toLowerCase().includes(lowerQuery)
    );
    
    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleSelectBug = (bug: BugType) => {
    onBugSelect(bug);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const avatars = [
    { id: DEFAULT_AVATAR_GRADIENT_ID, colors: 'from-blue-500 to-purple-600' },
    { id: 'gradient-pink', colors: 'from-pink-500 to-rose-600' },
    { id: 'gradient-green', colors: 'from-green-500 to-teal-600' },
    { id: 'gradient-orange', colors: 'from-orange-500 to-red-600' },
    { id: 'gradient-purple', colors: 'from-purple-500 to-indigo-600' },
    { id: 'gradient-cyan', colors: 'from-cyan-500 to-blue-600' },
    { id: 'gradient-yellow', colors: 'from-yellow-500 to-orange-600' },
    { id: 'gradient-emerald', colors: 'from-emerald-500 to-green-600' },
  ];

  const getAvatarColors = (avatarId: string) => {
    const avatar = avatars.find(a => a.id === avatarId);
    return avatar ? avatar.colors : 'from-blue-500 to-purple-600';
  };

  const renderAvatar = (size: string = 'w-8 h-8', iconSize: string = 'w-4 h-4') => {
    if (isPersistedCustomAvatar(sessionAvatarImage)) {
      return (
        <div className={`${size} rounded-full overflow-hidden border-2 border-white`}>
          <img src={sessionAvatarImage} alt="Avatar" className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br ${getAvatarColors(normalizeAvatarGradientId(sessionAvatarGradient))} flex items-center justify-center`}
      >
        <User className={`${iconSize} text-white`} />
      </div>
    );
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/active', label: 'Active', icon: Bug },
    { path: '/upcoming', label: 'Upcoming', icon: Clock },
  ];

  const quickActions = [
    { path: '/browse', label: 'Browse all bugs', icon: List },
    { path: '/assigned', label: 'Assigned bugs', icon: Users },
    { path: '/overdue', label: 'Overdue bugs', icon: AlertCircle },
    { path: '/history', label: 'Bug history', icon: History },
    { path: '/deleted', label: 'Deleted bugs', icon: Trash2 },
  ];

  return (
    <nav className="bg-white dark:bg-[#2f353c] border-b border-gray-200 dark:border-[#3e4650] sticky top-0 z-50 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-6">
          <Link to="/">
            <motion.div
              className="flex items-center gap-2 cursor-pointer bg-white dark:bg-[#363d45] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-gray-200/80 dark:border-[#3e4650] px-3 py-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <span className="h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                <img src={logoImage} alt="" className="h-full w-full object-cover object-center scale-110" aria-hidden />
              </span>
              <span className="text-[#1e293b] dark:text-white font-bold text-xl tracking-tight select-none leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>FixFlow</span>
            </motion.div>
          </Link>

          {/* Desktop nav items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#363d45]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="hidden md:block relative flex-1 max-w-xs ml-auto mr-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full bg-white dark:bg-[#2f353c] border border-gray-200 dark:border-[#3e4650] rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
                >
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 px-3 py-2">
                      {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
                    </div>
                    {searchResults.map((bug) => (
                      <button
                        key={bug.id}
                        onClick={() => handleSelectBug(bug)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {bug.bugNumber && (
                                <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  {bug.bugNumber}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                bug.priority === 'high' ? 'bg-red-100 text-red-700' :
                                bug.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {bug.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">{bug.title}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{bug.description}</p>
                          </div>
                          {bug.status === 'fixed' && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              {showSearchResults && searchQuery && searchResults.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full bg-white dark:bg-[#2f353c] border border-gray-200 dark:border-[#3e4650] rounded-lg shadow-lg p-4 z-50"
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No bugs found matching "{searchQuery}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop right section */}
          <div className="hidden md:flex items-center gap-3">
            <RecentActivity currentUser={currentUser} />
            {isAdmin && (
              <Link
                to="/admin/users"
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold hover:bg-purple-200 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Admin features</span>
              </Link>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAccount}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#363d45] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3e4650] transition-all"
            >
              {renderAvatar()}
              <span className="text-sm font-medium text-gray-900 dark:text-white hidden lg:inline">{sessionDisplayName}</span>
            </motion.button>
            <button
              onClick={onLogout}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 font-medium underline transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <RecentActivity currentUser={currentUser} />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAccount}
              className="p-1"
            >
              {renderAvatar()}
            </motion.button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#363d45] rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-gray-200 dark:border-[#3e4650] bg-white dark:bg-[#2f353c]"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#363d45]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile Search Bar */}
              <div className="relative pt-2 pb-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Mobile Search Results */}
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 bg-gray-50 border border-gray-200 rounded-lg max-h-64 overflow-y-auto"
                    >
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 px-3 py-2">
                          {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
                        </div>
                        {searchResults.map((bug) => (
                          <button
                            key={bug.id}
                            onClick={() => { handleSelectBug(bug); setMobileMenuOpen(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-white rounded-lg transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {bug.bugNumber && (
                                    <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                      {bug.bugNumber}
                                    </span>
                                  )}
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    bug.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    bug.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {bug.priority.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 truncate">{bug.title}</p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">{bug.description}</p>
                              </div>
                              {bug.status === 'fixed' && (
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {showSearchResults && searchQuery && searchResults.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <p className="text-sm text-gray-500 text-center">No bugs found matching "{searchQuery}"</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Quick Actions Section */}
              <div className="border-t border-gray-200 dark:border-[#3e4650] pt-3 mt-3">
                <div className="flex items-center gap-2 px-4 py-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Quick Actions</span>
                </div>
                
                <button
                  onClick={() => { onAddBug(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-black font-bold py-3 px-4 rounded-lg transition-all mb-2"
                >
                  <Zap className="w-5 h-5" />
                  Create new bug
                </button>

                {quickActions.map((action) => {
                  const Icon = action.icon;
                  const isActive = location.pathname === action.path;
                  return (
                    <Link
                      key={action.path}
                      to={action.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                        isActive
                          ? 'bg-yellow-300 text-black'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#363d45]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {action.label}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 flex items-center gap-3 px-4 py-3 rounded-lg font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-all"
                  >
                    <Shield className="w-5 h-5" />
                    Admin features
                  </Link>
                )}
              </div>
              
              {/* Account Section */}
              <div className="border-t border-gray-200 dark:border-[#3e4650] pt-3 mt-3">
                <button
                  onClick={() => { onOpenAccount(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#363d45] transition-all"
                >
                  {renderAvatar()}
                  <span className="font-medium">{sessionDisplayName}</span>
                </button>
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}