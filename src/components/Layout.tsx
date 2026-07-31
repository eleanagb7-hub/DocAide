import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Users, DollarSign, FileText, MessageSquare,
  LogOut, Menu, X, LayoutDashboard, Stethoscope, User,
  ClipboardList, Pill, Receipt,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { UserRole } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  doctor: [
    { to: '/doctor', label: 'Panel', icon: LayoutDashboard, },
    { to: '/doctor/agenda', label: 'Agenda', icon: CalendarDays },
    { to: '/doctor/patients', label: 'Pacientes', icon: Users },
    { to: '/doctor/records', label: 'Historias clínicas', icon: FileText },
    { to: '/doctor/prescriptions', label: 'Prescripciones', icon: Pill },
    { to: '/doctor/financial', label: 'Finanzas', icon: DollarSign },
    { to: '/doctor/messages', label: 'Mensajes', icon: MessageSquare },
  ],
  secretary: [
    { to: '/secretary', label: 'Panel', icon: LayoutDashboard },
    { to: '/secretary/agenda', label: 'Agenda', icon: CalendarDays },
    { to: '/secretary/patients', label: 'Pacientes', icon: Users },
    { to: '/secretary/invoices', label: 'Facturas', icon: Receipt },
    { to: '/secretary/messages', label: 'Mensajes', icon: MessageSquare },
  ],
  patient: [
    { to: '/patient', label: 'Inicio', icon: LayoutDashboard },
    { to: '/patient/appointments', label: 'Citas', icon: CalendarDays },
    { to: '/patient/records', label: 'Resultados', icon: ClipboardList },
    { to: '/patient/prescriptions', label: 'Recetas', icon: Pill },
    { to: '/patient/invoices', label: 'Facturas', icon: Receipt },
    { to: '/patient/messages', label: 'Mensajes', icon: MessageSquare },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  doctor: 'Doctor',
  secretary: 'Secretaria',
  patient: 'Paciente',
};

const ROLE_ICONS: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  doctor: Stethoscope,
  secretary: ClipboardList,
  patient: User,
};

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
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
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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
              <p className="text-xs text-slate-500">{ROLE_LABELS[profile.role]}</p>
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
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 md:w-64">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
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
