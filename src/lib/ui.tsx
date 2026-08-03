import { useSettings } from './settings';
import type { AppointmentStatus, InvoiceStatus } from '../types';

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  no_show: 'bg-slate-100 text-slate-600',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
};

export function StatusBadge({ status, type }: { status: string; type: 'appointment' | 'invoice' }) {
  const { t } = useSettings();
  const colors = type === 'appointment' ? APPOINTMENT_STATUS_COLORS : INVOICE_STATUS_COLORS;
  const labelKey = type === 'appointment' ? `status.${status}` : `status.${status}`;
  return <span className={`badge ${colors[status] ?? ''}`}>{t(labelKey)}</span>;
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  const locale = typeof window !== 'undefined' && localStorage.getItem('docaide_language') === 'en' ? 'en-US' : 'es-ES';
  return new Date(dateStr).toLocaleString(locale, opts ?? {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(dateStr: string) {
  const locale = typeof window !== 'undefined' && localStorage.getItem('docaide_language') === 'en' ? 'en-US' : 'es-ES';
  return new Date(dateStr).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function toDatetimeLocal(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 16);
}

export function Spinner({ className = '' }: { className?: string }) {
  return <div className={`w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ${className}`} />;
}

export function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="card p-12 text-center">
      <Icon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
