import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, Receipt, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Spinner, EmptyState, StatusBadge, formatDate } from '../../lib/ui';
import type { AppointmentWithDetails, InvoiceWithDetails } from '../../types';

export default function SecretaryDashboard() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [apptRes, invRes] = await Promise.all([
        supabase.from('appointments').select('*, doctor:doctors(*), patient:patients(*)').order('scheduled_at', { ascending: true }),
        supabase.from('invoices').select('*, patient:patients(id, name)').order('created_at', { ascending: false }),
      ]);
      setAppointments(apptRes.data as unknown as AppointmentWithDetails[]);
      setInvoices(invRes.data as unknown as InvoiceWithDetails[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const now = new Date();
  const today = appointments.filter((a) => new Date(a.scheduled_at).toDateString() === now.toDateString() && a.status !== 'cancelled');
  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled');
  const pendingInv = invoices.filter((i) => i.status === 'pending');
  const overdueInv = invoices.filter((i) => i.status === 'overdue');

  const stats = [
    { label: 'Citas hoy', value: today.length, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: 'Próximas', value: upcoming.length, icon: CalendarDays, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Facturas pendientes', value: pendingInv.length, icon: Receipt, color: 'text-amber-600 bg-amber-50' },
    { label: 'Facturas vencidas', value: overdueInv.length, icon: TrendingUp, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de recepción</h1>
        <p className="text-slate-500 mt-1">Gestión de agenda y administración</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Citas de hoy</h2>
          <Link to="/secretary/agenda" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Ver agenda</Link>
        </div>
        {today.length === 0 ? (
          <EmptyState icon={CalendarDays} message="No hay citas hoy" />
        ) : (
          <div className="space-y-3">
            {today.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-600">{new Date(apt.scheduled_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{apt.patient?.name}</p>
                  <p className="text-sm text-slate-500">{apt.doctor?.specialty ?? 'Doctor'}</p>
                </div>
                <StatusBadge status={apt.status} type="appointment" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
