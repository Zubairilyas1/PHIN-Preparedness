import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../theme/SettingsContext';
import {
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  Settings,
  LogOut,
  User,
  ChevronDown,
  HelpCircle,
  Shield,
  Search,
  Command,
  Keyboard,
} from 'lucide-react';

export function TopBar() {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { preferences, updateDisplaySettings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setShortcutsOpen(false);
      }
      if (event.key === '/' && document.activeElement === document.body) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'K') {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const mockNotifications = [
    { id: 1, type: 'success', title: 'Lab message sent', message: 'FHIR bundle generated for 3 specimens', time: '2 min ago', read: false },
    { id: 2, type: 'warning', title: 'High priority contact', message: 'Contact SUBJ-2025-0005 needs follow-up', time: '15 min ago', read: false },
    { id: 3, type: 'info', title: 'New event created', message: 'EVT-2025-003: Influenza outbreak', time: '1 hour ago', read: true },
    { id: 4, type: 'error', title: 'Sync failed', message: 'Failed to sync with central server', time: '3 hours ago', read: true },
  ];

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>

          <motion.div
            layout
            className="hidden sm:flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">OM System</span>
          </motion.div>

          <motion.div
            layout
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 320 }}
            className="hidden md:block relative"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <motion.input
                ref={searchRef}
                type="text"
                placeholder="Search persons, events, specimens... (⌘K)"
                className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              />
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
                  >
                    <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">Recent searches</div>
                    <div className="px-2 py-1 text-sm text-gray-400 dark:text-gray-500 italic">No recent searches</div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Keyboard size={12} />
                      <span>⌘K to focus search</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9, rotate: -15 }}
            onClick={toggleTheme}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
          >
            {resolvedTheme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  ref={notificationsRef}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {mockNotifications.map((notif) => (
                      <motion.button
                        key={notif.id}
                        whileHover={{ x: 4 }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'warning' ? 'bg-yellow-500' : notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${notif.type === 'error' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{notif.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notif.time}</p>
                          </div>
                          {!notif.read && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1"
                            />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline">View all notifications</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.div
            ref={userMenuRef}
            className="relative"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <span className="text-white font-medium text-sm">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">{user?.username}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </motion.button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden py-1"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                  </div>
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => { setUserMenuOpen(false); window.location.href = '/settings'; }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => { setUserMenuOpen(false); setShortcutsOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <Keyboard size={18} />
                    <span>Keyboard Shortcuts</span>
                    <Command className="ml-auto text-xs text-gray-400" size={12} />
                    <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">⌘K</kbd>
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => { setUserMenuOpen(false); window.location.href = '/help'; }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <HelpCircle size={18} />
                    <span>Help & Docs</span>
                  </motion.button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={async () => { setUserMenuOpen(false); await logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {shortcutsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShortcutsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShortcutsOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X size={20} />
                </motion.button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                {[
                  { keys: ['⌘', 'K'], desc: 'Focus search' },
                  { keys: ['⌘', 'Shift', 'K'], desc: 'Show shortcuts' },
                  { keys: ['⌘', 'B'], desc: 'Toggle sidebar' },
                  { keys: ['⌘', 'Shift', 'D'], desc: 'Toggle dark mode' },
                  { keys: ['Escape'], desc: 'Close modals/menus' },
                  { keys: ['Tab'], desc: 'Navigate forward' },
                  { keys: ['Shift', 'Tab'], desc: 'Navigate backward' },
                  { keys: ['Enter'], desc: 'Submit forms' },
                ].map((shortcut, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((k, ki) => (
                        <motion.kbd
                          key={ki}
                          whileHover={{ scale: 1.1 }}
                          className="px-2.5 py-1.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 min-w-[40px] text-center"
                        >
                          {k}
                        </motion.kbd>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{shortcut.desc}</span>
                  </motion.div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Press Escape or click outside to close</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}