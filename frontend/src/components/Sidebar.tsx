import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  FlaskConical,
  Link2,
  UserCheck,
  BarChart2,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../theme/SettingsContext';

import { useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/persons', label: 'Persons', icon: Users },
  { path: '/events', label: 'Events', icon: Activity },
  { path: '/specimens', label: 'Specimens', icon: FlaskConical },
  { path: '/linkages', label: 'Linkages', icon: Link2 },
  { path: '/contacts', label: 'Contacts', icon: UserCheck },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/lab-message', label: 'Lab Message', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { preferences, updateDisplaySettings } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(preferences.display.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    updateDisplaySettings({ sidebarCollapsed: isCollapsed });
  }, [isCollapsed, updateDisplaySettings]);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const SidebarContent = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <motion.div
          layout
          className="flex items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center"
          >
            <Shield className="w-5 h-5 text-white" />
          </motion.div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                key="title"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                OM System
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </motion.button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {tabs.map((tab, index) => {
          const active = isActive(tab.path);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive: isActiveNav }) => `
                relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActiveNav
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              aria-current={active ? 'page' : undefined}
              aria-label={isCollapsed ? tab.label : undefined}
            >
              <motion.div
                whileHover={{ scale: 1.15 }}
                className="w-5 h-5 flex-shrink-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <tab.icon size={20} />
              </motion.div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="truncate"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && !isCollapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-lg"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {resolvedTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{resolvedTheme === 'light' ? 'Dark' : 'Light'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <motion.div
            key="collapsed-user"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            >
              {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: isCollapsed ? -16 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`
          fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: isCollapsed ? '64px' : '280px',
          minWidth: isCollapsed ? '64px' : '280px',
        }}
        aria-label="Sidebar"
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}