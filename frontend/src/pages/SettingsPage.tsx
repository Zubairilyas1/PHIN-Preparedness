import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../theme/SettingsContext';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { Switch } from '../components/Switch';
import { Select } from '../components/Select';
import { User, Palette, Bell, Monitor, Shield, Key, Trash2, Save, Loader2, Moon, Sun, Monitor as MonitorIcon, Smartphone, Tablet, Layout, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;

const DENSITY_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable', description: 'Standard spacing', icon: <Layout size={18} /> },
  { value: 'compact', label: 'Compact', description: 'Dense information', icon: <Tablet size={18} /> },
  { value: 'spacious', label: 'Spacious', description: 'Generous spacing', icon: <Smartphone size={18} /> },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'auto', label: 'Auto-detect' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: '2024-01-15 (ISO)' },
  { value: 'MM/DD/YYYY', label: '01/15/2024 (US)' },
  { value: 'DD/MM/YYYY', label: '15/01/2024 (EU)' },
  { value: 'MMM DD, YYYY', label: 'Jan 15, 2024' },
];

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: <Sun size={20} />, description: 'Always use light mode' },
  { value: 'dark', label: 'Dark', icon: <Moon size={20} />, description: 'Always use dark mode' },
  { value: 'system', label: 'System', icon: <MonitorIcon size={20} />, description: 'Match system preference' },
];

