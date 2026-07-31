import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, X, CalendarDays, Phone, User, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AppointmentWithDoctor, Doctor, AppointmentStatus } from '../types';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    const { data, error } = await supabase.from('doctors').select('*').order('name');
    if (!error && data) setDoctors(data);
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('id, doctor_id, patient_name, patient_phone, reason, scheduled_at, status, notes, created_at, doctor:doctors(id, name, specialty)')
      .order('scheduled_at', { ascending: false });
    if (!error && data) {
      setAppointments(data as unknown as AppointmentWithDoctor[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDoctors();
    loadAppointments();
  }, [loadDoctors, loadAppointments]);

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (!error) setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (!error) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citas</h1>
          <p className="text-slate-500 mt-1">Gestiona tus citas médicas</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4" /> Nueva cita
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por paciente o doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input max-w-[180px]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No se encontraron citas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div key={apt.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{apt.patient_name}</p>
                    <p className="text-sm text-slate-600">
                      {apt.doctor.name} · {apt.doctor.specialty}
                    </p>
                    {apt.reason && <p className="text-sm text-slate-500 mt-1">{apt.reason}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(apt.scheduled_at).toLocaleString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {apt.patient_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {apt.patient_phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                    value={apt.status}
                    onChange={(e) => handleStatusChange(apt.id, e.target.value as AppointmentStatus)}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    onClick={() => {
                      setEditingId(apt.id);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    onClick={() => handleDelete(apt.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <span className={`badge ${STATUS_COLORS[apt.status]}`}>{STATUS_LABELS[apt.status]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AppointmentForm
          doctors={doctors}
          editingId={editingId}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadAppointments();
          }}
        />
      )}
    </div>
  );
}

interface AppointmentFormProps {
  doctors: Doctor[];
  editingId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

function AppointmentForm({ doctors, editingId, onClose, onSaved }: AppointmentFormProps) {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('pending');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', editingId)
        .maybeSingle();
      if (data) {
        setPatientName(data.patient_name);
        setPatientPhone(data.patient_phone ?? '');
        setDoctorId(data.doctor_id);
        setReason(data.reason ?? '');
        setScheduledAt(new Date(data.scheduled_at).toISOString().slice(0, 16));
        setStatus(data.status);
        setNotes(data.notes ?? '');
      }
    })();
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!doctorId) {
      setError('Selecciona un doctor');
      setSaving(false);
      return;
    }

    const payload = {
      patient_name: patientName,
      patient_phone: patientPhone || null,
      doctor_id: doctorId,
      reason: reason || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      status,
      notes: notes || null,
    };

    let result;
    if (editingId) {
      result = await supabase.from('appointments').update(payload).eq('id', editingId);
    } else {
      result = await supabase.from('appointments').insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? 'Editar cita' : 'Nueva cita'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Nombre del paciente *</label>
            <input
              className="input"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Teléfono</label>
              <input
                className="input"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="Número de contacto"
              />
            </div>
            <div>
              <label className="label">Doctor *</label>
              <select
                className="input"
                required
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="">Selecciona un doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Motivo de consulta</label>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Razón de la visita"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha y hora *</label>
              <input
                type="datetime-local"
                className="input"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones internas..."
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
