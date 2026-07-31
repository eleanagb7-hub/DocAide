import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Search, Video, MapPin, CalendarDays } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { fetchAllAppointments, fetchAllDoctors, fetchPatients } from '../../lib/queries';
import { StatusBadge, formatDate, toDatetimeLocal, Spinner, EmptyState } from '../../lib/ui';
import type { AppointmentWithDetails, Doctor, Patient, AppointmentStatus, AppointmentType } from '../../types';

export default function SecretaryAgenda() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [appts, docs, pats] = await Promise.all([fetchAllAppointments(), fetchAllDoctors(), fetchPatients()]);
    setAppointments(appts); setDoctors(docs); setPatients(pats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = appointments.filter((a) => {
    const matchesSearch = a.patient?.name?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const matchesDoctor = filterDoctor === 'all' || a.doctor_id === filterDoctor;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesDoctor && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleStatus = async (id: string, status: AppointmentStatus) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda general</h1>
          <p className="text-slate-500 mt-1">Gestiona las citas de todos los doctores</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingId(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Nueva cita
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[180px]" value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)}>
          <option value="all">Todos los doctores</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.specialty}</option>)}
        </select>
        <select className="input max-w-[160px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
          <option value="no_show">No asistió</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} message="No se encontraron citas" />
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div key={apt.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    {apt.type === 'teleconsult' ? <Video className="w-5 h-5 text-blue-600" /> : <MapPin className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{apt.patient?.name}</p>
                    <p className="text-sm text-blue-600 font-medium">{apt.doctor?.specialty ?? 'Doctor'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(apt.scheduled_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:outline-none" value={apt.status} onChange={(e) => handleStatus(apt.id, e.target.value as AppointmentStatus)}>
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="no_show">No asistió</option>
                  </select>
                  <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition" onClick={() => { setEditingId(apt.id); setShowForm(true); }}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition" onClick={() => handleDelete(apt.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3"><StatusBadge status={apt.status} type="appointment" /></div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SecretaryAppointmentForm
          doctors={doctors} patients={patients} editingId={editingId} createdBy={profile?.id ?? null}
          onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function SecretaryAppointmentForm({ doctors, patients, editingId, createdBy, onClose, onSaved }: {
  doctors: Doctor[]; patients: Patient[]; editingId: string | null; createdBy: string | null; onClose: () => void; onSaved: () => void;
}) {
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [type, setType] = useState<AppointmentType>('in_person');
  const [status, setStatus] = useState<AppointmentStatus>('pending');
  const [reason, setReason] = useState('');
  const [teleconsultLink, setTeleconsultLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      const { data } = await supabase.from('appointments').select('*').eq('id', editingId).maybeSingle();
      if (data) {
        setDoctorId(data.doctor_id); setPatientId(data.patient_id);
        setScheduledAt(toDatetimeLocal(data.scheduled_at));
        setType(data.type); setStatus(data.status);
        setReason(data.reason ?? ''); setTeleconsultLink(data.teleconsult_link ?? '');
      }
    })();
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    if (!doctorId || !patientId) { setError('Selecciona doctor y paciente'); setSaving(false); return; }

    const payload = {
      doctor_id: doctorId, patient_id: patientId, created_by: createdBy,
      scheduled_at: new Date(scheduledAt).toISOString(),
      type, status, reason: reason || null,
      teleconsult_link: type === 'teleconsult' ? (teleconsultLink || null) : null,
    };

    const result = editingId
      ? await supabase.from('appointments').update(payload).eq('id', editingId)
      : await supabase.from('appointments').insert(payload);

    if (result.error) { setError(result.error.message); setSaving(false); }
    else { onSaved(); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar cita' : 'Nueva cita'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">Doctor *</label>
            <select className="input" required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Selecciona un doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.specialty}</option>)}
            </select>
          </div>
          <div><label className="label">Paciente *</label>
            <select className="input" required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">Selecciona un paciente</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Fecha y hora *</label><input type="datetime-local" className="input" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
            <div><label className="label">Tipo</label><select className="input" value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
              <option value="in_person">Presencial</option><option value="teleconsult">Teleconsulta</option>
            </select></div>
          </div>
          <div><label className="label">Estado</label><select className="input" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
            <option value="pending">Pendiente</option><option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option><option value="cancelled">Cancelada</option><option value="no_show">No asistió</option>
          </select></div>
          <div><label className="label">Motivo</label><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          {type === 'teleconsult' && <div><label className="label">Link de teleconsulta</label><input className="input" value={teleconsultLink} onChange={(e) => setTeleconsultLink(e.target.value)} placeholder="https://..." /></div>}
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
