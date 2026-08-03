import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Users, DollarSign, FileText, MessageSquare,
  LogOut, Menu, X, LayoutDashboard, Stethoscope, User,
  ClipboardList, Pill, Receipt, Globe, Coins,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { CURRENCIES, LANGUAGES, type Currency, type Language } from '../lib/i18n';
import type { UserRole } from '../types';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  doctor: [
    { to: '/doctor', labelKey: 'nav.panel', icon: LayoutDashboard },
    { to: '/doctor/agenda', labelKey: 'nav.agenda', icon: CalendarDays },
    { to: '/doctor/patients', labelKey: 'nav.patients', icon: Users },
    { to: '/doctor/records', labelKey: 'nav.records', icon: FileText },
    { to: '/doctor/prescriptions', labelKey: 'nav.prescriptions', icon: Pill },
    { to: '/doctor/financial', labelKey: 'nav.financial', icon: DollarSign },
    { to: '/doctor/messages', labelKey: 'nav.messages', icon: MessageSquare },
  ],
  secretary: [
    { to: '/secretary', labelKey: 'nav.panel', icon: LayoutDashboard },
    { to: '/secretary/agenda', labelKey: 'nav.agenda', icon: CalendarDays },
    { to: '/secretary/patients', labelKey: 'nav.patients', icon: Users },
    { to: '/secretary/invoices', labelKey: 'nav.invoices', icon: Receipt },
    { to: '/secretary/messages', labelKey: 'nav.messages', icon: MessageSquare },
  ],
  patient: [
    { to: '/patient', labelKey: 'nav.panel', icon: LayoutDashboard },
    { to: '/patient/appointments', labelKey: 'nav.appointments', icon: CalendarDays },
    { to: '/patient/records', labelKey: 'nav.results', icon: ClipboardList },
    { to: '/patient/prescriptions', labelKey: 'nav.prescriptionsPatient', icon: Pill },
    { to: '/patient/invoices', labelKey: 'nav.invoices', icon: Receipt },
    { to: '/patient/messages', labelKey: 'nav.messages', icon: MessageSquare },
  ],
};

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  doctor: 'role.doctor',
  secretary: 'role.secretary',
  patient: 'role.patient',
};

const ROLE_ICONS: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  doctor: Stethoscope,
  secretary: ClipboardList,
  patient: User,
};

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { t, currency, language, setCurrency, setLanguage } = useSettings();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!profile) return null;

  const navItems = NAV_BY_ROLE[profile.role];
  const RoleIcon = ROLE_ICONS[profile.role];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile header */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <img src="/grabado_en_logo_DOCAIDE_sin_transparencia.png" alt="DocAide" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <LanguageCurrencyPicker
            currency={currency} language={language}
            setCurrency={setCurrency} setLanguage={setLanguage}
            compact
          />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block md:w-64 md:flex-shrink-0 bg-white border-r border-slate-200 md:fixed md:top-0 md:bottom-0 md:left-0 z-20`}
      >
        <div className="hidden md:flex items-center h-16 px-5 border-b border-slate-200">
          <img src="/grabado_en_logo_DOCAIDE_sin_transparencia.png" alt="DocAide" className="h-9 w-auto" />
        </div>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <RoleIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{profile.name}</p>
              <p className="text-xs text-slate-500">{t(ROLE_LABEL_KEYS[profile.role])}</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${profile.role}` || item.to === '/doctor' || item.to === '/secretary' || item.to === '/patient'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Settings: currency + language */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">{t('common.currency')}</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="flex-1 text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:outline-none focus:border-blue-500 bg-white"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">{t('common.language')}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="flex-1 text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:outline-none focus:border-blue-500 bg-white"
            >
              {Object.values(LANGUAGES).map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 md:w-64">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 max-w-5xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

function LanguageCurrencyPicker({
  currency, language, setCurrency, setLanguage, compact,
}: {
  currency: Currency; language: Language; setCurrency: (c: Currency) => void; setLanguage: (l: Language) => void; compact?: boolean;
}) {
  const { t } = useSettings();
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:outline-none focus:border-blue-500 bg-white"
        aria-label={t('common.currency')}
      >
        {Object.values(CURRENCIES).map((c) => (
          <option key={c.code} value={c.code}>{c.code}</option>
        ))}
      </select>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:outline-none focus:border-blue-500 bg-white"
        aria-label={t('common.language')}
      >
        {Object.values(LANGUAGES).map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}
