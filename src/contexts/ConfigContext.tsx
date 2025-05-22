import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppConfig {
  // Currency settings
  currency: {
    symbol: string;
    code: string;
    position: 'before' | 'after';
  };
  
  // Due date settings
  dueDate: {
    alertDays: number; // Number of days before due date to show alert
    showDueTodayAlert: boolean;
  };
  
  // Theme settings
  theme: {
    preferredMode: 'dark' | 'light' | 'system';
  };
  
  // Time tracking settings
  timeTracking: {
    autoStartTimer: boolean;
    showElapsedTimeInTitle: boolean;
  };
}

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  updateCurrencySettings: (settings: Partial<AppConfig['currency']>) => void;
  updateDueDateSettings: (settings: Partial<AppConfig['dueDate']>) => void;
  updateThemeSettings: (settings: Partial<AppConfig['theme']>) => void;
  updateTimeTrackingSettings: (settings: Partial<AppConfig['timeTracking']>) => void;
}

const defaultConfig: AppConfig = {
  currency: {
    symbol: '$',
    code: 'USD',
    position: 'before',
  },
  dueDate: {
    alertDays: 3,
    showDueTodayAlert: true,
  },
  theme: {
    preferredMode: 'system',
  },
  timeTracking: {
    autoStartTimer: false,
    showElapsedTimeInTitle: true,
  },
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('app-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        // Merge with default config to ensure all properties exist
        setConfig({
          ...defaultConfig,
          ...parsedConfig,
          // Ensure nested objects are properly merged
          currency: { ...defaultConfig.currency, ...parsedConfig.currency },
          dueDate: { ...defaultConfig.dueDate, ...parsedConfig.dueDate },
          theme: { ...defaultConfig.theme, ...parsedConfig.theme },
          timeTracking: { ...defaultConfig.timeTracking, ...parsedConfig.timeTracking },
        });
      } catch (error) {
        console.error('Failed to parse saved app config:', error);
      }
    }
  }, []);

  // Update config and save to localStorage
  const updateConfig = (newConfig: Partial<AppConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('app-config', JSON.stringify(updatedConfig));
  };

  // Helper functions for updating specific sections
  const updateCurrencySettings = (settings: Partial<AppConfig['currency']>) => {
    updateConfig({
      currency: { ...config.currency, ...settings },
    });
  };

  const updateDueDateSettings = (settings: Partial<AppConfig['dueDate']>) => {
    updateConfig({
      dueDate: { ...config.dueDate, ...settings },
    });
  };

  const updateThemeSettings = (settings: Partial<AppConfig['theme']>) => {
    updateConfig({
      theme: { ...config.theme, ...settings },
    });
  };

  const updateTimeTrackingSettings = (settings: Partial<AppConfig['timeTracking']>) => {
    updateConfig({
      timeTracking: { ...config.timeTracking, ...settings },
    });
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        updateConfig,
        updateCurrencySettings,
        updateDueDateSettings,
        updateThemeSettings,
        updateTimeTrackingSettings,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};