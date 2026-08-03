import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { useSettings } from '../../lib/settings';
import { fetchPatients } from '../../lib/queries';
import { Spinner, EmptyState, formatDateShort } from '../../lib/ui';
import { PatientForm } from '../doctor/DoctorPatients';
import type { Patient } from '../../types';

export default function SecretaryPatients() {
  const { t } = useSettings();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPatients(await fetchPatients());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search) || p.email?.toLowerCase().includes(search.toLowerCase());
    const matchesActive = showInactive ? true : !p.inactive;
    return matchesSearch && matchesActive;
  });

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('patients.title')}</h1>
          <p className="text-slate-500 mt-1">{patients.length} {t('patients.registered')}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> {t('patients.newPatient')}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder={t('patients.searchPatient')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
          {t('patients.showInactive')}
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} message={t('patients.noPatients')} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{p.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  {p.date_of_birth && <p className="text-xs text-slate-400">{formatDateShort(p.date_of_birth)}</p>}
                </div>
                {p.inactive && <span className="badge bg-slate-100 text-slate-500 ml-auto">{t('patients.inactive')}</span>}
              </div>
              <div className="space-y-1 text-sm text-slate-500">
                {p.phone && <p>{p.phone}</p>}
                {p.email && <p className="truncate">{p.email}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <PatientForm editingId={null} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}
