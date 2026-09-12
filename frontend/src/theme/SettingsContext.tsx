import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface DisplaySettings {
  compactMode: boolean;
  showAnimations: boolean;
  density: 'comfortable' | 'compact' | 'spacious';
  sidebarCollapsed: boolean;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  types: {
    info: boolean;
    success: boolean;
    warning: boolean;
    error: boolean;
  };
}

interface UserPreferences {
  display: DisplaySettings;
  notifications: NotificationSettings;
  language: string;
  timezone: string;
  dateFormat: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  display: {
    compactMode: false,
    showAnimations: true,
    density: 'comfortable',
    sidebarCollapsed: false,
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
    types: {
      info: true,
      success: true,
      warning: true,
      error: true,
    },
  },
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'YYYY-MM-DD',
};

const SETTINGS_KEY = 'om-user-preferences';

interface SettingsContextType {
  preferences: UserPreferences;
  updateDisplaySettings: (settings: Partial<DisplaySettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateLanguage: (lang: string) => void;
  updateTimezone: (tz: string) => void;
  updateDateFormat: (format: string) => void;
  resetToDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    document.documentElement.setAttribute('data-density', preferences.display.density);
    document.documentElement.setAttribute('data-animations', preferences.display.showAnimations ? 'enabled' : 'disabled');
  }, [preferences]);

  const updateDisplaySettings = useCallback((settings: Partial<DisplaySettings>) => {
    setPreferences(prev => ({
      ...prev,
      display: { ...prev.display, ...settings },
    }));
  }, []);

  const updateNotificationSettings = useCallback((settings: Partial<NotificationSettings>) => {
    setPreferences(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...settings },
    }));
  }, []);

  const updateLanguage = useCallback((lang: string) => {
    setPreferences(prev => ({ ...prev, language: lang }));
  }, []);

  const updateTimezone = useCallback((tz: string) => {
    setPreferences(prev => ({ ...prev, timezone: tz }));
  }, []);

  const updateDateFormat = useCallback((format: string) => {
    setPreferences(prev => ({ ...prev, dateFormat: format }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(SETTINGS_KEY);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        preferences,
        updateDisplaySettings,
        updateNotificationSettings,
        updateLanguage,
        updateTimezone,
        updateDateFormat,
        resetToDefaults,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}