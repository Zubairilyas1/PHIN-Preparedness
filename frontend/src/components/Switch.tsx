import { forwardRef, InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, size = 'md', disabled, className = '', id, ...props }, ref) => {
    const inputId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

    const sizeStyles = {
      sm: { track: 'w-8 h-5', thumb: 'w-4 h-4', translate: 'translate-x-4' },
      md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
      lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
    };

    const sizes = sizeStyles[size];

    return (
      <label className={`flex items-start gap-3 cursor-pointer ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="relative flex-shrink-0 mt-0.5">
          <motion.input
            ref={ref}
            type="checkbox"
            id={inputId}
            className="peer h-0 w-0 absolute opacity-0"
            disabled={disabled}
            {...props}
          />
          <motion.div
            className={`relative inline-flex flex-shrink-0 rounded-full border-2 transition-colors duration-200 ${
              'peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 ' +
              'peer-checked:bg-blue-600 peer-checked:border-blue-600 ' +
              'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
            } ${sizes.track}`}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          >
            <motion.div
              animate={{
                x: props.checked ? sizes.translate : 0,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`relative inline-block rounded-full bg-white shadow-transform transition-transform duration-200 ${sizes.thumb}`}
            />
          </motion.div>
        </div>
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && <span className={`text-sm font-medium ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{label}</span>}
            {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';