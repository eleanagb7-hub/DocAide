import { useEffect, useState, useCallback } from 'react';
import { Plus, X, CalendarDays, Video, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { fetchPatientByUser, fetchAllDoctors } from '../../lib/queries';
import { Spinner, EmptyState, StatusBadge, formatDate, toDatetimeLocal } from '../../lib/ui';
import type { Patient, Doctor, AppointmentWithDetails, AppointmentStatus } from '../../types';

export default function PatientAppointments() {
  const { profile } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const pat = await fetchPatientByUser(profile.id);
    setPatient(pat);
    setDoctors(await fetchAllDoctors());
    if (pat) {
      const { data } = await supabase
        .from('appointments')
        .select('*, doctor:doctors(*), patient:patients(*)')
        .eq('patient_id', pat.id)
        .order('scheduled_at', { ascending: true });
      setAppointments(data as unknown as AppointmentWithDetails[]);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const cancelAppointment = async (id: string) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    await supabase.from('appointments').update({ status: 'cancelled' as AppointmentStatus }).eq('id', id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus } : a)));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled');
  const past = appointments.filter((a) => new Date(a.scheduled_at) < now || a.status === 'cancelled');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis citas</h1>
          <p className="text-slate-500 mt-1">Programa y gestiona tus consultas</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Solicitar cita</button>
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Próximas citas</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} message="No tienes citas próximas" />
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <div key={apt.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {apt.type === 'teleconsult' ? <Video className="w-5 h-5 text-blue-600" /> : <MapPin className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{apt.doctor?.specialty ?? 'Consulta'}</p>
                      <p className="text-sm text-slate-500">{apt.reason || 'Consulta general'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(apt.scheduled_at)}</p>
                      {apt.type === 'teleconsult' && apt.teleconsult_link && (
                        <a href={apt.teleconsult_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Unirse a teleconsulta</a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={apt.status} type="appointment" />
                    {apt.status !== 'completed' && (
                      <button onClick={() => cancelAppointment(apt.id)} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition">Cancelar</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Historial de citas</h2>
          <div className="space-y-3">
            {past.slice().reverse().map((apt) => (
              <div key={apt.id} className="card p-4 opacity-75">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{apt.doctor?.specialty ?? 'Consulta'}</p>
                    <p className="text-xs text-slate-400">{formatDate(apt.scheduled_at)}</p>
                  </div>
                  <StatusBadge status={apt.status} type="appointment" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && patient && (
        <RequestForm patientId={patient.id} doctors={doctors} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function RequestForm({ patientId, doctors, onClose, onSaved }: { patientId: string; doctors: Doctor[]; onClose: () => void; onSaved: () => void }) {
  const [doctorId, setDoctorId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    if (!doctorId) { setError('Selecciona un doctor'); setSaving(false); return; }
    const { error } = await supabase.from('appointments').insert({
      doctor_id: doctorId, patient_id: patientId,
      scheduled_at: new Date(scheduledAt).toISOString(),
      status: 'pending', type: 'in_person',
      reason: reason || null,
    });
    if (error) { setError(error.message); setSaving(false); } else { onSaved(); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Solicitar cita</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">Doctor / Especialidad *</label>
            <select className="input" required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Selecciona una especialidad</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.specialty}</option>)}
            </select>
          </div>
          <div><label className="label">Fecha y hora preferida *</label><input type="datetime-local" className="input" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
          <div><label className="label">Motivo de consulta</label><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe tu motivo" /></div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Enviando...' : 'Solicitar cita'}</button>
          </div>
          <p className="text-xs text-slate-400 text-center">Tu solicitud quedará pendiente hasta que el doctor la confirme.</p>
        </form>
      </div>
    </div>
  );
}
