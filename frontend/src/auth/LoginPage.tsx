import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from './AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, User, AlertCircle, Shield, ArrowRight, Eye, EyeOff, ShieldCheck, Terminal, UserCog, Sun, Moon } from 'lucide-react';

const authSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type AuthForm = z.infer<typeof authSchema>;

const demoCredentials = [
  { label: 'Admin', username: 'admin', password: 'admin123', icon: ShieldCheck, color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Investigator', username: 'investigator1', password: 'inv123', icon: UserCog, color: 'bg-emerald-600 hover:bg-emerald-700' },
];

const floatingShapes = [
  { top: '10%', left: '5%', size: 80, delay: 0, color: 'blue' },
  { top: '20%', right: '10%', size: 120, delay: 1, color: 'emerald' },
  { bottom: '30%', left: '15%', size: 60, delay: 2, color: 'violet' },
  { bottom: '10%', right: '20%', size: 100, delay: 3, color: 'amber' },
  { top: '50%', left: '50%', size: 40, delay: 0.5, color: 'rose' },
];

export function LoginPage() {
  const { login, signup } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [shake, setShake] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
  });

  const fillCredentials = (username: string, password: string) => {
    setValue('username', username);
    setValue('password', password);
  };

  const onSubmit = async (data: AuthForm) => {
    try {
      if (isSignUp) {
        await signup(data.username, data.password);
        toast.success('Account created successfully!');
      } else {
        await login(data.username, data.password);
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (err: any) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(err.response?.data?.error || (isSignUp ? 'Signup failed' : 'Login failed'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-emerald-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8"
    >
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Animated Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {floatingShapes.map((shape, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.12, scale: 1 }}
            transition={{ delay: shape.delay, duration: 1 }}
            style={{
              position: 'absolute',
              [shape.top || '']: shape.top,
              [shape.bottom || '']: shape.bottom,
              [shape.left || '']: shape.left,
              [shape.right || '']: shape.right,
              width: shape.size,
              height: shape.size,
              borderRadius: '50%',
              background: `linear-gradient(135deg, var(--color-${shape.color}-400), var(--color-${shape.color}-600))`,
              filter: 'blur(80px)',
            }}
          />
        ))}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239C92AC' fillOpacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4h-4zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-w-sm z-10"
      >
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-slate-200/50 dark:shadow-black/30 p-6 sm:p-8"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-700 dark:from-white dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
              Outbreak Mgmt
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {isSignUp ? 'Create a new account' : 'Secure Access Portal'}
            </p>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isSignUp ? 'signup' : 'login'}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
              animate={{ 
                opacity: 1, 
                x: shake ? [0, -10, 10, -10, 10, 0] : 0 
              }}
              exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    {...register('username')}
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Username"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm text-slate-900 dark:text-white"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    placeholder="Password"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.password.message}
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all shadow-md"
              >
                {isSubmitting ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                {!isSubmitting && <ArrowRight size={16} />}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Interactive Demo Credentials (Only in Login mode) */}
          {!isSignUp && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                <span>Demo Access</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.label}
                    onClick={() => { fillCredentials(cred.username, cred.password); }}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-white text-xs font-medium ${cred.color} transition-all`}
                  >
                    <cred.icon size={12} />
                    <span>{cred.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center text-[10px] text-slate-400 gap-2">
        <Terminal size={10} /> SE3002 System &copy; 2025
      </div>
    </motion.div>
  );
}
