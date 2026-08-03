import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CURRENCIES, TRANSLATIONS, type Currency, type Language } from './i18n';

interface SettingsContextValue {
  currency: Currency;
  language: Language;
  setCurrency: (c: Currency) => void;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  locale: string;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function getStored<T extends string>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  return (localStorage.getItem(key) as T) || fallback;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => getStored('docaide_currency', 'USD'));
  const [language, setLanguageState] = useState<Language>(() => getStored('docaide_language', 'es'));

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('docaide_currency', c);
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    localStorage.setItem('docaide_language', l);
  }, []);

  const t = useCallback((key: string) => {
    return TRANSLATIONS[language][key] ?? TRANSLATIONS.es[key] ?? key;
  }, [language]);

  const formatCurrency = useCallback((amount: number) => {
    const info = CURRENCIES[currency];
    const formatted = new Intl.NumberFormat(info.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${info.symbol} ${formatted}`;
  }, [currency]);

  const locale = CURRENCIES[currency].locale;

  return (
    <SettingsContext.Provider value={{ currency, language, setCurrency, setLanguage, t, formatCurrency, locale }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
