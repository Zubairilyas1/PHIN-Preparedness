import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from './Toast';
import { useSettings } from '../theme/SettingsContext';

export function Layout() {
  const { preferences } = useSettings();
  const isCollapsed = preferences.display.sidebarCollapsed;
  const showAnimations = preferences.display.showAnimations;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar />

      <motion.div
        initial={false}
        animate={{ marginLeft: isCollapsed ? '64px' : '280px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="lg:transition-all lg:duration-300"
      >
        <TopBar />

        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key="toast-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ToastContainer />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key="outlet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: showAnimations ? 0.3 : 0,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}