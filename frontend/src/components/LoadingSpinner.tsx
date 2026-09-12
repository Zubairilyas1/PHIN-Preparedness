import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray';
  className?: string;
  text?: string;
  overlay?: boolean;
}

const sizeStyles = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4',
};

const colorStyles = {
  blue: 'border-blue-600 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-600 border-t-transparent',
};

export function LoadingSpinner({ size = 'md', color = 'blue', className = '', text, overlay = false }: LoadingSpinnerProps) {
  const spinner = (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeStyles[size]} ${colorStyles[color]} rounded-full`}
      role="status"
      aria-label="Loading"
    />
  );

  if (overlay) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
        >
          {spinner}
          {text && <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {spinner}
      {text && <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{text}</span>}
    </div>
  );
}

export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
        />
        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">{text}</p>
        <motion.div
          animate={{ scaleX: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto"
        >
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1/3 h-full bg-blue-600 rounded-full"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function ButtonLoader({ size = 'md', color = 'white' }: { size?: 'sm' | 'md' | 'lg'; color?: 'white' | 'blue' }) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-2',
  };

  const colorStyles = {
    white: 'border-white border-t-transparent',
    blue: 'border-blue-600 border-t-transparent',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className={`${sizeStyles[size]} ${colorStyles[color]} rounded-full`}
      aria-label="Loading"
    />
  );
}

export function InlineLoader({ size = 'md', color = 'blue' }: { size?: 'sm' | 'md' | 'lg'; color?: 'blue' | 'gray' }) {
  const sizeStyles = {
    sm: 'w-3 h-3 border-1.5',
    md: 'w-4 h-4 border-2',
    lg: 'w-5 h-5 border-2',
  };

  const colorStyles = {
    blue: 'border-blue-600 border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeStyles[size]} ${colorStyles[color]} rounded-full inline-block`}
      aria-label="Loading"
    />
  );
}