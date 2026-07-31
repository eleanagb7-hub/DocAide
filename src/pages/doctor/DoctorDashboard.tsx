import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, DollarSign, Clock, TrendingUp, CircleAlert as AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { fetchDoctorByUser, fetchAppointmentsByDoctor, fetchPatients, fetchInvoicesByDoctor } from '../../lib/queries';
import { StatusBadge, formatDate, Spinner, EmptyState } from '../../lib/ui';
import type { Doctor, AppointmentWithDetails, Patient, InvoiceWithDetails } from '../../types';

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const doc = await fetchDoctorByUser(profile.id);
      setDoctor(doc);
      if (doc) {
        const [appts, pats, invs] = await Promise.all([
          fetchAppointmentsByDoctor(doc.id),
          fetchPatients(),
          fetchInvoicesByDoctor(doc.id),
        ]);
        setAppointments(appts);
        setPatients(pats);
        setInvoices(invs);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!doctor) {
    return (
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-2">Completa tu perfil de doctor</h2>
        <p className="text-slate-500 text-sm mb-4">Necesitas registrar tu especialidad para empezar a usar DocAide.</p>
        <Link to="/doctor/profile" className="btn-primary">Configurar perfil</Link>
      </div>
    );
  }

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled');
  const today = appointments.filter((a) => {
    const d = new Date(a.scheduled_at);
    return d.toDateString() === now.toDateString() && a.status !== 'cancelled';
  });
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const totalIncome = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
  const pendingIncome = invoices.filter((i) => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0);
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  const stats = [
    { label: 'Citas hoy', value: today.length, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: 'Próximas citas', value: upcoming.length, icon: CalendarDays, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pacientes', value: patients.length, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Ingresos totales', value: `$${totalIncome.toFixed(2)}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bienvenido, Dr. {profile?.name}</h1>
        <p className="text-slate-500 mt-1">{doctor.specialty}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {pendingIncome > 0 && (
        <div className="card p-4 flex items-center gap-3 border-amber-200 bg-amber-50">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>${pendingIncome.toFixed(2)}</strong> en facturas pendientes
            {overdueCount > 0 && ` · ${overdueCount} vencida${overdueCount > 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Citas de hoy</h2>
          <Link to="/doctor/agenda" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Ver agenda</Link>
        </div>
        {today.length === 0 ? (
          <EmptyState icon={CalendarDays} message="No tienes citas hoy" />
        ) : (
          <div className="space-y-3">
            {today.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-600">
                    {new Date(apt.scheduled_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{apt.patient?.name}</p>
                  <p className="text-sm text-slate-500">{apt.reason || 'Consulta'}</p>
                </div>
                <StatusBadge status={apt.status} type="appointment" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Resumen de actividad</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-slate-50">
            <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
            <p className="text-sm text-slate-500">Consultas completadas</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-50">
            <p className="text-2xl font-bold text-slate-900">{appointments.filter((a) => a.status === 'cancelled').length}</p>
            <p className="text-sm text-slate-500">Canceladas</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-50">
            <p className="text-2xl font-bold text-slate-900">{appointments.filter((a) => a.status === 'no_show').length}</p>
            <p className="text-sm text-slate-500">Inasistencias</p>
          </div>
        </div>
      </div>
    </div>
  );
}
