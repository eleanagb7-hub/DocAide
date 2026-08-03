import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, X, Users, Phone, Mail, Cake, UserPlus } from 'lucide-react';
import { useSettings } from '../../lib/settings';
import { supabase } from '../../lib/supabase';
import { fetchPatients } from '../../lib/queries';
import { Spinner, EmptyState, formatDateShort } from '../../lib/ui';
import type { Patient } from '../../types';

export default function DoctorPatients() {
  const { t } = useSettings();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm(t('patients.deleteConfirm'))) return;
    await supabase.from('patients').delete().eq('id', id);
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleInactive = async (p: Patient) => {
    await supabase.from('patients').update({ inactive: !p.inactive }).eq('id', p.id);
    setPatients((prev) => prev.map((x) => (x.id === p.id ? { ...x, inactive: !x.inactive } : x)));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('patients.title')}</h1>
          <p className="text-slate-500 mt-1">{patients.length} {t('patients.registered')}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingId(null); setShowForm(true); }}>
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
            <div key={p.id} className="card p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    {p.date_of_birth && <p className="text-xs text-slate-400 flex items-center gap-1"><Cake className="w-3 h-3" />{formatDateShort(p.date_of_birth)}</p>}
                  </div>
                </div>
                {p.inactive && <span className="badge bg-slate-100 text-slate-500">{t('patients.inactive')}</span>}
              </div>
              <div className="space-y-1.5 text-sm text-slate-500">
                {p.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{p.phone}</p>}
                {p.email && <p className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{p.email}</p>}
              </div>
              <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                <button className="flex-1 text-sm text-slate-600 hover:bg-slate-100 rounded-lg py-1.5 transition" onClick={() => toggleInactive(p)}>
                  {p.inactive ? t('patients.activate') : t('patients.archive')}
                </button>
                <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition" onClick={() => { setEditingId(p.id); setShowForm(true); }}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <PatientForm editingId={editingId} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

export function PatientForm({ editingId, onClose, onSaved }: { editingId: string | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useSettings();
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      const { data } = await supabase.from('patients').select('*').eq('id', editingId).maybeSingle();
      if (data) {
        setName(data.name); setDateOfBirth(data.date_of_birth ?? ''); setPhone(data.phone ?? '');
        setEmail(data.email ?? ''); setAddress(data.address ?? ''); setEmergencyContact(data.emergency_contact ?? '');
      }
    })();
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const payload = {
      name, date_of_birth: dateOfBirth || null, phone: phone || null, email: email || null,
      address: address || null, emergency_contact: emergencyContact || null,
    };
    const result = editingId
      ? await supabase.from('patients').update(payload).eq('id', editingId)
      : await supabase.from('patients').insert(payload);
    if (result.error) { setError(result.error.message); setSaving(false); }
    else { onSaved(); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{editingId ? t('patients.editPatient') : t('patients.newPatient')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">{t('patients.fullName')} {t('common.required')}</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">{t('patients.dateOfBirth')}</label><input type="date" className="input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
            <div><label className="label">{t('patients.phone')}</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div><label className="label">{t('patients.email')}</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label">{t('patients.address')}</label><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div><label className="label">{t('patients.emergencyContact')}</label><input className="input" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder={t('patients.emergencyPlaceholder')} /></div>
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
