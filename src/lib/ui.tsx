import type { AppointmentStatus, InvoiceStatus } from '../types';

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  no_show: 'bg-slate-100 text-slate-600',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  overdue: 'Vencida',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
};

export function StatusBadge({ status, type }: { status: string; type: 'appointment' | 'invoice' }) {
  const labels = type === 'appointment' ? APPOINTMENT_STATUS_LABELS : INVOICE_STATUS_LABELS;
  const colors = type === 'appointment' ? APPOINTMENT_STATUS_COLORS : INVOICE_STATUS_COLORS;
  return <span className={`badge ${colors[status] ?? ''}`}>{labels[status] ?? status}</span>;
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleString('es-ES', opts ?? {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
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
