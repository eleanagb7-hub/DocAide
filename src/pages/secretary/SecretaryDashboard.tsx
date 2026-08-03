import { useEffect, useState } from 'react';
import { CalendarDays, Users, Receipt, Clock } from 'lucide-react';
import { useSettings } from '../../lib/settings';
import { fetchAllAppointments, fetchPatients, fetchAllInvoices } from '../../lib/queries';
import { StatusBadge, formatDate, Spinner, EmptyState } from '../../lib/ui';
import type { AppointmentWithDetails, Patient, InvoiceWithDetails } from '../../types';

export default function SecretaryDashboard() {
  const { t, formatCurrency } = useSettings();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [appts, pats, invs] = await Promise.all([fetchAllAppointments(), fetchPatients(), fetchAllInvoices()]);
      setAppointments(appts); setPatients(pats); setInvoices(invs);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const now = new Date();
  const today = appointments.filter((a) => {
    const d = new Date(a.scheduled_at);
    return d.toDateString() === now.toDateString() && a.status !== 'cancelled';
  });
  const pendingInvoices = invoices.filter((i) => i.status !== 'paid').length;
  const paidInvoices = invoices.filter((i) => i.status === 'paid').length;

  const stats = [
    { label: t('secretary.todayAppointments'), value: today.length, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: t('secretary.totalPatients'), value: patients.length, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: t('secretary.pendingInvoices'), value: pendingInvoices, icon: Receipt, color: 'text-amber-600 bg-amber-50' },
    { label: t('secretary.paidInvoices'), value: paidInvoices, icon: Receipt, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('secretary.dashTitle')}</h1>
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
        <h2 className="font-semibold text-slate-900 mb-4">{t('secretary.todayAppointments')}</h2>
        {today.length === 0 ? (
          <EmptyState icon={CalendarDays} message={t('secretary.noAppointmentsToday')} />
        ) : (
          <div className="space-y-3">
            {today.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-600">
                    {new Date(apt.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{apt.patient?.name}</p>
                  <p className="text-sm text-slate-500">{apt.doctor?.specialty}</p>
                </div>
                <StatusBadge status={apt.status} type="appointment" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">{t('secretary.recentPatients')}</h2>
        {patients.length === 0 ? (
          <EmptyState icon={Users} message={t('secretary.noPatients')} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {patients.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">{p.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.phone ?? ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
