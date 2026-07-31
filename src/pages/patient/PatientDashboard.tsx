import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Pill, Receipt, MessageSquare, Video, Clock, Circle as XCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { fetchPatientByUser } from '../../lib/queries';
import { Spinner, EmptyState, StatusBadge, formatDate } from '../../lib/ui';
import type { Patient, AppointmentWithDetails, InvoiceWithDetails, Prescription, MedicalRecord } from '../../types';

export default function PatientDashboard() {
  const { profile } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const pat = await fetchPatientByUser(profile.id);
      setPatient(pat);
      if (pat) {
        const [apptRes, invRes, prescRes, recRes] = await Promise.all([
          supabase.from('appointments').select('*, doctor:doctors(*), patient:patients(*)').eq('patient_id', pat.id).order('scheduled_at', { ascending: true }),
          supabase.from('invoices').select('*, patient:patients(id, name)').eq('patient_id', pat.id).order('created_at', { ascending: false }),
          supabase.from('prescriptions').select('*').eq('patient_id', pat.id).order('created_at', { ascending: false }),
          supabase.from('medical_records').select('*').eq('patient_id', pat.id).order('created_at', { ascending: false }),
        ]);
        setAppointments(apptRes.data as unknown as AppointmentWithDetails[]);
        setInvoices(invRes.data as unknown as InvoiceWithDetails[]);
        setPrescriptions(prescRes.data as Prescription[] ?? []);
        setRecords(recRes.data as MedicalRecord[] ?? []);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled');
  const pendingInvoices = invoices.filter((i) => i.status !== 'paid');

  const stats = [
    { label: 'Próximas citas', value: upcoming.length, icon: CalendarDays, color: 'text-blue-600 bg-blue-50', link: '/patient/appointments' },
    { label: 'Recetas activas', value: prescriptions.length, icon: Pill, color: 'text-emerald-600 bg-emerald-50', link: '/patient/prescriptions' },
    { label: 'Facturas pendientes', value: pendingInvoices.length, icon: Receipt, color: 'text-amber-600 bg-amber-50', link: '/patient/invoices' },
    { label: 'Resultados', value: records.length, icon: MessageSquare, color: 'text-purple-600 bg-purple-50', link: '/patient/records' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hola, {profile?.name}</h1>
        <p className="text-slate-500 mt-1">Tu portal de salud</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.link} className="card p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Próximas citas</h2>
          <Link to="/patient/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Ver todas</Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} message="No tienes citas programadas" />
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  {apt.type === 'teleconsult' ? <Video className="w-5 h-5 text-blue-600" /> : <Clock className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{apt.doctor?.specialty ?? 'Consulta'}</p>
                  <p className="text-xs text-slate-400">{formatDate(apt.scheduled_at)}</p>
                  {apt.type === 'teleconsult' && apt.teleconsult_link && (
                    <a href={apt.teleconsult_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Unirse a teleconsulta</a>
                  )}
                </div>
                <StatusBadge status={apt.status} type="appointment" />
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingInvoices.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Facturas pendientes</h2>
          <div className="space-y-3">
            {pendingInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">${Number(inv.amount).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{inv.due_date && `Vence: ${formatDate(inv.due_date)}`}</p>
                </div>
                <StatusBadge status={inv.status} type="invoice" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
