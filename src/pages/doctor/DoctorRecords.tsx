import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X, FileText, Search } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useSettings } from '../../lib/settings';
import { supabase } from '../../lib/supabase';
import { fetchDoctorByUser, fetchMedicalRecordsByPatient } from '../../lib/queries';
import { fetchPatients } from '../../lib/queries';
import { Spinner, EmptyState, formatDate } from '../../lib/ui';
import type { Doctor, Patient, MedicalRecord } from '../../types';

export default function DoctorRecords() {
  const { profile } = useAuth();
  const { t } = useSettings();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const doc = await fetchDoctorByUser(profile.id);
    setDoctor(doc);
    const pats = await fetchPatients();
    setPatients(pats);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedPatient) { setRecords([]); return; }
    (async () => setRecords(await fetchMedicalRecordsByPatient(selectedPatient)))();
  }, [selectedPatient]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.delete'))) return;
    await supabase.from('medical_records').delete().eq('id', id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('records.title')}</h1>
          <p className="text-slate-500 mt-1">{t('records.subtitle')}</p>
        </div>
        {doctor && selectedPatient && (
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> {t('records.newRecord')}</button>
        )}
      </div>

      {!selectedPatient ? (
        <>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder={t('patients.searchPatient')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {filteredPatients.length === 0 ? (
            <EmptyState icon={FileText} message={t('records.noRecords')} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((p) => (
                <button key={p.id} onClick={() => setSelectedPatient(p.id)}
                  className="card p-4 text-left hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{p.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.phone ?? ''}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button onClick={() => setSelectedPatient('')} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
            <X className="w-4 h-4" /> {t('common.back')}
          </button>
          {records.length === 0 ? (
            <EmptyState icon={FileText} message={t('records.noRecords')} />
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div key={r.id} className="card p-4 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-slate-400 mb-2">{formatDate(r.created_at)}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.evolution}</p>
                    </div>
                    <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && doctor && selectedPatient && (
        <RecordForm doctorId={doctor.id} patientId={selectedPatient} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); (async () => setRecords(await fetchMedicalRecordsByPatient(selectedPatient)))(); }} />
      )}
    </div>
  );
}

function RecordForm({ doctorId, patientId, onClose, onSaved }: { doctorId: string; patientId: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useSettings();
  const [evolution, setEvolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const { error } = await supabase.from('medical_records').insert({
      doctor_id: doctorId, patient_id: patientId, evolution,
    });
    if (error) { setError(error.message); setSaving(false); } else { onSaved(); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t('records.newRecord')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">{t('records.evolution')} {t('common.required')}</label><textarea className="input min-h-[120px] resize-y" required value={evolution} onChange={(e) => setEvolution(e.target.value)} placeholder={t('records.evolutionPlaceholder')} /></div>
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