export function SettingsPage() {
  const { user } = useAuth();
  const { mode, setMode, resolvedTheme } = useTheme();
  const { preferences, updateDisplaySettings, updateNotificationSettings, updateLanguage, updateTimezone, updateDateFormat, resetToDefaults } = useSettings();
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'display' | 'account'>('appearance');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accentColor, setAccentColor] = useState('blue');

  const handleAccentChange = (color: string) => {
    setAccentColor(color);
    // In a real app, this would update CSS variables on the :root element
    document.documentElement.style.setProperty('--primary', `var(--${color}-600)`);
  };

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} />, description: 'Theme, colors, and visual preferences' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, description: 'Alert preferences and delivery methods' },
    { id: 'display', label: 'Display', icon: <Monitor size={20} />, description: 'Layout density and animations' },
    { id: 'account', label: 'Account', icon: <User size={20} />, description: 'Profile, password, and security' },
  ];

  const handleProfileSubmit = async (data: ProfileForm) => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
      setProfileModalOpen(false);
      reset();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      resetToDefaults();
      toast.success('Settings reset to defaults');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences and account settings</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={18} />
            <span>Reset to Defaults</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toast.success('Settings saved successfully')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Save size={18} />
            <span>Save Changes</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="flex gap-6">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-56 flex-shrink-0"
        >
          <nav className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 relative" aria-label="Settings sections">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="w-5 h-5 flex items-center justify-center relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 min-w-0"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card>
                  <SectionHeader title="Theme" description="Choose your preferred color scheme" icon={<Palette />} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {THEME_OPTIONS.map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode(option.value as 'light' | 'dark' | 'system')}
                        className={`relative p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 text-left ${
                          mode === option.value
                            ? 'border-blue-500 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-4 ring-blue-500/20 dark:ring-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <motion.div
                          animate={{ scale: mode === option.value ? 1.1 : 1 }}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            mode === option.value
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {option.icon}
                        </motion.div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                        </div>
                        {mode === option.value && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            className="absolute top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center"
                          >
                            <Check size={12} />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Accent Color" description="Customize primary brand color" icon={<Palette />} />
                  <div className="flex items-center gap-4 flex-wrap">
                    {[
                      { id: 'blue', class: 'bg-blue-500' },
                      { id: 'emerald', class: 'bg-emerald-500' },
                      { id: 'violet', class: 'bg-violet-500' },
                      { id: 'amber', class: 'bg-amber-500' },
                      { id: 'rose', class: 'bg-rose-500' },
                      { id: 'indigo', class: 'bg-indigo-500' }
                    ].map((color) => (
                      <motion.button
                        key={color.id}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAccentChange(color.id)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${color.class} ${
                          accentColor === color.id
                            ? `border-white dark:border-gray-900 ring-4 ring-${color.id}-500/40 shadow-md`
                            : 'border-transparent hover:scale-110 shadow-sm'
                        }`}
                        aria-label={`${color.id} accent color`}
                      >
                        {accentColor === color.id && (
                          <Check className="w-5 h-5 text-white mx-auto" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card>
                  <SectionHeader title="General" description="Master notification controls" icon={<Bell />} />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Enable Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications for system events</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.enabled}
                        onChange={(checked) => updateNotificationSettings({ enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Sound</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Play sound for notifications</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.sound}
                        onChange={(checked) => updateNotificationSettings({ sound: checked })}
                        disabled={!preferences.notifications.enabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Desktop Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Show browser notifications</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.desktop}
                        onChange={(checked) => updateNotificationSettings({ desktop: checked })}
                        disabled={!preferences.notifications.enabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Send email for critical alerts</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.email}
                        onChange={(checked) => updateNotificationSettings({ email: checked })}
                        disabled={!preferences.notifications.enabled}
                      />
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Notification Types" description="Choose which types of notifications to receive" icon={<Bell />} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'info', label: 'Information', desc: 'General updates and tips', color: 'blue' },
                      { key: 'success', label: 'Success', desc: 'Completed operations', color: 'green' },
                      { key: 'warning', label: 'Warning', desc: 'Important alerts', color: 'yellow' },
                      { key: 'error', label: 'Error', desc: 'Failures and issues', color: 'red' },
                    ].map((type) => (
                      <div key={type.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-transparent dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300">
                            <Bell size={20} className={`dark:text-${type.color}-400 text-${type.color}-600`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{type.label}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{type.desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.notifications.types[type.key as keyof typeof preferences.notifications.types]}
                          onChange={(checked) => updateNotificationSettings({
                            types: { ...preferences.notifications.types, [type.key]: checked }
                          })}
                          disabled={!preferences.notifications.enabled}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'display' && (
              <motion.div
                key="display"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card>
                  <SectionHeader title="Layout Density" description="Adjust spacing and information density" icon={<Monitor />} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DENSITY_OPTIONS.map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateDisplaySettings({ density: option.value as typeof preferences.display.density })}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col gap-3 text-left overflow-hidden ${
                          preferences.display.density === option.value
                            ? 'border-blue-500 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className={`w-full rounded-lg border bg-gray-50 dark:bg-gray-900 p-2 border-gray-200 dark:border-gray-700 flex flex-col ${option.value === 'compact' ? 'gap-1' : option.value === 'spacious' ? 'gap-3' : 'gap-2'}`}>
                           <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-1"></div>
                           <div className="w-3/4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                           <div className="w-5/6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            preferences.display.density === option.value
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>
                            {option.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{option.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                          </div>
                        </div>
                        {preferences.display.density === option.value && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            className="absolute top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center"
                          >
                            <Check size={12} />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Animations" description="Control motion and transitions" icon={<Monitor />} />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Enable Animations</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Smooth transitions and micro-interactions</p>
                      </div>
                      <Switch
                        checked={preferences.display.showAnimations}
                        onChange={(checked) => updateDisplaySettings({ showAnimations: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Compact Mode</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reduce padding and spacing globally</p>
                      </div>
                      <Switch
                        checked={preferences.display.compactMode}
                        onChange={(checked) => updateDisplaySettings({ compactMode: checked })}
                      />
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Sidebar" description="Sidebar behavior preferences" icon={<Monitor />} />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Collapse by Default</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Start with sidebar collapsed</p>
                      </div>
                      <Switch
                        checked={preferences.display.sidebarCollapsed}
                        onChange={(checked) => updateDisplaySettings({ sidebarCollapsed: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Show Badges in Navigation</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Display unread counts on icons</p>
                      </div>
                      <Switch
                        checked={preferences.display.showBadges ?? true}
                        onChange={(checked) => updateDisplaySettings({ showBadges: checked })}
                      />
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Localization" description="Language, timezone, and date format" icon={<Monitor />} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      label="Language"
                      value={preferences.language}
                      onChange={(e) => updateLanguage(e.target.value)}
                      options={LANGUAGE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                    />
                    <Select
                      label="Timezone"
                      value={preferences.timezone}
                      onChange={(e) => updateTimezone(e.target.value)}
                      options={TIMEZONE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                    />
                    <Select
                      label="Date Format"
                      value={preferences.dateFormat}
                      onChange={(e) => updateDateFormat(e.target.value)}
                      options={DATE_FORMAT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card>
                  <SectionHeader title="Profile" description="Manage your profile information" icon={<User />} />
                  <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-2xl">{user?.username?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="text-white text-xs font-medium">Upload</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.username}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800/50">System Administrator</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-1">{user?.role}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Member since January 2025</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { reset(); setProfileModalOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        Edit Profile
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                      >
                        Upload Photo
                      </motion.button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Security" description="Password and authentication settings" icon={<Shield />} />
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Key className="text-purple-600 dark:text-purple-400" size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">Disabled</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                        >
                          Enable 2FA
                        </motion.button>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Key className="text-orange-600 dark:text-orange-400" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { reset(); setProfileModalOpen(true); }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                        >
                          Change Password
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border-rose-200 dark:border-rose-900/30">
                  <SectionHeader title="Danger Zone" description="Irreversible actions" icon={<Trash2 />} />
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-rose-800 dark:text-rose-200">Delete Account</p>
                        <p className="text-sm text-rose-600 dark:text-rose-400">Permanently delete your account and all data</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setDeleteConfirmOpen(true)}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium text-sm"
                      >
                        Delete Account
                      </motion.button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Modal
        isOpen={profileModalOpen}
        onClose={() => { setProfileModalOpen(false); reset(); }}
        title="Edit Profile"
        size="lg"
      >
        <form onSubmit={handleSubmit(handleProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Username" error={errors.username?.message} {...register('username')} />
            <FormField label="Email" type="email" error={errors.email?.message} {...register('email')} />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Change Password</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Leave blank to keep current password</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Current Password" type="password" error={errors.currentPassword?.message} {...register('currentPassword')} />
              <FormField label="New Password" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
              <FormField label="Confirm Password" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => { setProfileModalOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={saving || isSubmitting}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Account"
        size="md"
      >
        <div className="text-center space-y-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <Trash2 className="text-red-600 dark:text-red-400" size={32} />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account?</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">This action is irreversible. All your data will be permanently deleted.</p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setDeleteConfirmOpen(false); toast.error('Account deletion not implemented in demo') }}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
);
}