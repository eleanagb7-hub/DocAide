import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FileText, Pill, Receipt, Clock, CircleAlert as AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useSettings } from '../../lib/settings';
import { fetchPatientByUser, fetchAppointmentsByPatient, fetchInvoicesByPatient } from '../../lib/queries';
import { StatusBadge, formatDate, Spinner, EmptyState } from '../../lib/ui';
import type { Patient, AppointmentWithDetails, InvoiceWithDetails } from '../../types';

export default function PatientDashboard() {
  const { profile } = useAuth();
  const { t, formatCurrency } = useSettings();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const pat = await fetchPatientByUser(profile.id);
      setPatient(pat);
      if (pat) {
        const [appts, invs] = await Promise.all([fetchAppointmentsByPatient(pat.id), fetchInvoicesByPatient(pat.id)]);
        setAppointments(appts); setInvoices(invs);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled');
  const pendingAmount = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0);

  const stats = [
    { label: t('dash.upcoming'), value: upcoming.length, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: t('invoices.totalPending'), value: formatCurrency(pendingAmount), icon: Receipt, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{profile?.name}</h1>
        <p className="text-slate-500 mt-1">{t('role.patient')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <h2 className="font-semibold text-slate-900">{t('dash.upcoming')}</h2>
          <Link to="/patient/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">{t('dash.viewAgenda')}</Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} message={t('dash.noAppointmentsToday')} />
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{apt.doctor ? `Dr. ${apt.doctor.specialty}` : ''}</p>
                  <p className="text-sm text-slate-500">{formatDate(apt.scheduled_at)}</p>
                </div>
                <StatusBadge status={apt.status} type="appointment" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/patient/records" className="card p-4 hover:shadow-md transition-shadow text-center">
          <FileText className="w-8 h-8 mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-medium text-slate-900">{t('nav.results')}</p>
        </Link>
        <Link to="/patient/prescriptions" className="card p-4 hover:shadow-md transition-shadow text-center">
          <Pill className="w-8 h-8 mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-medium text-slate-900">{t('nav.prescriptionsPatient')}</p>
        </Link>
        <Link to="/patient/invoices" className="card p-4 hover:shadow-md transition-shadow text-center">
          <Receipt className="w-8 h-8 mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-medium text-slate-900">{t('nav.invoices')}</p>
        </Link>
      </div>
    </div>
  );
}
