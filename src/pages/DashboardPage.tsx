import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Stethoscope, Clock, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AppointmentWithDoctor, Doctor } from '../types';

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [doctorCount, setDoctorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [apptRes, docRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, doctor_id, patient_name, patient_phone, reason, scheduled_at, status, notes, created_at, doctor:doctors(id, name, specialty)')
          .order('scheduled_at', { ascending: true }),
        supabase.from('doctors').select('id', { count: 'exact', head: true }),
      ]);

      if (apptRes.error || docRes.error) {
        setLoading(false);
        return;
      }

      setAppointments((apptRes.data ?? []) as unknown as AppointmentWithDoctor[]);
      setDoctorCount(docRes.count ?? 0);
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled');
  const past = appointments.filter((a) => new Date(a.scheduled_at) < now || a.status === 'cancelled');

  const stats = [
    { label: 'Citas próximas', value: upcoming.length, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: 'Doctores', value: doctorCount, icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Completadas', value: appointments.filter((a) => a.status === 'completed').length, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Canceladas', value: appointments.filter((a) => a.status === 'cancelled').length, icon: XCircle, color: 'text-red-600 bg-red-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de control</h1>
        <p className="text-slate-500 mt-1">Resumen de tu actividad médica</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Próximas citas</h2>
            <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todas
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tienes citas programadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{apt.patient_name}</p>
                    <p className="text-sm text-slate-500">
                      {apt.doctor.name} · {apt.doctor.specialty}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(apt.scheduled_at).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Historial reciente</h2>
            <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todas
            </Link>
          </div>
          {past.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay historial todavía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {past.slice(-5).reverse().map((apt) => (
                <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{apt.patient_name}</p>
                    <p className="text-sm text-slate-500">
                      {apt.doctor.name} · {apt.doctor.specialty}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(apt.scheduled_at).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-blue-50 text-blue-700',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  };
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };
  return <span className={`badge ${styles[status] ?? ''}`}>{labels[status] ?? status}</span>;
}
