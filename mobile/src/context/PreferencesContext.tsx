import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../locales/i18n';

const PREFS_KEY = '@tourist_preferences_v1';

type LanguageCode = 'es' | 'en' | 'pt';

type Preferences = {
  darkMode: boolean;
  notificationsEnabled: boolean;
  language: LanguageCode;
  setDarkMode: (value: boolean) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setLanguage: (value: LanguageCode) => void;
};

const PreferencesContext = createContext<Preferences>({
  darkMode: false,
  notificationsEnabled: true,
  language: 'es',
  setDarkMode: () => undefined,
  setNotificationsEnabled: () => undefined,
  setLanguage: () => undefined,
});

export function usePreferences() {
  return useContext(PreferencesContext);
}

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkModeState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [language, setLanguageState] = useState<LanguageCode>('es');

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((stored) => {
        if (!stored) return;
        const prefs = JSON.parse(stored) as Partial<Preferences>;
        setDarkModeState(Boolean(prefs.darkMode));
        setNotificationsEnabledState(prefs.notificationsEnabled !== false);
        if (prefs.language === 'es' || prefs.language === 'en' || prefs.language === 'pt') {
          setLanguageState(prefs.language);
          void i18n.changeLanguage(prefs.language);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ darkMode, notificationsEnabled, language }),
    ).catch(() => undefined);
  }, [darkMode, notificationsEnabled, language]);

  const value = useMemo<Preferences>(
    () => ({
      darkMode,
      notificationsEnabled,
      language,
      setDarkMode: setDarkModeState,
      setNotificationsEnabled: setNotificationsEnabledState,
      setLanguage: (nextLanguage) => {
        setLanguageState(nextLanguage);
        void i18n.changeLanguage(nextLanguage);
      },
    }),
    [darkMode, language, notificationsEnabled],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
