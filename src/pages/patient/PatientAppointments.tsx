import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Video, MapPin, Plus, X, Search } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useSettings } from '../../lib/settings';
import { supabase } from '../../lib/supabase';
import { fetchPatientByUser, fetchAppointmentsByPatient, fetchAllDoctors } from '../../lib/queries';
import { StatusBadge, formatDate, Spinner, EmptyState } from '../../lib/ui';
import type { Patient, AppointmentWithDetails, Doctor } from '../../types';

export default function PatientAppointments() {
  const { profile } = useAuth();
  const { t } = useSettings();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const pat = await fetchPatientByUser(profile.id);
    setPatient(pat);
    if (pat) {
      const appts = await fetchAppointmentsByPatient(pat.id);
      setAppointments(appts);
    }
    const docs = await fetchAllDoctors();
    setDoctors(docs);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const filtered = appointments.filter((a) => {
    const specialty = a.doctor?.specialty ?? '';
    return specialty.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.appointments')}</h1>
          <p className="text-slate-500 mt-1">{t('agenda.subtitle')}</p>
        </div>
        {patient && doctors.length > 0 && (
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> {t('agenda.newAppointment')}</button>
        )}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} message={t('agenda.noAppointments')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div key={apt.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  {apt.type === 'teleconsult' ? <Video className="w-5 h-5 text-blue-600" /> : <MapPin className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{apt.doctor ? `Dr. ${apt.doctor.specialty}` : ''}</p>
                  <p className="text-sm text-slate-600">{apt.reason || t('agenda.reasonPlaceholder')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(apt.scheduled_at)}</p>
                  {apt.type === 'teleconsult' && apt.teleconsult_link && (
                    <a href={apt.teleconsult_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                      {t('agenda.joinTeleconsult')}
                    </a>
                  )}
                </div>
                <StatusBadge status={apt.status} type="appointment" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && patient && (
        <AppointmentRequestForm patientId={patient.id} doctors={doctors} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function AppointmentRequestForm({ patientId, doctors, onClose, onSaved }: { patientId: string; doctors: Doctor[]; onClose: () => void; onSaved: () => void }) {
  const { t } = useSettings();
  const [doctorId, setDoctorId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    if (!doctorId) { setError(t('financial.selectDoctor')); setSaving(false); return; }
    const { error } = await supabase.from('appointments').insert({
      doctor_id: doctorId, patient_id: patientId,
      scheduled_at: new Date(scheduledAt).toISOString(),
      type: 'in_person', status: 'pending',
      reason: reason || null,
    });
    if (error) { setError(error.message); setSaving(false); } else { onSaved(); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t('agenda.newAppointment')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">{t('role.doctor')} {t('common.required')}</label>
            <select className="input" required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">{t('financial.selectDoctor')}</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.specialty}</option>)}
            </select>
          </div>
          <div><label className="label">{t('agenda.dateTime')} {t('common.required')}</label><input type="datetime-local" className="input" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
          <div><label className="label">{t('agenda.reason')}</label><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('agenda.reasonPlaceholder')} /></div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.saving') : t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
